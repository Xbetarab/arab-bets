const X_API = "https://api.x.com/2/tweets";

export const X_FIELDS = {
  "tweet.fields": "author_id,attachments,conversation_id,created_at,entities,lang,note_tweet,possibly_sensitive,public_metrics,referenced_tweets,text,withheld",
  expansions: "author_id,attachments.media_keys",
  "user.fields": "id,name,username,profile_image_url,protected,withheld",
  "media.fields": "media_key,type,url,preview_image_url,alt_text,variants",
};

export function parseQueries(raw) {
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 5 ||
      parsed.some((item) => typeof item !== "string" || item.length < 3 || item.length > 300)) {
    throw new Error("X_SPORTS_QUERIES must be a JSON array of 1–5 search strings");
  }
  return parsed;
}

export function safeHttpsUrl(value) {
  if (typeof value !== "string") return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" ? parsed.href : null;
  } catch {
    return null;
  }
}

function displayContent(post) {
  const fullPost = post?.note_tweet ?? post?.note_post;
  let text = String(fullPost?.text ?? post?.text ?? "");
  const urls = fullPost?.entities?.urls ?? post?.entities?.urls ?? [];
  const mediaKeys = new Set(post?.attachments?.media_keys ?? []);
  const isAttachedMedia = (entity) => {
    if (!mediaKeys.size || typeof entity?.url !== "string") return false;
    try {
      const shortUrl = new URL(entity.url);
      if (shortUrl.protocol !== "https:" || shortUrl.hostname !== "t.co" ||
          shortUrl.username || shortUrl.password || shortUrl.port || !shortUrl.pathname.slice(1)) return false;
      if (entity.media_key && mediaKeys.has(entity.media_key)) return true;
      const expanded = new URL(entity.expanded_url ?? "");
      if (expanded.protocol !== "https:" || !/^(?:www\.)?(?:x|twitter)\.com$/iu.test(expanded.hostname) ||
          expanded.username || expanded.password || expanded.port) return false;
      const ownMedia = expanded.pathname.match(/^\/[A-Za-z0-9_]{1,15}\/status\/(\d{1,20})\/(?:photo|video)\/[1-9]\d*\/?$/u);
      return ownMedia?.[1] === String(post.id);
    } catch {
      return false;
    }
  };
  const mediaUrls = urls.filter(isAttachedMedia);
  for (const entity of mediaUrls) {
    // Remove only the API's URL token for media already rendered separately.
    // Literal token matching preserves prose and avoids emoji index offsets.
    const token = entity.url.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
    text = text.replace(new RegExp(`(^|\\s)${token}(?=\\s|$)`, "gu"), "$1");
  }
  return {
    text: mediaUrls.length ? text.trimEnd() : text,
    urls: urls.filter((entity) => !mediaUrls.includes(entity)),
  };
}

export function isSpammyPost(post) {
  const content = displayContent(post);
  const text = content.text.trim();
  const urls = content.urls;
  if (text.length < 20 || urls.length > 1) return true;
  // Reject the whole item rather than silently rewriting original text.
  if (hasSourceBrand(text) || urls.some((item) =>
    hasSourceBrand(item.expanded_url ?? item.url) || hasSourceBrand(item.display_url))) return true;
  const streamSpam = /(?:free\s*(?:stream|watch|live)|live\s*stream|watch\s*(?:live|online)|\biptv\b|\b4k\b|\bhd\s*stream\b|en\s*directo\s*gratis|ver\s*online\s*gratis|بث\s*مباشر|مشاهدة\s*(?:المباراة|مباشرة)|رابط\s*البث|مجانا\s*الآن)/iu;
  if (streamSpam.test(text)) return true;
  // A stream/link pitch can point to an account bio instead of including a URL.
  const bioLinkPitch = /(?:\b(?:link|lien|enlace)\b.{0,40}\b(?:bio|profile|profil)\b|\b(?:telegram|whatsapp)\b.{0,40}\b(?:bio|link|lien)\b|(?:رابط|لينك).{0,30}(?:البايو|الملف الشخصي|التليجرام|التيليجرام|تلغرام|تليجرام))/iu;
  if (bioLinkPitch.test(text)) return true;
  const engagement = Number(post?.public_metrics?.like_count ?? 0) +
    Number(post?.public_metrics?.reply_count ?? 0) +
    Number(post?.public_metrics?.repost_count ?? 0);
  // Links with no meaningful response are often fake-match-stream campaigns.
  if (urls.length && engagement < 3) return true;
  return false;
}

