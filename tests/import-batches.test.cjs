const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

function load(relative, mocks = {}) {
  const file = path.join(__dirname, "..", relative);
  const compiled = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const target = { exports: {} };
  new Function("require", "module", "exports", compiled)(name => Object.hasOwn(mocks, name) ? mocks[name] : require(name), target, target.exports);
  return target.exports;
}

const plan = load("src/lib/import-batch-plan.ts");
const NOW = Date.parse("2026-10-17T12:00:00Z");
const DATE = "2020-02-02T12:00:00Z";
const ID = "10000000-0000-4000-8000-000000000001";
const POST = "20000000-0000-4000-8000-000000000002";
const pool = [
  { username: "poster", displayName: "كاتب 🏟️", activityWeight: 0.8, rolePreference: "poster" },
  { username: "commenter", displayName: "معلّق", activityWeight: 0.8, rolePreference: "commenter" },
];
const content = (extra = {}) => ({ content: "منشور تجريبي", created_at: DATE, ...extra });
const input = posts => JSON.stringify({ posts });
function parsed(posts = [content()]) { return plan.parseImportSource(input(posts), "posts", NOW); }
function batch(planItems = plan.buildImportPlan(parsed(), pool).plan, status = "draft") {
  return { id: ID, input_hash: parsed().inputHash, label: "دفعة", mode: "posts", status,
    plan: planItems, warnings: [], created_at: DATE, updated_at: DATE };
}
const ok = data => ({ data, error: null });

test("canonical import hash ignores JSON object order, formatting and normalized equivalent dates", () => {
  const a = parsed([content({ likes_count: 27, sport: "كرة قدم" })]);
  const b = plan.parseImportSource('{"posts":[{"sport":"football","likes_count":27,"created_at":"2020-02-02T15:00:00+03:00","content":"منشور تجريبي"}]}', "posts", NOW);
  assert.equal(a.inputHash, b.inputHash);
  assert.notEqual(a.inputHash, parsed([content({ likes_count: 28, sport: "football" })]).inputHash);
  assert.notEqual(parsed([content(), content({ content: "ثان" })]).inputHash,
    parsed([content({ content: "ثان" }), content()]).inputHash);
});

test("parser preserves manual baselines, customized text, dates, pool usernames and old sport mapping", () => {
  const source = parsed([content({ author_username: "poster", content: "  ⚽ نص مخصص  ", likes_count: 405, sport: "رياضات إلكترونية" })]);
  const { plan: items } = plan.buildImportPlan(source, pool);
  assert.equal(items[0].content, "  ⚽ نص مخصص  ");
  assert.equal(items[0].likesCount, 405);
  assert.equal(items[0].createdAt, "2020-02-02T12:00:00.000Z");
  assert.equal(items[0].username, "poster");
  assert.equal(items[0].displayName, "كاتب 🏟️");
  assert.equal(items[0].sport, "esports");
  assert.equal(parsed([content({ sport: "unknown" })]).items[0].sport, null);
});

test("nested replies flatten in dependency order while IDs and identity picks do not affect source hash", () => {
  const source = parsed([content({ comments: [content({ replies: [content({ replies: [content()] })] })] })]);
  const first = plan.buildImportPlan(source, pool, {}, () => 0);
  const second = plan.buildImportPlan(source, pool, {}, () => 0.99);
  assert.deepEqual(first.plan.map(item => item.kind), ["post", "comment", "comment", "comment"]);
  assert.equal(first.plan[1].postKey, first.plan[0].key);
  assert.equal(first.plan[2].parentKey, first.plan[1].key);
  assert.equal(first.plan[3].parentKey, first.plan[2].key);
  assert.notEqual(first.plan[0].id, second.plan[0].id);
  assert.notEqual(first.plan[0].username, second.plan[0].username);
  assert.equal(source.inputHash, parsed([content({ comments: [content({ replies: [content({ replies: [content()] })] })] })]).inputHash);
});

