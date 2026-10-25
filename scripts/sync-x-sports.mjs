import { createClient } from "@supabase/supabase-js";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  buildLookupUrl,
  buildSearchUrl,
  chooseDiverseRoots,
  normalizeXPage,
  parseQueries,
  remainingReads,
  replyQuery,
} from "../src/lib/x-sports/sync-core.mjs";

// Run from a single server-side scheduler. Never import this module into a
// browser bundle or expose the bearer token through a public route.
// These accounts publish Arabic sports news, results and event coverage.
// The identities were checked against the outlets' own public profiles.
const DAILY_SPORTS_QUERIES = [
  '(from:beINSPORTSNews OR from:beINSPORTS OR from:kooora OR from:ariyadhiah OR from:fifacom_ar OR from:TeamSaudi) lang:ar min_replies:10 -is:retweet -is:reply',
  '("كرة القدم" OR "كرة السلة" OR "دوري أبطال أوروبا" OR "كأس العالم" OR "الدوري الإنجليزي" OR "الألعاب الأولمبية") (فوز OR هدف OR إصابة OR انتقال OR بطولة OR قرعة OR إعلان OR مباراة) lang:ar min_replies:10 -is:retweet -is:reply',
];

export function defaultQueries() {
  return DAILY_SPORTS_QUERIES;
}

const SPORTS_TREND = /(?:football|soccer|f[uú]tbol|champions|premier\s*league|la\s*liga|uefa|world\s*cup|basketball|\bnba\b|cricket|tennis|formula\s*1|\bf1\b|\bufc\b|olympics|باريس|برشلونة|ليفربول|مانشستر|مباراة|الدوري|دوري\s*أبطال|كرة\s*القدم|كرة\s*السلة|التنس|الكريكيت|psg|barcelona|madrid|arsenal|liverpool|chelsea|bayern|dortmund|inter|milan|napoli|atletico|atlético)/iu;

export function chooseSportsTrends(payload, limit = 2) {
  const seen = new Set();
  const names = [];
  for (const trend of payload?.data ?? []) {
    const name = String(trend.trend_name ?? trend.name ?? "").trim();
    const normalized = name.toLowerCase();
    if (!SPORTS_TREND.test(name) || name.length < 3 || name.length > 60 || seen.has(normalized)) continue;
    seen.add(normalized);
    names.push(name);
    if (names.length >= limit) break;
  }
  return names.map((name) => `"${name.replaceAll('"', "").replaceAll("\\", "")}" lang:ar min_replies:10 -is:retweet -is:reply`);
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function checkDb(result, operation) {
  if (result.error) throw new Error(`${operation}: ${result.error.message}`);
  return result.data;
}

function utcMidnight(now) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}

