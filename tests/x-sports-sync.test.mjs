import test from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  buildLookupUrl,
  buildSearchUrl,
  chooseDiverseRoots,
  hasSourceBrand,
  isArabicPost,
  isSpammyPost,
  normalizeXPage,
  parseQueries,
  remainingReads,
  replyQuery,
  safeHttpsUrl,
  sportsTopic,
} from "../src/lib/x-sports/sync-core.mjs";
import { chooseSportsTrends, defaultQueries, runSportsImport } from "../scripts/sync-x-sports.mjs";

test("recent search encodes sports terms and never accepts an unbounded page", () => {
  const url = buildSearchUrl('PSG Barcelona lang:es -is:retweet', 10, "next-token");
  assert.equal(url.origin, "https://api.x.com");
  assert.equal(url.searchParams.get("query"), 'PSG Barcelona lang:es -is:retweet');
  assert.equal(url.searchParams.get("next_token"), "next-token");
  assert.equal(url.searchParams.get("max_results"), "10");
  assert.match(url.searchParams.get("tweet.fields"), /referenced_tweets/);
  assert.throws(() => buildSearchUrl("PSG", 101), /between 10 and 100/);
  assert.equal(replyQuery("123456789"), "in_reply_to_tweet_id:123456789 lang:ar -is:retweet -has:links");
  assert.equal(buildLookupUrl(["123456789"]).searchParams.get("ids"), "123456789");
});

test("normalizer preserves author, full text, media, links, and reply parent", () => {
  const now = new Date("2026-10-20T20:00:00Z");
  const payload = {
    data: [{
      id: "123456789", author_id: "77", conversation_id: "111111111",
      referenced_tweets: [{ type: "replied_to", id: "111111111" }],
      text: "Short", note_tweet: { text: "Full reply about PSG and Barcelona" },
      public_metrics: { like_count: 5, reply_count: 1, repost_count: 0 },
      created_at: "2026-10-20T18:00:00Z", lang: "en",
      attachments: { media_keys: ["3_1"] },
      entities: { urls: [{ expanded_url: "https://example.org/match", display_url: "example.org/match" }] },
    }],
    includes: {
      users: [{ id: "77", username: "fan77", name: "Football Fan", profile_image_url: "https://pbs.twimg.com/face.jpg", protected: false }],
      media: [{ media_key: "3_1", type: "photo", url: "https://pbs.twimg.com/photo.jpg", alt_text: "match" }],
    },
  };
  const [row] = normalizeXPage(payload, { matchedQuery: "PSG Barcelona", now, retentionHours: 48 });
  assert.equal(row.body, "Full reply about PSG and Barcelona");
  assert.equal(row.in_reply_to_x_id, "111111111");
  assert.equal(row.author_name, "Football Fan");
  assert.equal(row.author_avatar_url, "https://pbs.twimg.com/face.jpg");
  assert.equal(row.media_json[0].alt_text, "match");
  assert.equal(row.links_json[0].url, "https://example.org/match");
  assert.equal(row.expires_at, "2026-10-22T20:00:00.000Z");
  payload.includes.users[0].protected = true;
  assert.deepEqual(normalizeXPage(payload, { matchedQuery: "", now, retentionHours: 48 }), []);
});

