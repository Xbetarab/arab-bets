const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

function loadSource(relativePath, mocks = {}) {
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, "..", relativePath), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const testModule = { exports: {} };
  new Function("require", "module", "exports", source)((name) => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (name.startsWith("@/lib/")) return loadSource(`src/${name.slice(2)}.ts`);
    return require(name);
  }, testModule, testModule.exports);
  return testModule.exports;
}

const targetId = "11111111-1111-4111-8111-111111111111";

function setup(file, { visible = true, insertError = null, existing = null, deleted = [] } = {}) {
  let privilegedClients = 0;
  let rpcCalls = 0;
  let writes = 0;
  function query(result, privileged = false) {
    const chain = new Proxy({}, { get(_target, key) {
      if (key === "then") return (resolve) => resolve(result);
      if (key === "maybeSingle") return async () => result;
      if (["insert", "delete"].includes(key)) return () => {
        if (privileged) writes++;
        return chain;
      };
      return () => chain;
    } });
    return chain;
  }
  const user = { id: "22222222-2222-4222-8222-222222222222" };
  const client = {
    auth: { getUser: async () => ({ data: { user } }) },
    from: () => query({ data: visible ? { id: targetId, post_id: targetId } : null, error: null }),
  };
  const admin = {
    from: () => {
      const chain = new Proxy({}, { get(_target, key) {
        if (key === "then") return (resolve) => resolve({ data: deleted, error: insertError });
        if (key === "maybeSingle") return async () => ({ data: existing, error: null });
        if (["insert", "delete"].includes(key)) return () => { writes++; return chain; };
        return () => chain;
      } });
      return chain;
    },
    rpc: async () => { rpcCalls++; return { error: null }; },
  };
  const actions = loadSource(file, {
    "@/lib/supabase/server": { createClient: async () => client },
    "@/lib/supabase/admin": { createAdminClient: () => { privilegedClients++; return admin; } },
    "next/cache": { revalidatePath: () => {} },
  });
  return { actions, metrics: () => ({ privilegedClients, rpcCalls, writes }) };
}

for (const [file, action] of [
  ["src/app/actions/likes.ts", "togglePostLike"],
  ["src/app/actions/likes.ts", "toggleCommentLike"],
  ["src/app/actions/follows.ts", "toggleFollow"],
]) {
  test(`${action}: invisible targets do not reach privileged writes`, async () => {
    const { actions, metrics } = setup(file, { visible: false });
    await assert.rejects(actions[action](targetId));
    assert.deepEqual(metrics(), { privilegedClients: 0, rpcCalls: 0, writes: 0 });
  });
  test(`${action}: failed or duplicate inserts cannot inflate counters`, async () => {
    const { actions, metrics } = setup(file, { insertError: { code: "23505" } });
    await assert.rejects(actions[action](targetId));
    assert.equal(metrics().writes, 1);
    assert.equal(metrics().rpcCalls, 0);
  });
  test(`${action}: concurrent removal of an already-deleted row does not decrement counters`, async () => {
    const { actions, metrics } = setup(file, { existing: { id: targetId }, deleted: [] });
    await actions[action](targetId);
    assert.equal(metrics().writes, 1);
    assert.equal(metrics().rpcCalls, 0);
  });
  test(`${action}: valid public interaction retains its counter update`, async () => {
    const { actions, metrics } = setup(file);
    await actions[action](targetId);
    assert.equal(metrics().writes, 1);
    assert.equal(metrics().rpcCalls, 1);
  });
}