async function availableCredits(fetchImpl, token) {
  const response = await fetchImpl("https://api.x.com/2/usage/credits", {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Could not verify X API balance (HTTP ${response.status})`);
  const payload = await response.json();
  const amount = Number(payload?.data?.total_balance);
  if (!Number.isFinite(amount) || amount < 0) throw new Error("X API balance was unavailable");
  return amount;
}

export async function runSportsImport({ db, token, fetchImpl = fetch, now = new Date(), queries, allowSameDayRetry = false }) {
  const settings = checkDb(await db.from("x_sports_settings")
    .select("enabled,max_posts_per_run,max_replies_per_post,max_daily_reads,retention_hours,last_run_at")
    .eq("id", 1).single(), "Load X import settings");
  if (!settings.enabled) return { status: "disabled", reads: 0, posts: 0 };
  if (!allowSameDayRetry && settings.last_run_at?.slice(0, 10) === now.toISOString().slice(0, 10)) {
    return { status: "already_run_today", reads: 0, posts: 0 };
  }
  if (settings.max_replies_per_post < 3) {
    throw new Error("At least three replies per post must be configured before import");
  }
  // Raising settings requires an explicit spending decision; old settings keep
  // the original 60-read / three-root behavior. These are absolute ceilings.
  const dailyLimit = Math.min(600, settings.max_daily_reads);
  const maxRoots = Math.min(10, settings.max_posts_per_run);
  const maxReplies = Math.min(35, settings.max_replies_per_post);
  const largeConversations = maxReplies >= 31;
  const minimumReplies = largeConversations ? 31 : 3;
  if (!token) throw new Error("X bearer token is required when import is enabled");
  if (!Array.isArray(queries) || queries.length === 0) throw new Error("Sports search queries are required");
  const previousRuns = checkDb(await db.from("x_sports_runs")
    .select("post_reads").gte("ran_at", utcMidnight(now)), "Load daily read ledger") ?? [];
  const priorReads = previousRuns.reduce((sum, run) => sum + Number(run.post_reads || 0), 0);
  // A manual retry may use only the unspent daily allowance. Do not spend on
  // trends when there is no room for both a root search and its reply page.
  if (remainingReads(dailyLimit, priorReads) < 10 + Math.max(10, minimumReplies)) {
    return { status: "daily_budget_exhausted", reads: 0, posts: 0 };
  }
  if (await availableCredits(fetchImpl, token) < 0.17) {
    return { status: "insufficient_balance", reads: 0, posts: 0 };
  }
  let runReads = 0;
  let imported = 0;
  const seenBodies = new Set();

  const woeid = String(process.env.X_SPORTS_WOEID ?? "1");
  if (!/^\d{1,10}$/.test(woeid)) throw new Error("X_SPORTS_WOEID must be numeric");
  let trendQueries = [];
  let trendStatus = "failed";
  try {
    const trendResponse = await fetchImpl(`https://api.x.com/2/trends/by/woeid/${woeid}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(20_000),
    });
    if (trendResponse.ok) {
      trendQueries = chooseSportsTrends(await trendResponse.json());
      trendStatus = "completed";
    } else if (trendResponse.status === 401 || trendResponse.status === 403) {
      throw new Error(`Trend API denied the bearer token (HTTP ${trendResponse.status})`);
    }
  } catch (error) {
    // Trend lookup is optional; fixed competition queries keep the batch useful.
    process.stderr.write(`Trend discovery unavailable: ${error.message}\n`);
  }
  checkDb(await db.from("x_sports_runs").insert({
    post_reads: 0, api_calls: 1, query: `trends:${woeid}`, status: trendStatus,
  }), "Record trend call");
  const searchQueries = [...queries.slice(0, 2), ...trendQueries.slice(0, 1)].slice(0, 3)
    .map((query) => largeConversations
      ? `${query.replace(/\bmin_replies:\d+\b/gu, "").trim()} min_replies:50`
      : query);
  const selectedRoots = [];

  async function requestX(url, query, reserved) {
    if (remainingReads(dailyLimit, priorReads, runReads) < reserved) return null;
    // One returned Post plus one distinct author can cost up to $0.015.
    // Stop before a call if prepaid credit cannot cover its maximum page.
    if (await availableCredits(fetchImpl, token) < reserved * 0.015 + 0.005) return null;
    // Reserve before the charge can happen. A network failure or failed ledger
    // settlement keeps the conservative reservation, preventing unsafe retries.
    const reservation = checkDb(await db.from("x_sports_runs").insert({
      post_reads: reserved, api_calls: 1, query: query.slice(0, 500), status: "reserved",
    }).select("id").single(), "Reserve X read usage");
    if (!reservation?.id) throw new Error("Read reservation ID was unavailable");
    runReads += reserved;
    const response = await fetchImpl(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Error(`X API returned HTTP ${response.status}`);
    const payload = await response.json();
    if (payload.data !== undefined && !Array.isArray(payload.data)) {
      throw new Error("X API returned an invalid Post collection");
    }
    const count = payload.data?.length ?? 0;
    if (count > reserved) throw new Error("X API exceeded its reserved page size");
    checkDb(await db.from("x_sports_runs").update({
      post_reads: count, status: "completed",
    }).eq("id", reservation.id), "Settle X read usage");
    runReads -= reserved - count;
    return payload;
  }

  async function storeRows(rows) {
    if (!rows.length) return;
    const ids = rows.map((row) => row.x_id);
    const existing = checkDb(await db.from("x_sports_posts")
      .select("x_id,expires_at,imported_at").in("x_id", ids), "Check imported X posts") ?? [];
    const existingById = new Map(existing.map((row) => [row.x_id, row]));
    const merged = rows.map((row) => {
      const old = existingById.get(row.x_id);
      return old ? { ...row, expires_at: old.expires_at, imported_at: old.imported_at } : row;
    });
    checkDb(await db.from("x_sports_posts").upsert(merged, { onConflict: "x_id" }), "Store X posts");
    imported += merged.length;
  }

  // Re-check older copies before adding new ones, so edits, protection and
  // deletion are reflected even when an item no longer appears in search.
  const staleBefore = new Date(now.getTime() - 60 * 60_000).toISOString();
  const stale = checkDb(await db.from("x_sports_posts")
    .select("x_id,expires_at,imported_at,matched_query")
    .eq("is_visible", true).is("deleted_at", null)
    .gt("expires_at", now.toISOString())
    .lt("last_synced_at", staleBefore)
    .order("last_synced_at", { ascending: true }).limit(10), "Load stale copies") ?? [];
  const lookupIds = stale.slice(0, Math.max(0, remainingReads(dailyLimit, priorReads, runReads) - 20))
    .map((row) => row.x_id);
  if (lookupIds.length) {
    const result = await requestX(buildLookupUrl(lookupIds), "lookup:sync", lookupIds.length);
    if (result) {
      const refreshed = normalizeXPage(result, {
        matchedQuery: "lookup:sync", now, retentionHours: settings.retention_hours, requireArabic: true,
      });
      const oldById = new Map(stale.map((row) => [row.x_id, row]));
      const allowed = refreshed.map((row) => ({
        ...row,
        expires_at: oldById.get(row.x_id)?.expires_at ?? row.expires_at,
        imported_at: oldById.get(row.x_id)?.imported_at,
        matched_query: oldById.get(row.x_id)?.matched_query ?? row.matched_query,
      }));
      await storeRows(allowed);
      const returned = new Set(allowed.map((row) => row.x_id));
      for (const id of lookupIds.filter((id) => !returned.has(id))) {
        checkDb(await db.from("x_sports_posts")
          .update({ is_visible: false, deleted_at: now.toISOString(), last_synced_at: now.toISOString() })
          .eq("x_id", id), "Hide unavailable X post");
      }
    }
  }

  if (largeConversations) {
    const pool = [];
    const attempted = new Set();
    const qualifiedRoots = [];
    const searchStates = searchQueries.map((query) => ({ query, token: undefined, done: false, pages: 0 }));
    let searchReads = 0;
    const maxSearchReads = Math.min(120, Math.max(10, Math.floor(dailyLimit / 5)));

    async function loadCandidates(search) {
      if (search.done || search.pages >= 4 || searchReads + 10 > maxSearchReads ||
          remainingReads(dailyLimit, priorReads, runReads) < 10 + minimumReplies) return false;
      const url = buildSearchUrl(search.query, 10, search.token);
      url.searchParams.set("start_time", utcMidnight(now));
      const result = await requestX(url, search.query, 10);
      if (!result) { search.done = true; return false; }
      searchReads += result.data?.length ?? 0;
      search.pages += 1;
      const previousToken = search.token;
      search.token = result.meta?.next_token;
      search.done = !search.token || search.token === previousToken;
      const ranked = { ...result, data: [...(result.data ?? [])]
        .filter((post) => Number(post.public_metrics?.reply_count ?? 0) >= 50)
        .sort((a, b) => Number(b.public_metrics.reply_count) - Number(a.public_metrics.reply_count)) };
      const rows = normalizeXPage(ranked, {
        matchedQuery: search.query, now, retentionHours: settings.retention_hours, requireArabic: true,
      });
      for (const row of rows) {
        if (row.in_reply_to_x_id || attempted.has(row.x_id) || pool.some((item) => item.x_id === row.x_id)) continue;
        const fingerprint = row.body.toLocaleLowerCase().replace(/https?:\/\/\S+/gu, "")
          .replace(/[^\p{L}\p{N}]+/gu, " ").trim();
        if (seenBodies.has(fingerprint)) continue;
        seenBodies.add(fingerprint);
        pool.push(row);
      }
      return true;
    }

    // Sample all available source groups first; preserve enough reads for replies.
    for (const search of searchStates) await loadCandidates(search);
    while (qualifiedRoots.length < maxRoots && remainingReads(dailyLimit, priorReads, runReads) >= minimumReplies) {
      let [root] = chooseDiverseRoots(pool.filter((item) => !attempted.has(item.x_id)), qualifiedRoots, 1);
      if (!root) {
        let loaded = false;
        for (const search of searchStates) loaded = await loadCandidates(search) || loaded;
        if (!loaded) break;
        [root] = chooseDiverseRoots(pool.filter((item) => !attempted.has(item.x_id)), qualifiedRoots, 1);
        if (!root) continue;
      }
      attempted.add(root.x_id);
      const replies = [];
      const seenReplyIds = new Set();
      const seenTokens = new Set();
      let nextToken;
      let conversationReads = 0;
      let replyPages = 0;
      // Allow filtering/pagination, but one noisy thread cannot consume the day.
      // Reserve a first target-size page for each still-needed conversation.
      const remaining = remainingReads(dailyLimit, priorReads, runReads);
      const laterRoots = Math.min(maxRoots - qualifiedRoots.length - 1,
        Math.max(0, Math.floor(remaining / maxReplies) - 1));
      const conversationLimit = Math.min(maxReplies * 3, remaining - laterRoots * maxReplies);
      while (replies.length < maxReplies && replyPages < 12) {
        const allowance = Math.min(remainingReads(dailyLimit, priorReads, runReads), conversationLimit - conversationReads);
        if (allowance < 10) break;
        const pageSize = Math.min(allowance, Math.max(10, maxReplies - replies.length));
        const url = buildSearchUrl(replyQuery(root.x_id), pageSize, nextToken);
        url.searchParams.set("start_time", utcMidnight(now));
        const result = await requestX(url, `replies:${root.x_id}`, pageSize);
        if (!result) break;
        replyPages += 1;
        conversationReads += result.data?.length ?? 0;
        const rows = normalizeXPage(result, {
          matchedQuery: root.matched_query, now, retentionHours: settings.retention_hours, requireArabic: true,
        });
        for (const row of rows) {
          if (row.in_reply_to_x_id !== root.x_id || row.conversation_id !== root.x_id || seenReplyIds.has(row.x_id)) continue;
          seenReplyIds.add(row.x_id);
          replies.push(row);
          if (replies.length >= maxReplies) break;
        }
        nextToken = result.meta?.next_token;
        if (!nextToken || seenTokens.has(nextToken)) break;
        seenTokens.add(nextToken);
      }
      if (replies.length >= minimumReplies) {
        await storeRows([root, ...replies]);
        qualifiedRoots.push(root);
      }
    }
    checkDb(await db.from("x_sports_settings")
      .update({ last_run_at: now.toISOString() }).eq("id", 1), "Update last import time");
    return { status: "completed", reads: runReads, posts: imported, roots: qualifiedRoots.length,
      targetRoots: maxRoots, minimumReplies, targetReplies: maxReplies };
  }

  // A stale-copy lookup can consume ten reads. Use fewer search pages in that
  // case and choose multiple different roots from each, preserving a reply
  // page for every selected root within the hard daily budget.
  const plannedSearchPages = Math.min(searchQueries.length,
    Math.floor(remainingReads(dailyLimit, priorReads, runReads) / 20));
  const rootsPerQuery = Math.max(1, Math.ceil(maxRoots / Math.max(plannedSearchPages, 1)));

  // Recent Search covers only the last seven days. Keep this daily job on
  // today's UTC sports news and events, with a reply page reserved per root.
  for (const query of searchQueries) {
      const remaining = remainingReads(dailyLimit, priorReads, runReads);
      if (selectedRoots.length >= maxRoots || remaining < 20 + selectedRoots.length * 10) break;
      const url = buildSearchUrl(query, 10);
      url.searchParams.set("start_time", utcMidnight(now));
      const result = await requestX(url, query, 10);
      if (!result) break;
      const rankedResult = {
        ...result,
        data: [...(result.data ?? [])]
          .filter((post) => Number(post.public_metrics?.reply_count ?? 0) >= 10)
          .sort((a, b) =>
          Number(b.public_metrics?.reply_count ?? 0) - Number(a.public_metrics?.reply_count ?? 0)),
      };
      const candidates = normalizeXPage(rankedResult, {
        matchedQuery: query, now, retentionHours: settings.retention_hours, requireArabic: true,
      }).filter((row) => !row.in_reply_to_x_id && row.body.trim())
        .filter((row) => {
          const fingerprint = row.body.toLocaleLowerCase().replace(/https?:\/\/\S+/gu, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
          if (seenBodies.has(fingerprint)) return false;
          seenBodies.add(fingerprint);
          return true;
        });
      const accepted = chooseDiverseRoots(candidates, selectedRoots,
        Math.min(maxRoots - selectedRoots.length, rootsPerQuery,
          Math.floor((remainingReads(dailyLimit, priorReads, runReads) - selectedRoots.length * 10) / 10)));
      selectedRoots.push(...accepted);
  }

  // Round-robin gives every selected match one reply page before any single
  // conversation consumes another page of the paid budget.
  const replyStates = selectedRoots.map((root) => ({ root, token: undefined, replies: [], done: false }));
  while (replyStates.some((state) => !state.done) &&
         remainingReads(dailyLimit, priorReads, runReads) >= 10) {
    let progressed = false;
    for (const state of replyStates) {
      if (state.done || remainingReads(dailyLimit, priorReads, runReads) < 10) continue;
      const remainingReplyBudget = remainingReads(dailyLimit, priorReads, runReads);
      const replySize = Math.max(10, Math.min(100, maxReplies - state.replies.length, remainingReplyBudget));
      const replyUrl = buildSearchUrl(replyQuery(state.root.x_id), replySize, state.token);
      replyUrl.searchParams.set("start_time", utcMidnight(now));
      const replyResult = await requestX(replyUrl, `replies:${state.root.x_id}`, replySize);
      if (!replyResult) { state.done = true; continue; }
      const replyRows = normalizeXPage(replyResult, {
        matchedQuery: state.root.matched_query, now, retentionHours: settings.retention_hours, requireArabic: true,
      }).filter((row) => row.in_reply_to_x_id === state.root.x_id && row.body.trim());
      const seenReplyIds = new Set(state.replies.map((row) => row.x_id));
      const acceptedReplies = replyRows.filter((row) => {
        if (seenReplyIds.has(row.x_id)) return false;
        seenReplyIds.add(row.x_id);
        return true;
      }).slice(0, maxReplies - state.replies.length);
      state.replies.push(...acceptedReplies);
      state.token = replyResult.meta?.next_token;
      state.done = !state.token || state.replies.length >= maxReplies;
      progressed = true;
    }
    if (!progressed) break;
  }

  let roots = 0;
  for (const state of replyStates) {
    if (state.replies.length < 3) continue;
    await storeRows([state.root, ...state.replies]);
    roots += 1;
  }

  checkDb(await db.from("x_sports_settings")
    .update({ last_run_at: now.toISOString() }).eq("id", 1), "Update last import time");
  return { status: "completed", reads: runReads, posts: imported, roots };
}

async function main() {
  if (process.env.X_IMPORT_ENABLED !== "true") {
    process.stdout.write("X sports import is disabled by X_IMPORT_ENABLED.\n");
    return;
  }
  const db = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const now = new Date();
  const queries = process.env.X_SPORTS_QUERIES
    ? parseQueries(process.env.X_SPORTS_QUERIES)
    : defaultQueries(now);
  const result = await runSportsImport({
    db, token: requireEnv("X_BEARER_TOKEN"), now, queries,
    allowSameDayRetry: process.argv.includes("--retry-today"),
  });
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--retry-today") || args.length > 1) {
    throw new Error("Supported option: --retry-today (manual retry within the existing daily read cap)");
  }
  if (process.env.X_SPORTS_LOCKED !== "1") {
    // util-linux flock holds an OS lock for the entire child lifetime. This
    // prevents overlapping cron/manual runs on the single application host.
    const lockPath = process.env.X_SPORTS_LOCK_FILE ?? "/tmp/arabtips-sports-sync.lock";
    if (!lockPath.startsWith("/tmp/") || lockPath.includes("..")) {
      throw new Error("X_SPORTS_LOCK_FILE must be an absolute path below /tmp");
    }
    const locked = spawnSync("flock", ["-n", lockPath, process.execPath, resolve(process.argv[1]), ...args], {
      stdio: "inherit",
      env: { ...process.env, X_SPORTS_LOCKED: "1" },
    });
    if (locked.error) throw locked.error;
    process.exitCode = locked.status ?? 1;
  } else {
    main().catch((error) => {
      // Do not log bearer tokens or API payloads.
      process.stderr.write(`X sports import failed: ${error.message}\n`);
      process.exitCode = 1;
    });
  }
}