test("attached-media placeholders are omitted without rejecting Arabic posts or altering their prose", () => {
  const prose = "⚽🔥 برشلونة يحقق الفوز في مباراة مثيرة بهدف حاسم في الدقائق الأخيرة";
  const post = {
    id: "123456789", author_id: "77", conversation_id: "123456789",
    text: `${prose} https://t.co/media1`, lang: "ar", created_at: "2026-10-20T18:00:00Z",
    public_metrics: { like_count: 25, reply_count: 15, repost_count: 4 },
    attachments: { media_keys: ["3_1"] },
    entities: { urls: [{ url: "https://t.co/media1", media_key: "3_1",
      expanded_url: "https://x.com/sports77/status/123456789/photo/1", display_url: "pic.twitter.com/media1" }] },
  };
  const payload = {
    data: [post],
    includes: {
      users: [{ id: "77", username: "sports77", name: "أخبار الملاعب", protected: false }],
      media: [{ media_key: "3_1", type: "photo", url: "https://pbs.twimg.com/photo.jpg" }],
    },
  };
  const options = { matchedQuery: "رياضة", now: new Date("2026-10-20T20:00:00Z"), retentionHours: 48, requireArabic: true };
  for (const useMediaKey of [true, false]) {
    if (!useMediaKey) delete post.entities.urls[0].media_key;
    assert.equal(isSpammyPost(post), false);
    const [row] = normalizeXPage(payload, options);
    assert.equal(row.body, prose);
    assert.equal(row.media_json.length, 1);
    assert.deepEqual(row.links_json, []);
  }
  post.note_tweet = { text: `${prose} مع تفاصيل إضافية https://t.co/media1`, entities: post.entities };
  assert.equal(normalizeXPage(payload, options)[0].body, `${prose} مع تفاصيل إضافية`);

  post.entities.urls[0].expanded_url = "https://x.com/sports77/status/999999999/photo/1";
  assert.deepEqual(normalizeXPage(payload, options), [], "another post's media link is not an attachment placeholder");
  post.entities.urls[0].expanded_url = "https://x.com/sports77/status/123456789/photo/1";
  post.attachments.media_keys = [];
  assert.deepEqual(normalizeXPage(payload, options), [], "a matching URL without an attachment remains a source link");
});

test("query and URL guards reject unsafe or unbounded inputs", () => {
  assert.equal(safeHttpsUrl("javascript:alert(1)"), null);
  assert.equal(safeHttpsUrl("http://example.org"), null);
  assert.throws(() => parseQueries('["ok"]'), /JSON array/);
  assert.throws(() => parseQueries('not json'));
  assert.deepEqual(parseQueries('["PSG Barcelona"]'), ["PSG Barcelona"]);
  assert.equal(remainingReads(100, 88, 9), 3);
  assert.equal(remainingReads(100, 101, 0), 0);
});

test("spam screen excludes fake streams, link farms and near-empty posts", () => {
  assert.equal(isSpammyPost({ text: "Watch PSG vs Barcelona live stream FREE", entities: { urls: [{ url: "https://bad.example" }] } }), true);
  assert.equal(isSpammyPost({ text: "مشاهدة المباراة بث مباشر مجانا الآن" }), true);
  assert.equal(isSpammyPost({ text: "CHAMPIONS LEAGUE ce soir ! Lien direct Telegram en bio pour voir les matchs PSG vs Barcelone" }), true);
  assert.equal(isSpammyPost({ text: "رابط المباراة موجود في البايو، تابعوني لمشاهدة برشلونة" }), true);
  assert.equal(isSpammyPost({ text: "PSG versus Barcelona tonight?" }), false);
  assert.equal(isSpammyPost({ text: "PSG versus Barcelona tonight?", entities: { urls: [{ url: "https://example.org" }] } }), true);
  assert.equal(isSpammyPost({ text: "Discussing PSG Barcelona on Twitter now" }), true);
  assert.equal(isSpammyPost({ text: "Discussing PSG Barcelona https://t.co/abc" }), true);
  assert.equal(isSpammyPost({ text: "Discussing PSG Barcelona pic.twitter.com/abc" }), true);
  assert.equal(isSpammyPost({ text: "Match discussion on X was lively tonight" }), true);
  assert.equal(isSpammyPost({ text: "X is where the match is being discussed" }), true);
  assert.equal(hasSourceBrand("Twitter Sports"), true);
  assert.equal(hasSourceBrand("TwitterSports"), true);
  assert.equal(hasSourceBrand("xSports"), true);
  assert.equal(hasSourceBrand("@X_sports"), true);
  assert.equal(hasSourceBrand("X_football"), true);
  assert.equal(hasSourceBrand("pic.twitter.com/photo"), true);
  assert.equal(hasSourceBrand("X"), true);
  assert.equal(hasSourceBrand("شاهد الخبر على اكس اليوم"), true);
});

test("Arabic gate rejects English and mostly English posts even when tagged Arabic", () => {
  assert.equal(isArabicPost({ lang: "en", text: "برشلونة يفوز في مباراة مهمة الليلة" }), false);
  assert.equal(isArabicPost({ lang: "ar", text: "Barcelona beats PSG with goals galore والله" }), false);
  assert.equal(isArabicPost({ lang: "ar", text: "برشلونة يفوز في مباراة مهمة الليلة" }), true);
});