test("identity weighting preserves role boost, reuse, diminishing repetition and minimum weight", () => {
  assert.equal(plan.weightedBatchIdentity(pool, "post", new Map(), () => 0.6).username, "poster");
  assert.equal(plan.weightedBatchIdentity(pool, "comment", new Map(), () => 0.6).username, "commenter");
  assert.equal(plan.weightedBatchIdentity(pool, "post", new Map([["poster", 3]]), () => 0.6).username, "commenter");
  const zero = [{ ...pool[0], activityWeight: 0 }];
  const many = plan.buildImportPlan(parsed(Array.from({ length: 40 }, () => content())), zero);
  assert.equal(many.plan.length, 40);
  assert.ok(many.plan.every(item => item.username === "poster"));
});

test("unknown or absent username uses only current pool, with warning and no stale identity fallback", () => {
  const result = plan.buildImportPlan(parsed([content({ author_username: "deleted-old-ghost" }), content()]), pool, {}, () => 0);
  assert.ok(result.plan.every(item => pool.some(identity => identity.username === item.username)));
  assert.match(result.plan[0].warnings[0], /المخزون/);
  assert.throws(() => plan.buildImportPlan(parsed(), []), /المخزون/);
});

test("comments-only format validates UUIDs and target existence before producing a plan", () => {
  const source = plan.parseImportSource(JSON.stringify({ comments: [{ post_id: POST, entries: [content()] }] }), "comments", NOW);
  assert.throws(() => plan.buildImportPlan(source, pool, {}), /غير موجود/);
  const result = plan.buildImportPlan(source, pool, { [POST]: "2019-01-01T00:00:00Z" });
  assert.equal(result.plan[0].targetPostId, POST);
  for (const invalid of ["https://arabtips.com/post/123", "123", null]) {
    assert.throws(() => plan.parseImportSource(JSON.stringify({ comments: [{ post_id: invalid, entries: [content()] }] }), "comments", NOW), /UUID/);
  }
});

test("duplicate text and invalid chronology warn without erasing manual counts or custom dates", () => {
  const result = plan.buildImportPlan(parsed([content({ likes_count: 500, comments: [content({ created_at: "2019-01-01T00:00:00Z", replies: [content({ created_at: "2018-01-01T00:00:00Z" })] })] })]), pool);
  assert.ok(result.plan[1].warnings.some(warning => warning.includes("نص مكرر")));
  assert.ok(result.plan[1].warnings.some(warning => warning.includes("يسبق")));
  assert.ok(result.plan[2].warnings.some(warning => warning.includes("يسبق")));
  assert.equal(result.plan[0].likesCount, 500);
  assert.equal(result.plan[1].createdAt, "2019-01-01T00:00:00.000Z");
  const between = plan.buildImportPlan(parsed([content({ comments: [content({ created_at: "2018-01-01T00:00:00Z", replies: [content({ created_at: "2019-01-01T00:00:00Z" })] })] })]), pool);
  assert.ok(between.plan[2].warnings.some(warning => warning.includes("يسبق")), "a reply after its parent but before its post still warns");
});

test("invalid JSON, fields, calendar rollover, negative/fractional likes and future dates are blocked", () => {
  for (const raw of ["null", "[]", "{", "{}", '{"posts":[]}']) assert.throws(() => plan.parseImportSource(raw, "posts", NOW));
  for (const row of [content({ content: " " }), content({ content: {} }), content({ created_at: "bad" }),
    content({ created_at: "2026-02-31T12:00:00Z" }), content({ created_at: "2026-10-17T12:01:01Z" }),
    content({ created_at: "2020-01-01T12:00:00" }), content({ created_at: "2020-01-01T24:00:00Z" }),
    content({ likes_count: -1 }), content({ likes_count: 1.1 }), content({ likes_count: "20" }),
    content({ comments: {} }), content({ author_username: 10 })]) assert.throws(() => parsed([row]));
  assert.equal(plan.normalizeImportTimestamp("2026-10-17T12:01:00Z", NOW), "2026-10-17T12:01:00.000Z");
});

test("batch limits cover total nested content and UTF-8 bytes", () => {
  assert.throws(() => parsed(Array.from({ length: 1001 }, () => content())), /1000/);
  assert.throws(() => parsed([content({ content: "ع".repeat(450001) })]), /900/);
  let nested = content();
  for (let depth = 0; depth < 22; depth++) nested = content({ replies: [nested] });
  assert.throws(() => parsed([content({ comments: [nested] })]), /20/);
});

