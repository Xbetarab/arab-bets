const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const { pathToFileURL } = require("node:url");

let curation;
test.before(async () => {
  curation = await import(pathToFileURL(path.join(__dirname, "../src/lib/x-sports/twitterapi-curation.mjs")));
});

function load(relative, mocks = {}) {
  const filename = path.join(__dirname, "..", relative);
  const js = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  }).outputText;
  const cjsModule = { exports: {} };
  new Function("require", "module", "exports", js)(
    (name) => Object.hasOwn(mocks, name) ? mocks[name] : require(name), cjsModule, cjsModule.exports);
  return cjsModule.exports;
}

function root(index, changes = {}) {
  return {
    x_id: String(1000 + index), conversation_id: String(1000 + index), in_reply_to_x_id: null,
    author_name: "محرر رياضي", author_username: "beINSPORTS", language: "ar",
    author_avatar_url: "https://pbs.twimg.com/profile_images/123/avatar.jpg", media_json: [], links_json: [],
    body: `أعلن نادي برشلونة عودة اللاعب إلى التدريبات الجماعية بعد تعافيه من الإصابة استعدادًا للمباراة المقبلة رقم ${index}`,
    posted_at: new Date(Date.UTC(2026, 9, 21, 10, 60 - index)).toISOString(),
    is_visible: true, deleted_at: null, expires_at: "2999-01-01T00:00:00Z", ...changes,
  };
}
function reply(parent, index, changes = {}) {
  return { ...root(index), x_id: `${parent.x_id}${String(index).padStart(3, "0")}`,
    conversation_id: parent.x_id, in_reply_to_x_id: parent.x_id,
    body: `تعليق رياضي عربي عن أداء الفريق في المباراة رقم ${index}`,
    ...changes };
}

function setup(rows, failRoot = null, likesResponse = null) {
  let active = 0, maxActive = 0;
  const calls = [];
  const likeCalls = [];
  const db = {
    async rpc(name, args) {
      assert.equal(name, "get_x_sports_post_likes");
      likeCalls.push(args);
      return likesResponse ?? {
        data: args.p_post_ids.map((id, index) => ({
          post_id: id, likes_count: 124 + index * 20,
          is_liked: Boolean(args.p_user_id) && index === 0,
        })), error: null,
      };
    },
    from(table) {
      assert.equal(table, "x_sports_posts");
      let result = [...rows], limit, replyRoot, start = 0;
      const orders = [];
      const query = {
        select() { return query; },
        eq(field, value) {
          if (field === "in_reply_to_x_id") replyRoot = value;
          result = result.filter((row) => row[field] === value); return query;
        },
        is(field, value) { result = result.filter((row) => row[field] === value); return query; },
        gt(field, value) { result = result.filter((row) => row[field] > value); return query; },
        order(field, { ascending }) {
          orders.push({ field, ascending });
          return query;
        },
        limit(value) { limit = value; return query; },
        range(from, to) { start = from; limit = to - from + 1; return query; },
        then(resolve, reject) {
          result.sort((a, b) => {
            for (const { field, ascending } of orders) {
              const comparison = String(a[field]).localeCompare(String(b[field])) * (ascending ? 1 : -1);
              if (comparison) return comparison;
            }
            return 0;
          });
          calls.push({ replyRoot, limit, start });
          active++; maxActive = Math.max(maxActive, active);
          return new Promise((done) => setImmediate(() => {
            active--;
            done({ data: result.slice(start, start + limit), error: replyRoot === failRoot ? new Error("database unavailable") : null });
          })).then(resolve, reject);
        },
      };
      return query;
    },
  };
  return {
    ...load("src/lib/x-sports/public-feed.ts", {
      "server-only": {},
      "@/lib/supabase/admin": { createAdminClient: () => db },
      "@/lib/x-sports/twitterapi-curation.mjs": curation,
    }),
    calls,
    likeCalls,
    get maxActive() { return maxActive; },
  };
}