test("root selection covers distinct fixtures before taking a second item from one match", () => {
  const rows = [
    { body: "PSG vs Barcelona: the first half was frantic", matched_query: "UCL" },
    { body: "Barcelona and PSG are going to extra time", matched_query: "UCL" },
    { body: "Liverpool and Villarreal lineups announced", matched_query: "UCL" },
    { body: "Porto and PSV are level after 70 minutes", matched_query: "UCL" },
  ];
  assert.equal(sportsTopic(rows[0].body), "match:barcelona:psg");
  const picked = chooseDiverseRoots(rows, [], 3);
  assert.deepEqual(picked, [rows[0], rows[2], rows[3]]);
  assert.deepEqual(chooseDiverseRoots(rows, [rows[0]], 2), [rows[2], rows[3]]);
});

test("daily queries seek Arabic news and events with substantial discussion", () => {
  const queries = defaultQueries();
  assert.equal(queries.length, 2);
  assert.match(queries[0], /from:beINSPORTSNews/);
  assert.match(queries[0], /from:kooora/);
  assert.match(queries[1], /انتقال/);
  for (const query of queries) {
    assert.match(query, /lang:ar/);
    assert.match(query, /min_replies:10/);
    assert.match(query, /-is:reply/);
  }
});

test("trend discovery keeps only sports topics and removes duplicates", () => {
  const chosen = chooseSportsTrends({ data: [
    { trend_name: "#Barcelona" }, { trend_name: "#Barcelona" },
    { trend_name: "New phone launch" }, { trend_name: "Champions League" },
  ] });
  assert.equal(chosen.length, 2);
  assert.match(chosen[0], /Barcelona/);
  assert.match(chosen[1], /Champions League/);
  assert.ok(chosen.every((query) => query.includes("lang:ar min_replies:10")));
});

test("disabled import does not touch the paid API", async () => {
  const db = { from: () => ({
    select() { return this; }, eq() { return this; },
    async single() { return { data: { enabled: false }, error: null }; },
  }) };
  const result = await runSportsImport({
    db, token: "unused", now: new Date("2026-10-20T19:00:00Z"), queries: ["PSG"],
    fetchImpl: () => { throw new Error("API must remain untouched"); },
  });
  assert.equal(result.status, "disabled");
});

test("empty balance stops before trends or search", async () => {
  const db = { from: (table) => ({
    select() { return this; }, eq() { return this; },
    gte() { return this; },
    async single() { return { data: { enabled: true, max_replies_per_post: 3, max_daily_reads: 60, max_posts_per_run: 3, last_run_at: null }, error: null }; },
    then(resolve) { resolve({ data: table === "x_sports_runs" ? [] : null, error: null }); },
  }) };
  const calls = [];
  const result = await runSportsImport({
    db, token: "test-token", now: new Date("2026-10-20T19:00:00Z"), queries: ["PSG"],
    fetchImpl: async (url) => {
      calls.push(String(url));
      return { ok: true, json: async () => ({ data: { total_balance: 0 } }) };
    },
  });
  assert.equal(result.status, "insufficient_balance");
  assert.deepEqual(calls, ["https://api.x.com/2/usage/credits"]);
});

test("CLI refuses a concurrent run when its OS lock is held", async () => {
  const lockPath = `/tmp/arabtips-sports-test-${randomUUID()}.lock`;
  const holder = spawn("flock", ["-n", lockPath, "sleep", "2"], { stdio: "ignore" });
  try {
    await new Promise((resolve) => setTimeout(resolve, 120));
    const contender = spawnSync(process.execPath, ["scripts/sync-x-sports.mjs"], {
      cwd: new URL("..", import.meta.url).pathname,
      env: { ...process.env, X_IMPORT_ENABLED: "false", X_SPORTS_LOCK_FILE: lockPath },
      encoding: "utf8",
    });
    assert.equal(contender.status, 1);
  } finally {
    holder.kill();
  }
});