test("editing permits only unpublished content fields and an explicitly chosen current identity", () => {
  assert.deepEqual(plan.validateImportItemPatch({ content: "نص جديد", likesCount: 900, username: "poster", createdAt: DATE }, pool, NOW),
    { content: "نص جديد", createdAt: "2020-02-02T12:00:00.000Z", likesCount: 900, username: "poster" });
  for (const patch of [{ id: POST }, { state: "published" }, { targetPostId: POST }, { username: "stale" }, {}, { likesCount: -1 }]) {
    assert.throws(() => plan.validateImportItemPatch(patch, pool, NOW));
  }
});

function environment(results = {}, rpcResult = ok(batch()), user = { id: ID, email: "uomankotd@gmail.com" }, authError = null) {
  const queues = Object.fromEntries(Object.entries(results).map(([name, values]) => [name, [...values]]));
  const calls = [];
  let privilegedClients = 0;
  const client = {
    from(table) {
      const operations = [];
      const query = {};
      for (const method of ["select", "eq", "in", "order", "limit", "range", "insert", "update", "delete"]) {
        query[method] = (...args) => { operations.push([method, ...args]); return query; };
      }
      const run = () => { calls.push({ table, operations }); return queues[table]?.shift() ?? ok([]); };
      query.maybeSingle = query.single = async () => run();
      query.then = (resolve, reject) => Promise.resolve(run()).then(resolve, reject);
      return query;
    },
    async rpc(name, args) { calls.push({ rpc: name, args }); return typeof rpcResult === "function" ? rpcResult(name, args) : rpcResult; },
  };
  const actions = load("src/app/admin/import/batch-actions.ts", {
    "@/lib/supabase/server": { createClient: async () => ({ auth: { getUser: async () => ({ data: { user }, error: authError }) } }) },
    "@/lib/supabase/admin": { createAdminClient: () => { privilegedClients++; return client; } },
    "@/lib/import-batch-plan": plan,
    "next/cache": { revalidatePath() {} },
  });
  return { actions, calls, get privilegedClients() { return privilegedClients; } };
}
const dbPool = pool.map(item => ({ username: item.username, display_name: item.displayName, activity_weight: item.activityWeight, role_preference: item.rolePreference }));

test("every exported batch action checks the exact main admin before privileged reads or writes", async () => {
  for (const user of [null, { id: ID, email: "ordinary@example.test" }]) {
    const env = environment({}, undefined, user);
    for (const [name, action] of Object.entries(env.actions)) {
      assert.equal(typeof action, "function", name);
      await assert.rejects(action(ID), /Unauthorized/, name);
    }
    assert.equal(env.privilegedClients, 0);
    assert.equal(env.calls.length, 0);
  }
  const env = environment({}, undefined, { id: ID, email: "uomankotd@gmail.com" }, { message: "auth failed" });
  await assert.rejects(env.actions.listImportBatches(), /Unauthorized/);
  assert.equal(env.privilegedClients, 0);
});

test("preview saves only a private plan; no profile, auth-user, content or counters are written", async () => {
  const env = environment({ admin_import_batches: [ok(null)], ghost_identities: [ok(dbPool)] }, (name, args) => {
    assert.equal(name, "admin_import_create");
    assert.equal(args.p_created_by, ID);
    assert.equal(args.p_plan[0].likesCount, 304);
    return ok(batch(args.p_plan));
  });
  const result = await env.actions.previewImportBatch(input([content({ likes_count: 304 })]), "posts", "معاينة");
  assert.equal(result.success, true);
  assert.equal(result.batch.status, "draft");
  assert.deepEqual(env.calls.filter(call => call.rpc).map(call => call.rpc), ["admin_import_create"]);
  assert.ok(env.calls.filter(call => call.table).every(call => ["admin_import_batches", "ghost_identities"].includes(call.table)));
  assert.ok(env.calls.every(call => !call.operations?.some(([op]) => ["insert", "update", "delete"].includes(op))));
});