test("twenty retained conversations show their actual 20–111 replies without global truncation or duplicate reads", async () => {
  const roots = Array.from({ length: 20 }, (_, i) => root(i));
  const counts = roots.map((_, index) => 20 + index * 5);
  const rows = roots.flatMap((item, index) => [item, ...Array.from({ length: counts[index] }, (_, i) => reply(item, i))]);
  const env = setup(rows);
  const feed = await env.getSportsFeed(20);
  assert.equal(feed.roots.length, 20);
  assert.equal(feed.replies.length, counts.reduce((sum, count) => sum + Math.min(111, count), 0));
  for (const [index, item] of feed.roots.entries()) {
    assert.equal(feed.replies.filter((row) => row.conversation_id === item.x_id).length, Math.min(111, counts[index]));
  }
  assert.deepEqual(feed.roots.map((item) => item.x_id), roots.map((item) => item.x_id));
  assert.equal(env.calls.length, 21, "one root query plus one reply query per conversation");
  assert.equal(env.maxActive, 5, "reply queries are bounded and parallel instead of serial");
  assert.equal(env.likeCalls.length, 1);
  assert.deepEqual(env.likeCalls[0], { p_post_ids: roots.map((item) => item.x_id), p_user_id: null });
  assert.ok(feed.roots.every((item) => item.likes_count >= 124 && !item.is_liked));
});

test("hidden, expired, non-Arabic and cross-conversation copies cannot qualify or displace valid replies", async () => {
  const hidden = root(0, { is_visible: false });
  const expired = root(1, { expires_at: "2000-01-01T00:00:00Z" });
  const english = root(2, { language: "en" });
  const tooSmall = root(3);
  const legacy = root(4);
  const full = root(5);
  const good = Array.from({ length: 35 }, (_, i) => reply(full, 100 + i));
  const rows = [hidden, expired, english, tooSmall, legacy, full,
    ...Array.from({ length: 2 }, (_, i) => reply(tooSmall, i)),
    ...Array.from({ length: 3 }, (_, i) => reply(legacy, i)),
    reply(full, 0, { is_visible: false }), reply(full, 1, { deleted_at: "2026-10-21T00:00:00Z" }),
    reply(full, 2, { expires_at: "2000-01-01T00:00:00Z" }), reply(full, 3, { language: "en" }),
    reply(full, 4, { author_username: "TwitterNews" }), reply(full, 5, { conversation_id: "999" }),
    reply(full, 6, { body: "تابع تفاصيل المباراة على https://x.com/sports" }), ...good, good[0]];
  const env = setup(rows);
  const feed = await env.getSportsFeed(20);
  assert.deepEqual(feed.roots.map((item) => item.x_id), [full.x_id]);
  assert.equal(feed.replies.length, 35);
  assert.equal(new Set(feed.replies.map((item) => item.x_id)).size, 35);
  assert.ok(feed.replies.every((item) => item.language === "ar" && item.is_visible && !item.deleted_at));
});

test("a reply retrieval failure rejects the optional collection instead of returning partial conversations", async () => {
  const roots = Array.from({ length: 6 }, (_, i) => root(i));
  const rows = roots.flatMap((item) => [item, ...Array.from({ length: 35 }, (_, i) => reply(item, i))]);
  const env = setup(rows, roots[5].x_id);
  await assert.rejects(env.getSportsFeed(20), /database unavailable/);
});

test("a root with 19 clean replies is hidden even when another stored reply contains profanity", async () => {
  const item = root(0);
  const rows = [item, ...Array.from({ length: 19 }, (_, i) => reply(item, i)),
    reply(item, 20, { body: "يا حمار أنت لا تفهم أي شيء في كرة القدم" })];
  const feed = await setup(rows).getSportsFeed();
  assert.deepEqual(feed, { roots: [], replies: [] });
});

test("root news filter blocks fan bait and advertisements while retaining a complete clean news conversation", async () => {
  const good = root(0);
  const bait = root(1, { body: "ليش النصر مكروه ؟ من تشجعون يا جماعة" });
  const ad = root(2, { body: "اربح تذاكر مباراة الهلال مع برشلونة في المسابقة تابع حسابنا وأعد النشر للدخول في السحب" });
  const source = root(3, { author_name: "أخبار تويتر الرياضية" });
  const rows = [good, bait, ad, source].flatMap((item) => [item, ...Array.from({ length: 35 }, (_, i) => reply(item, i))]);
  const feed = await setup(rows).getSportsFeed();
  assert.deepEqual(feed.roots.map((item) => item.x_id), [good.x_id]);
  assert.equal(feed.replies.length, 35);
});