function batchFixture({ failUpsertAt = 0, repliesPerRoot = 3, englishRootId = null, staleCount = 0, lastRunAt = null, priorReads = 0 } = {}) {
  const state = { ledger: priorReads ? [{ post_reads: priorReads, query: "previous:test" }] : [], stored: [], updatedAt: null, upserts: 0, paidCalls: 0 };
  const staleRows = Array.from({ length: staleCount }, (_, i) => ({
    x_id: String(900 + i), expires_at: "2026-10-22T00:00:00Z",
    imported_at: "2026-10-19T00:00:00Z", matched_query: "old:news",
  }));
  const settings = {
    enabled: true, max_posts_per_run: 3, max_replies_per_post: 3,
    max_daily_reads: 60, retention_hours: 48, last_run_at: lastRunAt,
  };
  const db = {
    from(table) {
      const chain = {
        select() { return this; }, eq(key, value) { this.filters ??= {}; this.filters[key] = value; return this; }, gte() { return this; },
        gt() { return this; }, lt() { this.staleQuery = true; return this; }, is() { return this; },
        in() { return this; }, order() { return this; }, limit() { return this; },
        single() { return Promise.resolve({ data: this.inserted ?? settings, error: null }); },
        insert(row) { this.inserted = { ...row, id: state.ledger.length + 1 }; state.ledger.push(this.inserted); return this; },
        upsert(rows) {
          state.upserts += 1;
          if (state.upserts === failUpsertAt) return Promise.resolve({ data: null, error: { message: "simulated write failure" } });
          state.stored.push(...rows);
          return Promise.resolve({ data: null, error: null });
        },
        update(patch) {
          if (table === "x_sports_settings") state.updatedAt = patch.last_run_at;
          this.patch = patch;
          return this;
        },
        then(resolve) {
          if (table === "x_sports_runs" && this.patch) {
            Object.assign(state.ledger.find((row) => row.id === this.filters.id), this.patch);
          }
          const data = table === "x_sports_posts" && this.staleQuery ? staleRows :
            table === "x_sports_runs" ? state.ledger : table === "x_sports_posts" ? [] : null;
          resolve({ data, error: null });
        },
      };
      return chain;
    },
  };
  const fixtures = [
    ["101", "باريس وبرشلونة يتبادلان الفرص في مباراة قوية الليلة"],
    ["201", "ليفربول وفياريال يعلنان تشكيلتيهما قبل مواجهة الليلة"],
    ["301", "بورتو وآيندهوفن يقدمان مباراة مثيرة ومليئة بالفرص"],
  ];
  let searchIndex = 0;
  const makePost = (id, text, parent, language = "ar") => ({
    id, author_id: `7${id}`, conversation_id: parent ?? id,
    ...(parent ? { referenced_tweets: [{ type: "replied_to", id: parent }] } : {}),
    text, created_at: "2026-10-20T19:00:00Z", lang: language,
    public_metrics: { like_count: 5, reply_count: parent ? 0 : 12, repost_count: 0 },
  });
  const makePage = (valid, suffix) => ({
    data: [valid, ...Array.from({ length: 9 }, (_, i) => makePost(`${suffix}${i}`, "spam"))],
    includes: { users: [{ id: valid.author_id, name: `Fan ${valid.id}`, username: `fan${valid.id}` }] },
  });
  const fetchImpl = async (rawUrl) => {
    const url = new URL(String(rawUrl));
    if (url.pathname === "/2/usage/credits") return { ok: true, json: async () => ({ data: { total_balance: 5 } }) };
    if (url.pathname.includes("/trends/")) {
      state.paidCalls += 1;
      return { ok: true, json: async () => ({ data: [{ trend_name: "Champions League" }] }) };
    }
    state.paidCalls += 1;
    if (url.pathname === "/2/tweets") {
      const posts = staleRows.map((row) => makePost(row.x_id, "خبر رياضي عربي قديم مع تفاصيل المباراة وأحداثها"));
      return { ok: true, json: async () => ({ data: posts, includes: { users: posts.map((post) => ({
        id: post.author_id, name: `محرر ${post.id}`, username: `old${post.id}`,
      })) } }) };
    }
    const query = url.searchParams.get("query") ?? "";
    if (query.startsWith("in_reply_to_tweet_id:")) {
      const rootId = query.match(/\d+/)?.[0] ?? "101";
      const replies = Array.from({ length: repliesPerRoot }, (_, i) => {
        const id = String(Number(rootId) + 300 + i);
        return makePost(id, `تعليق عربي مفصل على أحداث المباراة وأداء الفريق رقم ${i + 1}`, rootId);
      });
      return { ok: true, json: async () => ({
        data: [
          ...replies,
          ...Array.from({ length: 10 - replies.length }, (_, i) => makePost(`49${i}`, "spam", rootId)),
        ],
        includes: { users: replies.map((reply) => ({
          id: reply.author_id, name: `مشجع ${reply.id}`, username: `replyfan${reply.id}`,
        })) },
      }) };
    }
    const [id, text] = fixtures[searchIndex++];
    return { ok: true, json: async () => makePage(makePost(id, text, null, id === englishRootId ? "en" : "ar"), id) };
  };
  return { db, fetchImpl, state };
}