// The public site serves Arabic readers. X's language tag alone can be wrong
// for short mixed-language posts, so require both the tag and Arabic prose.
export function isArabicPost(post) {
  const { text } = displayContent(post);
  const arabicLetters = (text.match(/[\u0621-\u064A\u0671-\u06D3]/gu) ?? []).length;
  const letters = (text.match(/\p{L}/gu) ?? []).length;
  return post?.lang === "ar" && arabicLetters >= 8 && arabicLetters / Math.max(letters, 1) >= 0.4;
}

// Never display a source-branded account label when the public feed is
// configured to omit platform references. Reject the item in full rather than
// silently changing the real author's identity.
export function hasSourceBrand(value) {
  return /(?:https?:\/\/)?(?:[\w-]+\.)?(?:x\.com|twitter\.com|t\.co)(?:\/|\b)|twitter|\bX\b|(?:^|[_\s@])x[_-]?(?:sports?|football|news|bets?|tweets?|posts?|updates?)\b|تويتر|(?:^|[^\p{L}\p{N}])(?:إكس|اكس)(?=$|[^\p{L}\p{N}])/iu.test(String(value ?? ""));
}

const TEAM_ALIASES = [
  ["psg", /\bpsg\b|\bparis\s+saint.germain\b|باريس/iu],
  ["barcelona", /\bbarc(?:elona|a)\b|برشلونة|بارسلونا/iu],
  ["liverpool", /\bliverpool\b|ليفربول/iu],
  ["villarreal", /\bvillarreal\b|فياريال/iu],
  ["man-city", /\bman(?:chester)?\s*city\b|مانشستر\s*سيتي/iu],
  ["aek", /\baek\b|أيك/iu],
  ["napoli", /\bnapoli\b|نابولي/iu],
  ["bodo", /\bbod[oø]\b|بودو/iu],
  ["porto", /\bporto\b|بورتو/iu],
  ["psv", /\bpsv\b|آيندهوفن/iu],
  ["roma", /\broma\b|\bas\s*roma\b|روما/iu],
  ["slovan", /\bslovan\b|سلوفان/iu],
  ["dortmund", /\bdortmund\b|دورتموند/iu],
  ["sabah", /\bsabah\b|صباح/iu],
  ["fenerbahce", /\bfenerbah[çc]e\b|فنربخشة/iu],
  ["slavia", /\bslavia\b|سلافيا/iu],
  ["stuttgart", /\bstuttgart\b|شتوتغارت/iu],
  ["atletico", /\batl[eé]tico\b|أتليتكو|أتلتيكو/iu],
];

