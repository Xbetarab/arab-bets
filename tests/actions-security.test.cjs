const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

function loadSource(relativePath, mocks = {}) {
  const filename = path.join(__dirname, "..", relativePath);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  }).outputText;
  const testModule = { exports: {} };
  new Function("require", "module", "exports", source)(
    (name) => Object.hasOwn(mocks, name) ? mocks[name] : require(name), testModule, testModule.exports
  );
  return testModule.exports;
}

const validation = loadSource("src/lib/input-validation.ts", {
  "@/lib/supabase/types": loadSource("src/lib/supabase/types.ts"),
});
const USER = "10000000-0000-4000-8000-000000000001";
const OTHER_USER = "10000000-0000-4000-8000-000000000002";
const POST = "20000000-0000-4000-8000-000000000001";
const OTHER_POST = "20000000-0000-4000-8000-000000000002";
const COMMENT = "30000000-0000-4000-8000-000000000001";
const tip = {
  match_home: "الفريق الأول", match_away: "الفريق الثاني", league: "الدوري",
  match_date: "2026-10-06T20:00", prediction: "الفريق الأول",
  prediction_type: "نتيجة المباراة", odds: 1.5, confidence: 3,
};

// The mocked clients distinguish the session-bound reads from privileged writes.
// No test connects to the deployed database.
function environment(results = {}, user = { id: USER }, authError = null) {
  const queues = Object.fromEntries(Object.entries(results).map(([key, value]) => [key, [...value]]));
  const calls = [];
  let adminCreated = 0;
  let authCalls = 0;
  function client(kind) {
    return {
      auth: { getUser: async () => { authCalls++; return { data: { user }, error: authError }; } },
      rpc: () => { throw new Error("Unexpected redundant counter RPC"); },
      from(table) {
        const operations = [];
        function run() {
          calls.push({ client: kind, table, operations });
          return queues[`${kind}:${table}`]?.shift() ?? { data: null, error: null };
        }
        const query = {};
        for (const method of ["select", "eq", "insert", "update", "delete", "in"]) {
          query[method] = (...args) => { operations.push([method, ...args]); return query; };
        }
        query.single = query.maybeSingle = async () => run();
        query.then = (resolve, reject) => Promise.resolve(run()).then(resolve, reject);
        return query;
      },
    };
  }
  const userClient = client("user");
  const adminClient = client("admin");
  return {
    calls,
    get adminCreated() { return adminCreated; },
    get authCalls() { return authCalls; },
    load(name) {
      return loadSource(`src/app/actions/${name}.ts`, {
        "@/lib/input-validation": validation,
        "@/lib/supabase/server": { createClient: async () => userClient },
        "@/lib/supabase/admin": { createAdminClient: () => { adminCreated++; return adminClient; } },
        "next/cache": { revalidatePath: () => {} },
      });
    },
  };
}
const ok = (data) => ({ data, error: null });
const inserted = (env, table) => env.calls.find((call) => call.table === table && call.operations.some(([op]) => op === "insert"))?.operations.find(([op]) => op === "insert")[1];
const writes = (env) => env.calls.filter((call) => call.operations.some(([op]) => ["insert", "update", "delete"].includes(op)));

test("public post input rejects forged oversized and malformed payloads before DB access", async () => {
  const env = environment();
  const { createPost } = env.load("posts");
  const payloads = [
    ["x".repeat(501), null, null, null],
    ["", null, null, null],
    ["post", { sport: "football" }, null, null],
    ["post", "unknown", null, null],
    ["post", null, ["javascript:alert(1)"], null],
    ["post", null, ["https://example.test/a", "https://example.test/b"], null],
    ["post", null, ["https://user:password@example.test/a"], null],
    ["post", null, null, { ...tip, odds: NaN }],
    ["post", null, null, { ...tip, odds: Infinity }],
    ["post", null, null, { ...tip, odds: "1.5" }],
    ["post", null, null, { ...tip, confidence: 6 }],
    ["post", null, null, { ...tip, confidence: 2.5 }],
    ["post", null, null, { ...tip, prediction_type: "injected" }],
    ["post", null, null, { ...tip, match_date: "2026-02-31T20:00" }],
  ];
  for (const payload of payloads) await assert.rejects(createPost(...payload));
  assert.equal(env.authCalls, 0);
  assert.equal(env.adminCreated, 0);
  assert.equal(writes(env).length, 0);
});