test("paid daily batch respects read cap, keeps several fixtures and replies, and marks success last", async () => {
  const { db, fetchImpl, state } = batchFixture();
  const now = new Date("2026-10-20T20:00:00Z");
  const result = await runSportsImport({
    db, fetchImpl, token: "test-token", now,
    queries: ["PSG Barcelona", "Liverpool Villarreal"],
  });
  assert.equal(result.status, "completed");
  assert.equal(result.reads, 60);
  assert.equal(result.roots, 3);
  assert.equal(result.posts, 12);
  assert.equal(state.ledger.reduce((sum, row) => sum + row.post_reads, 0), 60);
  assert.equal(state.paidCalls, 7); // One trend, three searches, three reply pages.
  assert.deepEqual(new Set(state.stored.filter((row) => !row.in_reply_to_x_id).map((row) => sportsTopic(row.body))),
    new Set(["match:barcelona:psg", "match:liverpool:villarreal", "match:porto:psv"]));
  for (const rootId of ["101", "201", "301"]) {
    assert.equal(state.stored.filter((row) => row.in_reply_to_x_id === rootId).length, 3);
  }
  assert.equal(state.updatedAt, now.toISOString());
});

test("roots without three fetched Arabic replies are never stored", async () => {
  const { db, fetchImpl, state } = batchFixture({ repliesPerRoot: 0 });
  const result = await runSportsImport({
    db, fetchImpl, token: "test-token", now: new Date("2026-10-20T20:00:00Z"),
    queries: defaultQueries(),
  });
  assert.equal(result.roots, 0);
  assert.equal(result.posts, 0);
  assert.deepEqual(state.stored, []);
  assert.ok(result.reads <= 60);
});

test("English search results are rejected even when the query asks for Arabic", async () => {
  const { db, fetchImpl, state } = batchFixture({ englishRootId: "101" });
  const result = await runSportsImport({
    db, fetchImpl, token: "test-token", now: new Date("2026-10-20T20:00:00Z"),
    queries: defaultQueries(),
  });
  assert.equal(result.roots, 2);
  assert.ok(state.stored.every((row) => row.language === "ar"));
  assert.ok(state.stored.every((row) => row.x_id !== "101"));
  assert.ok(result.reads <= 60);
});

test("stale recheck leaves enough reads for new roots and their real replies", async () => {
  const { db, fetchImpl, state } = batchFixture({ staleCount: 10 });
  const result = await runSportsImport({
    db, fetchImpl, token: "test-token", now: new Date("2026-10-20T20:00:00Z"),
    queries: defaultQueries(),
  });
  assert.equal(result.roots, 2);
  assert.equal(result.reads, 50);
  assert.ok(state.stored.some((row) => row.x_id === "101"));
  assert.ok(state.stored.some((row) => row.x_id === "201"));
  assert.ok(state.stored.filter((row) => row.in_reply_to_x_id === "101").length >= 3);
});

test("failed storage leaves daily success marker unset even after paid reads", async () => {
  const { db, fetchImpl, state } = batchFixture({ failUpsertAt: 2 });
  await assert.rejects(runSportsImport({
    db, fetchImpl, token: "test-token", now: new Date("2026-10-20T20:00:00Z"),
    queries: ["PSG Barcelona", "Liverpool Villarreal"],
  }), /Store X posts: simulated write failure/);
  assert.equal(state.updatedAt, null);
  assert.ok(state.ledger.some((row) => row.post_reads > 0));
});