test("bounded reply pagination finds actual safe replies after a full page of rejected copies", async () => {
  const item = root(0);
  const bad = Array.from({ length: 150 }, (_, i) => reply(item, i, {
    body: "التفاصيل الرياضية على https://t.co/example", posted_at: "2026-10-20T00:00:00Z",
  }));
  const good = Array.from({ length: 35 }, (_, i) => reply(item, i + 150));
  const env = setup([item, ...bad, ...good]);
  const feed = await env.getSportsFeed();
  assert.equal(feed.roots.length, 1);
  assert.equal(feed.replies.length, 35);
  assert.deepEqual(env.calls.filter((call) => call.replyRoot).map((call) => call.start), [0, 150]);
});

test("duplicate roots do not duplicate public conversations and an empty limit performs no database reads", async () => {
  const item = root(0);
  const env = setup([item, item, ...Array.from({ length: 35 }, (_, i) => reply(item, i))]);
  const empty = await env.getSportsFeed(0);
  assert.deepEqual(empty, { roots: [], replies: [] });
  assert.equal(env.calls.length, 0);
  assert.equal(env.likeCalls.length, 0);
  const full = await env.getSportsFeed();
  assert.equal(full.roots.length, 1);
  assert.equal(full.replies.length, 35);
});

test("like state belongs to the authenticated viewer and is attached only to root posts", async () => {
  const roots = [root(0), root(1)];
  const rows = roots.flatMap((item) => [item, ...Array.from({ length: 20 }, (_, i) => reply(item, i))]);
  const env = setup(rows);
  const userId = "0e44631e-04a0-491a-8ee7-48edbcb4bdc9";
  const feed = await env.getSportsFeed(20, userId);
  assert.equal(env.likeCalls[0].p_user_id, userId);
  assert.deepEqual(feed.roots.map(({ likes_count, is_liked }) => ({ likes_count, is_liked })), [
    { likes_count: 124, is_liked: true }, { likes_count: 144, is_liked: false },
  ]);
  assert.ok(feed.replies.every((row) => row.is_liked === undefined && row.likes_count === undefined));
});

test("missing or failed count reads never render invented fallback counts", async () => {
  const item = root(0);
  const rows = [item, ...Array.from({ length: 20 }, (_, i) => reply(item, i))];
  await assert.rejects(setup(rows, null, { data: null, error: new Error("counts unavailable") }).getSportsFeed(), /counts unavailable/);
  await assert.rejects(setup(rows, null, { data: [], error: null }).getSportsFeed(), /Sports like counts unavailable/);
});

test("display removes automatic leading reply addressees without changing author identity or internal mentions", async () => {
  const item = root(0);
  const text = "الأداء في المباراة كان منظمًا وأتفق مع @analyst في أهمية التبديلات";
  const prefixed = reply(item, 0, {
    author_name: "محمد", author_username: "mohammed", body: `@beINSPORTS @other_handle: ${text}`,
  });
  const alreadyClean = reply(item, 1, { body: text });
  const rows = [item, prefixed, alreadyClean, ...Array.from({ length: 18 }, (_, i) => reply(item, i + 2))];
  const feed = await setup(rows).getSportsFeed();
  assert.equal(feed.replies.length, 20);
  const shown = feed.replies.find((comment) => comment.x_id === prefixed.x_id);
  assert.equal(shown.body, text);
  assert.equal(shown.author_name, prefixed.author_name);
  assert.equal(shown.author_username, prefixed.author_username);
  assert.equal(shown.author_avatar_url, prefixed.author_avatar_url);
  assert.ok(prefixed.body.startsWith("@beINSPORTS"), "stored input rows are not mutated while rendering");
  assert.equal(feed.replies.find((comment) => comment.x_id === alreadyClean.x_id).body, text);
  assert.equal(feed.roots[0].body, item.body);
});