test("normal post limits work and tip JSON cannot overwrite approval, ownership or results", async () => {
  const env = environment({
    "admin:app_settings": [ok({ value: { auto_approve_posts: true } })],
    "admin:posts": [ok({ id: POST })],
  });
  const result = await env.load("posts").createPost("x".repeat(500), "football", null, {
    ...tip, author_id: OTHER_USER, is_approved: true, arbitrary: "injected",
    result: "won", settled_at: "forged",
  });
  const row = inserted(env, "posts");
  assert.equal(result.id, POST);
  assert.equal(row.content.length, 500);
  assert.equal(row.author_id, USER);
  assert.equal(row.tip_data.result, "pending");
  assert.equal(row.tip_data.settled_at, null);
  assert.equal(row.tip_data.arbitrary, undefined);
  assert.equal(row.tip_data.author_id, undefined);
  assert.equal(row.tip_data.is_approved, undefined);
});

test("moderation read failure blocks post/comment writes; missing settings stay pending", async () => {
  const failed = { data: null, error: { message: "settings unavailable" } };
  const postEnv = environment({ "admin:app_settings": [failed] });
  await assert.rejects(postEnv.load("posts").createPost("post", null, null, null));
  assert.equal(writes(postEnv).length, 0);
  const commentEnv = environment({
    "user:posts": [ok({ id: POST, is_approved: true, author_id: OTHER_USER })],
    "admin:app_settings": [failed],
  });
  await assert.rejects(commentEnv.load("comments").createComment(POST, "comment", null));
  assert.equal(writes(commentEnv).length, 0);
  const missingEnv = environment({ "admin:app_settings": [ok(null)], "admin:posts": [ok({ id: POST })] });
  await missingEnv.load("posts").createPost("post", null, null, null);
  assert.equal(inserted(missingEnv, "posts").is_approved, false);
  assert.equal(validation.readAutoApprove({ auto_approve_posts: "true" }, "auto_approve_posts"), false);
});

test("comments cannot target hidden/unreadable posts or parents from another post", async () => {
  for (const postResult of [
    ok(null), { data: null, error: { message: "RLS read failed" } },
    ok({ id: POST, is_approved: false, author_id: OTHER_USER }),
  ]) {
    const env = environment({ "user:posts": [postResult] });
    await assert.rejects(env.load("comments").createComment(POST, "comment", null));
    assert.equal(env.adminCreated, 0);
    assert.equal(writes(env).length, 0);
  }
  for (const parentResult of [
    ok({ id: COMMENT, post_id: OTHER_POST, author_id: OTHER_USER, is_approved: true }),
    ok({ id: COMMENT, post_id: POST, author_id: OTHER_USER, is_approved: false }),
  ]) {
    const env = environment({
      "user:posts": [ok({ id: POST, author_id: OTHER_USER, is_approved: true })],
      "user:comments": [parentResult],
    });
    await assert.rejects(env.load("comments").createComment(POST, "comment", COMMENT));
    assert.equal(env.adminCreated, 0);
    assert.equal(writes(env).length, 0);
  }
});

test("visible same-post replies use session checks before one privileged insert", async () => {
  const env = environment({
    "user:posts": [ok({ id: POST, author_id: USER, is_approved: false })],
    "user:comments": [ok({ id: COMMENT, post_id: POST, author_id: USER, is_approved: false })],
    "admin:app_settings": [ok({ value: { auto_approve_comments: false } })],
  });
  await env.load("comments").createComment(POST, " comment ", COMMENT);
  const row = inserted(env, "comments");
  assert.equal(row.content, "comment");
  assert.equal(row.parent_id, COMMENT);
  assert.equal(row.is_approved, false);
  assert.equal(writes(env).length, 1);
  const parentRead = env.calls.find((call) => call.client === "user" && call.table === "comments");
  assert.ok(parentRead.operations.some(([op, column, value]) => op === "eq" && column === "post_id" && value === POST));
});

test("owner deletes reject strangers before constructing any privileged client", async () => {
  for (const [file, method, table, id] of [
    ["posts", "deletePost", "posts", POST],
    ["comments", "deleteComment", "comments", COMMENT],
  ]) {
    const env = environment({ [`user:${table}`]: [ok({ author_id: OTHER_USER })] });
    await assert.rejects(env.load(file)[method](id));
    assert.equal(env.adminCreated, 0);
    assert.equal(writes(env).length, 0);
    const ownerEnv = environment({ [`user:${table}`]: [ok({ author_id: USER })], [`admin:${table}`]: [ok({ id })] });
    await ownerEnv.load(file)[method](id);
    const deletion = writes(ownerEnv).find((call) => call.table === table);
    assert.equal(deletion.client, "admin");
    assert.ok(deletion.operations.some(([op, column, value]) => op === "eq" && column === "author_id" && value === USER));
    assert.ok(!writes(ownerEnv).some((call) => call.operations.some(([op]) => op === "update")), "count triggers handle deletion without public counter updates");
  }
});