test("normal scheduler skips the same day without making any HTTP request", async () => {
  const { db, state } = batchFixture({ lastRunAt: "2026-10-20T18:00:00Z", priorReads: 30 });
  const result = await runSportsImport({
    db, token: "test-token", now: new Date("2026-10-20T20:00:00Z"), queries: defaultQueries(),
    fetchImpl: () => { throw new Error("same-day scheduler must not contact the API"); },
  });
  assert.equal(result.status, "already_run_today");
  assert.equal(result.reads, 0);
  assert.equal(state.updatedAt, null);
});

test("explicit same-day retry uses only the remaining daily budget and keeps today's marker", async () => {
  const { db, fetchImpl, state } = batchFixture({ lastRunAt: "2026-10-20T18:00:00Z", priorReads: 30 });
  const now = new Date("2026-10-20T20:00:00Z");
  const result = await runSportsImport({ db, fetchImpl, token: "test-token", now,
    queries: defaultQueries(), allowSameDayRetry: true });
  assert.equal(result.status, "completed");
  assert.ok(result.roots >= 1);
  assert.ok(result.reads > 0 && result.reads <= 30);
  assert.ok(state.ledger.reduce((sum, row) => sum + row.post_reads, 0) <= 60);
  assert.equal(state.updatedAt, now.toISOString());
});

test("exhausted daily budget prevents all HTTP requests even for an explicit retry", async () => {
  const { db, state } = batchFixture({ lastRunAt: "2026-10-20T18:00:00Z", priorReads: 60 });
  const result = await runSportsImport({ db, token: "test-token", now: new Date("2026-10-20T20:00:00Z"),
    queries: defaultQueries(), allowSameDayRetry: true,
    fetchImpl: () => { throw new Error("exhausted budget must not contact the API"); },
  });
  assert.equal(result.status, "daily_budget_exhausted");
  assert.equal(result.reads, 0);
  assert.equal(state.updatedAt, null);
});