test("reupload returns the existing completed batch even when the ghost pool is now empty", async () => {
  const completed = batch(undefined, "completed");
  const env = environment({ admin_import_batches: [ok(completed)], ghost_identities: [ok([])] });
  const result = await env.actions.previewImportBatch(input([content()]), "posts", "different name");
  assert.equal(result.success, true);
  assert.equal(result.reused, true);
  assert.equal(result.batch.id, ID);
  assert.equal(result.batch.status, "completed");
  assert.equal(env.calls.filter(call => call.rpc).length, 0);
});

test("preview with missing target, corrupt timestamp, or failed pool lookup never persists a batch", async () => {
  const missing = environment({ admin_import_batches: [ok(null)], ghost_identities: [ok(dbPool)], posts: [ok([])] });
  const result = await missing.actions.previewImportBatch(JSON.stringify({ comments: [{ post_id: POST, entries: [content()] }] }), "comments");
  assert.equal(result.success, false);
  assert.match(result.errors[0], /غير موجود/);
  assert.equal(missing.calls.filter(call => call.rpc).length, 0);
  const invalid = environment();
  assert.equal((await invalid.actions.previewImportBatch(input([content({ created_at: "bad" })]), "posts")).success, false);
  assert.equal(invalid.calls.length, 0);
  const failed = environment({ admin_import_batches: [ok(null)], ghost_identities: [{ data: null, error: { message: "offline" } }] });
  assert.equal((await failed.actions.previewImportBatch(input([content()]), "posts")).success, false);
  assert.equal(failed.calls.filter(call => call.rpc).length, 0);
});

test("item edits call the locked RPC with validated changes and cannot forge publication state", async () => {
  const env = environment({ ghost_identities: [ok(dbPool), ok(dbPool)] });
  assert.equal((await env.actions.updateImportBatchItem(ID, "posts.0", { content: "تعديل", likesCount: 1000 })).success, true);
  const call = env.calls.find(call => call.rpc);
  assert.equal(call.rpc, "admin_import_edit");
  assert.deepEqual(call.args, { p_batch_id: ID, p_key: "posts.0", p_changes: { content: "تعديل", likesCount: 1000 } });
  assert.equal((await env.actions.updateImportBatchItem(ID, "posts.0", { state: "published" })).success, false);
  assert.equal(env.calls.filter(call => call.rpc).length, 1);
});

test("processing uses the bounded transactional RPC and returns durable item failures for resumable UI", async () => {
  const items = plan.buildImportPlan(parsed(), pool).plan;
  items[0].state = "failed";
  items[0].error = "الهوية حُذفت من المخزون";
  const env = environment({}, ok(batch(items, "partial")));
  const result = await env.actions.processImportBatchStep(ID);
  assert.equal(result.success, false);
  assert.equal(result.batch.status, "partial");
  assert.match(result.errors[0], /الهوية/);
  assert.deepEqual(env.calls[0], { rpc: "admin_import_step", args: { p_batch_id: ID, p_limit: 10 } });
});

test("pause and resume use control RPC; histories and stats expose metadata without content mutation", async () => {
  const summary = { id: ID, label: "دفعة", mode: "posts", status: "draft", createdAt: DATE, updatedAt: DATE,
    total: 1, published: 0, duplicates: 0, failed: 0, pending: 1 };
  const env = environment({}, (name) => name === "admin_import_history" ? ok([summary]) : ok(batch()));
  await env.actions.pauseImportBatch(ID);
  await env.actions.resumeImportBatch(ID);
  const history = await env.actions.listImportBatches();
  assert.equal(history.batches[0].pending, 1);
  assert.equal(history.batches[0].total, 1);
  assert.equal(history.batches[0].plan, undefined);
  assert.deepEqual(env.calls.filter(call => call.rpc === "admin_import_control").map(call => call.args.p_action), ["pause", "resume"]);
  assert.deepEqual(env.calls.find(call => call.rpc === "admin_import_history").args, { p_limit: 30 });
  const stats = { manualLikes: 500, relationshipLikes: 3, memberRelationshipLikes: 2, managedRelationshipLikes: 1,
    managedPosts: 1, managedComments: 0, memberReplies: 4, deletedItems: 0 };
  const statEnv = environment({}, ok(stats));
  assert.deepEqual((await statEnv.actions.getImportBatchStats(ID)).stats, stats);
  assert.deepEqual(statEnv.calls.map(call => call.rpc), ["admin_import_stats"]);
});