export function sportsTopic(text, fallback = "general") {
  const teams = TEAM_ALIASES.filter(([, pattern]) => pattern.test(String(text ?? ""))).map(([name]) => name);
  if (teams.length >= 2) return `match:${teams.slice(0, 2).sort().join(":")}`;
  if (teams.length === 1) return `team:${teams[0]}`;
  // A broad search query is not a topic: grouping all unrecognized Arabic
  // events under it would cap an entire news source at two daily posts.
  const subject = String(text || fallback).toLowerCase().replace(/https?:\/\/\S+/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim().split(/\s+/u).slice(0, 16).join(" ");
  return `topic:${subject || "general"}`;
}

export function chooseDiverseRoots(candidates, selected, limit, maxPerTopic = 2) {
  const counts = new Map();
  for (const row of selected) {
    const topic = sportsTopic(row.body, row.matched_query);
    counts.set(topic, (counts.get(topic) ?? 0) + 1);
  }
  const picked = [];
  for (const [threshold, preferFreshAuthor] of [[0, true], [0, false], [maxPerTopic - 1, true], [maxPerTopic - 1, false]]) {
    for (const row of candidates) {
      if (picked.length >= limit) break;
      const topic = sportsTopic(row.body, row.matched_query);
      const count = counts.get(topic) ?? 0;
      if (count > threshold || count >= maxPerTopic || picked.includes(row) ||
          (row.x_id && [...selected, ...picked].some((item) => item.x_id === row.x_id)) ||
          (preferFreshAuthor && row.author_x_id &&
            [...selected, ...picked].some((item) => item.author_x_id === row.author_x_id))) continue;
      picked.push(row);
      counts.set(topic, count + 1);
    }
  }
  return picked;
}

export function buildSearchUrl(query, maxResults = 10, nextToken) {
  if (!Number.isInteger(maxResults) || maxResults < 10 || maxResults > 100) {
    throw new Error("Search page size must be between 10 and 100");
  }
  const url = new URL(`${X_API}/search/recent`);
  url.searchParams.set("query", query);
  url.searchParams.set("max_results", String(maxResults));
  url.searchParams.set("sort_order", "recency");
  for (const [key, value] of Object.entries(X_FIELDS)) url.searchParams.set(key, value);
  if (nextToken) url.searchParams.set("next_token", nextToken);
  return url;
}

export function buildLookupUrl(ids) {
  if (!Array.isArray(ids) || ids.length < 1 || ids.length > 100 ||
      ids.some((id) => !/^\d{1,20}$/.test(id))) {
    throw new Error("Lookup requires 1–100 X post IDs");
  }
  const url = new URL(X_API);
  url.searchParams.set("ids", ids.join(","));
  for (const [key, value] of Object.entries(X_FIELDS)) url.searchParams.set(key, value);
  return url;
}

export function normalizeXPage(payload, { matchedQuery, now, retentionHours, requireArabic = false }) {
  const users = new Map((payload?.includes?.users ?? []).map((user) => [user.id, user]));
  const media = new Map((payload?.includes?.media ?? []).map((item) => [item.media_key, item]));
  const expiresAt = new Date(now.getTime() + retentionHours * 3600_000).toISOString();
  const rows = [];

  for (const post of payload?.data ?? []) {
    const author = users.get(post.author_id);
    if (!/^\d{1,20}$/.test(String(post.id ?? "")) || isSpammyPost(post) ||
        (requireArabic && !isArabicPost(post)) ||
        !author || author.protected || author.withheld ||
        hasSourceBrand(author.name) || hasSourceBrand(author.username) ||
        post.withheld || post.possibly_sensitive || !/^[A-Za-z0-9_]{1,15}$/.test(String(author.username ?? ""))) {
      continue;
    }
    const content = displayContent(post);
    const parent = (post.referenced_tweets ?? post.referenced_posts ?? []).find((item) => item.type === "replied_to")?.id ?? null;
    const mediaJson = (post.attachments?.media_keys ?? []).map((key) => media.get(key)).filter(Boolean)
      .map((item) => ({
        type: item.type,
        url: safeHttpsUrl(item.url ?? item.preview_image_url),
        alt_text: hasSourceBrand(item.alt_text) ? null : item.alt_text ?? null,
      })).filter((item) => item.url);
    const linksJson = content.urls.map((item) => ({
      url: safeHttpsUrl(item.expanded_url ?? item.unwound_url ?? item.url),
      label: String(item.display_url ?? item.expanded_url ?? "رابط").slice(0, 200),
    })).filter((item) => item.url);

    rows.push({
      x_id: String(post.id),
      conversation_id: String(post.conversation_id ?? post.id),
      in_reply_to_x_id: parent ? String(parent) : null,
      author_x_id: String(author.id),
      author_username: author.username,
      author_name: String(author.name ?? author.username).slice(0, 100),
      author_avatar_url: safeHttpsUrl(author.profile_image_url),
      body: content.text,
      posted_at: post.created_at,
      language: post.lang ?? null,
      media_json: mediaJson,
      links_json: linksJson,
      matched_query: matchedQuery,
      last_synced_at: now.toISOString(),
      expires_at: expiresAt,
      deleted_at: null,
      is_visible: true,
    });
  }
  return rows;
}

export function replyQuery(rootId) {
  if (!/^\d{1,20}$/.test(rootId)) throw new Error("Invalid X conversation ID");
  return `in_reply_to_tweet_id:${rootId} lang:ar -is:retweet -has:links`;
}

export function remainingReads(limit, prior, current = 0) {
  return Math.max(0, Math.floor(limit) - Math.floor(prior) - Math.floor(current));
}