function volumeFixture({ priorReads = 0, sparseFirstRoot = false, failReservation = false, failSettlement = false, failPaidResponse = false, thinSearchPages = false } = {}) {
  const state = { ledger: priorReads ? [{ id: 1, post_reads: priorReads }] : [], stored: [], paidRequests: [], lastRun: null };
  const settings = { enabled: true, max_posts_per_run: 10, max_replies_per_post: 35,
    max_daily_reads: 600, retention_hours: 48, last_run_at: null };
  const db = { from(table) {
    return {
      select() { return this; }, eq(key, value) { this.filters ??= {}; this.filters[key] = value; return this; },
      gte() { return this; }, gt() { return this; }, lt() { return this; }, is() { return this; },
      in() { return this; }, order() { return this; }, limit() { return this; },
      insert(row) {
        this.error = row.status === "reserved" && failReservation ? { message: "reservation failed" } : null;
        this.inserted = { ...row, id: state.ledger.length + 1 };
        if (!this.error) state.ledger.push(this.inserted);
        return this;
      },
      single() { return Promise.resolve({ data: this.inserted ?? settings, error: this.error ?? null }); },
      update(patch) { this.patch = patch; return this; },
      upsert(rows) { state.stored.push(...rows); return Promise.resolve({ data: null, error: null }); },
      then(resolve) {
        if (this.patch && table === "x_sports_runs") {
          if (failSettlement) return resolve({ data: null, error: { message: "settlement failed" } });
          Object.assign(state.ledger.find((row) => row.id === this.filters.id), this.patch);
        }
        if (this.patch && table === "x_sports_settings") state.lastRun = this.patch.last_run_at;
        resolve({ data: table === "x_sports_runs" ? state.ledger : [], error: null });
      },
    };
  } };
  const post = (id, parent = null, lang = "ar") => ({
    id: String(id), author_id: String(id), conversation_id: String(parent ?? id),
    ...(parent ? { referenced_tweets: [{ type: "replied_to", id: String(parent) }] } : {}),
    text: parent ? `تعليق رياضي عربي مفصل عن أداء اللاعبين في البطولة والمنافسة رقم ${id}` :
      `تطور رياضي مهم في البطولة رقم ${id} وتفاصيل جديدة عن المشاركين والنتائج`,
    lang, created_at: "2026-10-21T18:00:00Z", public_metrics: { reply_count: parent ? 0 : 100, like_count: 40 },
  });
  const page = (data, nextToken) => ({ data,
    includes: { users: data.map((item) => ({ id: item.author_id, name: `متابع ${item.id}`, username: `fan${item.id}` })) },
    meta: nextToken ? { next_token: nextToken } : {},
  });
  let rootPage = 0;
  const fetchImpl = async (raw) => {
    const url = new URL(raw);
    if (url.pathname.endsWith("/usage/credits")) return { ok: true, json: async () => ({ data: { total_balance: 20 } }) };
    if (url.pathname.includes("/trends/")) return { ok: true, json: async () => ({ data: [] }) };
    state.paidRequests.push(url);
    if (failPaidResponse) throw new Error("connection interrupted after request");
    const query = url.searchParams.get("query") ?? "";
    const parent = query.match(/^in_reply_to_tweet_id:(\d+)/u)?.[1];
    if (!parent) {
      assert.match(query, /min_replies:50/);
      const data = Array.from({ length: 10 }, (_, i) => post(1000 + rootPage * 10 + i, null, thinSearchPages && i >= 4 ? "en" : "ar"));
      rootPage += 1;
      return { ok: true, json: async () => page(data, rootPage < 3 ? `roots-${rootPage}` : undefined) };
    }
    const base = Number(parent) * 10000;
    const token = url.searchParams.get("next_token");
    let data;
    if (sparseFirstRoot && parent === "1000") {
      data = Array.from({ length: 30 }, (_, i) => post(base + i, parent));
      return { ok: true, json: async () => page(data.slice(0, Number(url.searchParams.get("max_results")))) };
    }
    if (!token) {
      const good = Array.from({ length: 30 }, (_, i) => post(base + i, parent));
      data = [...good, good[0], good[1], good[2], post(base + 90, parent, "en"), post(base + 91, "9999")];
    } else {
      data = [...Array.from({ length: 5 }, (_, i) => post(base + 30 + i, parent)),
        ...Array.from({ length: 5 }, (_, i) => post(base + i, parent))];
    }
    data = data.slice(0, Number(url.searchParams.get("max_results")));
    return { ok: true, json: async () => page(data, token ? undefined : "reply-page-2") };
  };
  return { state, db, fetchImpl };
}

const volumeOptions = { token: "test-token", now: new Date("2026-10-21T20:00:00Z"), queries: defaultQueries() };

test("large batch saves ten Arabic posts with thirty-five unique real replies each within 600 reads", async () => {
  const { state, ...fixture } = volumeFixture();
  const result = await runSportsImport({ ...fixture, ...volumeOptions });
  assert.equal(result.roots, 10);
  assert.equal(result.posts, 360);
  assert.equal(result.reads, 470);
  assert.equal(state.ledger.reduce((sum, row) => sum + row.post_reads, 0), 470);
  assert.ok(state.ledger.every((row) => row.status !== "reserved"));
  const roots = state.stored.filter((row) => !row.in_reply_to_x_id);
  for (const root of roots) {
    const replies = state.stored.filter((row) => row.in_reply_to_x_id === root.x_id);
    assert.equal(replies.length, 35);
    assert.equal(new Set(replies.map((row) => row.x_id)).size, 35);
    assert.ok(replies.every((row) => row.language === "ar" && row.conversation_id === root.x_id));
  }
  assert.ok(state.paidRequests.some((url) => url.searchParams.get("next_token") === "reply-page-2"));
  assert.equal(state.lastRun, volumeOptions.now.toISOString());
});

test("large batch replaces a root with only thirty replies instead of publishing an undersized discussion", async () => {
  const { state, ...fixture } = volumeFixture({ sparseFirstRoot: true });
  const result = await runSportsImport({ ...fixture, ...volumeOptions });
  assert.equal(result.roots, 10);
  assert.ok(result.reads <= 600);
  assert.ok(state.stored.every((row) => row.x_id !== "1000" && row.in_reply_to_x_id !== "1000"));
  assert.equal(state.stored.filter((row) => !row.in_reply_to_x_id).length, 10);
});