test("authentication errors fail closed before protected reads or privileged writes", async () => {
  const env = environment({}, { id: USER }, { message: "verification failed" });
  await assert.rejects(env.load("posts").createPost("post", null, null, null));
  await assert.rejects(env.load("posts").deletePost(POST));
  await assert.rejects(env.load("posts").settleTip(POST, "won"));
  await assert.rejects(env.load("comments").createComment(POST, "comment", null));
  await assert.rejects(env.load("comments").deleteComment(COMMENT));
  await assert.rejects(env.load("profile").updateProfile({ display_name: "name", avatar_url: null, cover_url: null }));
  assert.equal(env.calls.length, 0);
  assert.equal(env.adminCreated, 0);
});

test("tip settlement requires ownership before privilege and accepts the supported results", async () => {
  const strangerEnv = environment({ "user:posts": [ok({ author_id: OTHER_USER, tip_data: tip })] });
  await assert.rejects(strangerEnv.load("posts").settleTip(POST, "won"));
  assert.equal(strangerEnv.adminCreated, 0);
  assert.equal(writes(strangerEnv).length, 0);
  for (const result of ["won", "lost", "void"]) {
    const env = environment({
      "user:posts": [ok({ author_id: USER, tip_data: { ...tip, result: "pending", settled_at: null } })],
      "admin:posts": [ok({ id: POST })],
    });
    await env.load("posts").settleTip(POST, result);
    const update = writes(env)[0];
    assert.equal(update.client, "admin");
    assert.ok(update.operations.some(([op, column, value]) => op === "eq" && column === "author_id" && value === USER));
    const row = update.operations.find(([op]) => op === "update")[1];
    assert.equal(row.tip_data.result, result);
    assert.ok(Number.isFinite(Date.parse(row.tip_data.settled_at)));
    assert.equal(row.tip_data.prediction, tip.prediction);
  }
});

test("UUIDs, comments and settlement enums are runtime checked before DB access", async () => {
  const env = environment();
  await assert.rejects(env.load("posts").deletePost("not-a-uuid"));
  await assert.rejects(env.load("comments").deleteComment("not-a-uuid"));
  await assert.rejects(env.load("comments").createComment(POST, "x".repeat(2001), null));
  await assert.rejects(env.load("comments").createComment(POST, "comment", "not-a-uuid"));
  await assert.rejects(env.load("posts").settleTip(POST, "approved"));
  assert.equal(env.authCalls, 0);
  assert.equal(writes(env).length, 0);
});

test("profile updates enforce normal 50-character names and safe media URLs", async () => {
  const env = environment();
  const { updateProfile } = env.load("profile");
  await assert.rejects(updateProfile({ display_name: "x".repeat(51), avatar_url: null, cover_url: null }));
  await assert.rejects(updateProfile({ display_name: "name", avatar_url: "data:image/svg+xml,injected", cover_url: null }));
  assert.equal(env.authCalls, 0);
  await updateProfile({ display_name: "x".repeat(50), avatar_url: "https://example.test/avatar.png", cover_url: null, role: "admin", stats: {} });
  const row = env.calls.find((call) => call.operations.some(([op]) => op === "update")).operations.find(([op]) => op === "update")[1];
  assert.equal(row.display_name.length, 50);
  assert.equal(row.role, undefined);
  assert.equal(row.stats, undefined);
});

test("anonymous analytics reject huge strings, arbitrary schemes and forged page-view types", async () => {
  const env = environment({}, null);
  const { trackLinkClick, trackPageView } = env.load("clicks");
  for (const payload of [
    { target_url: "javascript:alert(1)" },
    { target_url: "https://example.test", user_agent: "x".repeat(513) },
    { target_url: "https://example.test", link_type: "page_view" },
  ]) await assert.rejects(trackLinkClick(payload));
  for (const payload of [
    { page_url: "//evil.example" },
    { page_url: "/", utm_campaign: "x".repeat(257) },
    { page_url: "/", referrer: "https://example.test/" + "x".repeat(2048) },
  ]) await assert.rejects(trackPageView(payload));
  assert.equal(env.authCalls, 0);
  assert.equal(env.adminCreated, 0);
  await trackPageView({ page_url: "/profile/edit", user_agent: "browser", utm_source: "campaign" });
  const row = inserted(env, "link_clicks");
  assert.equal(row.target_url, "/profile/edit");
  assert.equal(row.referrer, "campaign");
  assert.equal(row.user_id, null);
  assert.match(row.session_id, /^anon-/);
  assert.equal(writes(env).length, 1);
});
