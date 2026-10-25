const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

function setup({ user = { id: "11111111-1111-4111-8111-111111111111" }, authError = null,
  response = { data: { liked: true, likesCount: 300 }, error: null } } = {}) {
  const calls = { auth: 0, privileged: 0, rpc: [], revalidated: [] };
  const mocks = {
    "@/lib/supabase/server": { createClient: async () => ({ auth: { getUser: async () => {
      calls.auth++; return { data: { user }, error: authError };
    } } }) },
    "@/lib/supabase/admin": { createAdminClient: () => {
      calls.privileged++; return { rpc: async (name, args) => { calls.rpc.push({ name, args }); return response; } };
    } },
    "next/cache": { revalidatePath: value => calls.revalidated.push(value) },
  };
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, "../src/app/actions/imported-likes.ts"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", source)(name => {
    assert.ok(Object.hasOwn(mocks, name), `Unexpected dependency ${name}`); return mocks[name];
  }, loaded, loaded.exports);
  return { action: loaded.exports.setImportedPostLike, calls };
}

test("imported likes reject malformed IDs and non-boolean states before authentication", async () => {
  for (const [id, state] of [["x:123", true], ["123 OR 1=1", true], ["1".repeat(26), true], ["", true], [123, true], ["123", "true"], ["123", null]]) {
    const { action, calls } = setup();
    await assert.rejects(action(id, state));
    assert.equal(calls.auth, 0); assert.equal(calls.privileged, 0);
  }
});

test("imported likes require verified authentication before privileged access", async () => {
  for (const options of [{ user: null }, { authError: { message: "expired token" } }]) {
    const { action, calls } = setup(options);
    await assert.rejects(action("2112634954983059763", true), /تسجيل الدخول/);
    assert.equal(calls.auth, 1); assert.equal(calls.privileged, 0); assert.equal(calls.rpc.length, 0);
  }
});

test("imported likes use the authenticated identity and return only the final state/count", async () => {
  for (const desired of [true, false]) {
    const { action, calls } = setup({ response: { data: { liked: desired, likesCount: 300, privateMetadata: "never return" }, error: null } });
    const result = await action("2112634954983059763", desired);
    assert.deepEqual(result, { liked: desired, likesCount: 300 });
    assert.deepEqual(calls.rpc, [{ name: "set_x_sports_post_like", args: {
      p_post_id: "2112634954983059763", p_user_id: "11111111-1111-4111-8111-111111111111", p_liked: desired,
    } }]);
    assert.deepEqual(calls.revalidated, ["/"]);
  }
});

test("imported likes fail closed on unavailable targets, DB errors or malformed results", async () => {
  for (const response of [
    { error: { message: "X_SPORTS_POST_UNAVAILABLE" } },
    { error: { message: "secret database details" } },
    { data: { liked: "yes", likesCount: 300 } },
    { data: { liked: true, likesCount: -1 } },
    { data: null },
  ]) {
    const { action, calls } = setup({ response });
    await assert.rejects(action("2112634954983059763", true), error => !error.message.includes("secret database details"));
    assert.deepEqual(calls.revalidated, []);
  }
});