test("large batch includes previous usage and publishes only discussions meeting its 31-reply minimum", async () => {
  const { state, ...fixture } = volumeFixture({ priorReads: 450 });
  const result = await runSportsImport({ ...fixture, ...volumeOptions });
  assert.ok(result.reads <= 150);
  assert.ok(state.ledger.reduce((sum, row) => sum + row.post_reads, 0) <= 600);
  for (const root of state.stored.filter((row) => !row.in_reply_to_x_id)) {
    assert.ok(state.stored.filter((row) => row.in_reply_to_x_id === root.x_id).length >= 31);
  }
  assert.ok(result.roots < 10);
});

test("unrelated news from one broad query is not collapsed into a two-post topic bucket", () => {
  const rows = Array.from({ length: 10 }, (_, i) => ({ x_id: String(i + 1),
    body: `تفاصيل الحدث الرياضي رقم ${i} وأخبار البطولة الجديدة`, matched_query: "رياضة أخبار" }));
  assert.equal(chooseDiverseRoots(rows, [], 10).length, 10);
});

test("failed read reservation prevents the paid request", async () => {
  const { state, ...fixture } = volumeFixture({ failReservation: true });
  await assert.rejects(runSportsImport({ ...fixture, ...volumeOptions }), /Reserve X read usage: reservation failed/);
  assert.equal(state.paidRequests.length, 0);
  assert.equal(state.lastRun, null);
});

test("an uncertain paid response or ledger settlement keeps its full reservation", async () => {
  for (const option of [{ failPaidResponse: true }, { failSettlement: true }]) {
    const { state, ...fixture } = volumeFixture(option);
    await assert.rejects(runSportsImport({ ...fixture, ...volumeOptions }), /connection interrupted|Settle X read usage/);
    assert.equal(state.paidRequests.length, 1);
    const reserved = state.ledger.filter((row) => row.status === "reserved");
    assert.equal(reserved.length, 1);
    assert.equal(reserved[0].post_reads, 10);
    assert.equal(state.lastRun, null);
  }
});

test("root search pagination fills the target when the first source pages are sparse", async () => {
  const { state, ...fixture } = volumeFixture({ thinSearchPages: true });
  const result = await runSportsImport({ ...fixture, ...volumeOptions });
  assert.equal(result.roots, 10);
  assert.ok(result.reads <= 600);
  assert.ok(state.paidRequests.some((url) => /^roots-/u.test(url.searchParams.get("next_token") ?? "")));
});

test("reply counts exclude both spellings of the platform before the visibility gate", async () => {
  const { readFileSync } = await import("node:fs");
  const { default: ts } = await import("typescript");
  const source = readFileSync(new URL("../src/lib/x-sports/visibility.ts", import.meta.url), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
  const { displayableImportedRow } = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
  const users = [{ id: "77", username: "arabfan", name: "مشجع عربي" }];
  const data = Array.from({ length: 35 }, (_, index) => ({ id: String(8000 + index), author_id: "77",
    conversation_id: "7000", referenced_tweets: [{ type: "replied_to", id: "7000" }],
    text: `تعليق عربي مفصل على أحداث المباراة وأداء المنتخب رقم ${index}`, lang: "ar",
    created_at: "2026-10-21T19:00:00Z", public_metrics: { like_count: 10 },
  }));
  data[30].text += " شاهد التفاصيل على اكس";
  data[31].text += " شاهد التفاصيل على إكس";
  data[32].text += " شاهد التفاصيل على تويتر";
  data[33].text += " https://x.com/example/status/1";
  data[34].lang = "en";
  const rows = normalizeXPage({ data, includes: { users } }, {
    matchedQuery: "رياضة", now: volumeOptions.now, retentionHours: 48, requireArabic: true,
  });
  assert.equal(rows.length, 30, "a 35-result page with five disallowed replies cannot qualify a 31-reply root");
  assert.ok(rows.every(displayableImportedRow));
});
