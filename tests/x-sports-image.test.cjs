const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

function imageRoute(sourceUrl, upstream = () => new Response(new Uint8Array([1, 2, 3]), {
  headers: { "Content-Type": "image/png" },
})) {
  const filename = path.join(__dirname, "../src/app/api/sports-image/[id]/[kind]/route.ts");
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const requests = [];
  const query = {
    select() { return this; }, eq() { return this; }, is() { return this; }, gt() { return this; },
    async single() { return { data: { author_avatar_url: sourceUrl, media_json: [{ url: sourceUrl }] }, error: null }; },
  };
  const mocks = {
    "@/lib/supabase/admin": { createAdminClient: () => ({ from: () => query }) },
    "@/lib/x-sports/public-feed": { sportsFeedEnabled: async () => true },
  };
  const loaded = { exports: {} };
  new Function("require", "module", "exports", "fetch", source)(
    (name) => mocks[name] ?? require(name), loaded, loaded.exports,
    async (url, options) => { requests.push({ url: String(url), options }); return upstream(); },
  );
  return {
    requests,
    get: (kind = "avatar") => loaded.exports.GET(new Request("https://arabtips.com/api/sports-image/123/avatar"), {
      params: Promise.resolve({ id: "123", kind }),
    }),
  };
}

test("image proxy allows the exact default avatar while retaining its fetch and response protections", async () => {
  const url = "https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png";
  const route = imageRoute(url);
  const response = await route.get();
  assert.equal(response.status, 200);
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [1, 2, 3]);
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assert.equal(route.requests.length, 1);
  assert.equal(route.requests[0].url, url);
  assert.equal(route.requests[0].options.redirect, "manual");
});

test("default avatar allowance cannot fetch other paths, hosts, media, or credentialed URLs", async () => {
  const defaultPath = "/sticky/default_profile_images/default_profile_normal.png";
  for (const [url, kind] of [
    [`https://abs.twimg.com${defaultPath}`, "media-0"],
    ["https://abs.twimg.com/unrelated.png", "avatar"],
    [`https://abs.twimg.com${defaultPath}?redirect=1`, "avatar"],
    [`https://abs.twimg.com${defaultPath}#fragment`, "avatar"],
    [`https://abs.twimg.com.evil.test${defaultPath}`, "avatar"],
    [`https://127.0.0.1${defaultPath}`, "avatar"],
    [`http://abs.twimg.com${defaultPath}`, "avatar"],
    [`https://user:password@abs.twimg.com${defaultPath}`, "avatar"],
    [`https://abs.twimg.com:8443${defaultPath}`, "avatar"],
  ]) {
    const route = imageRoute(url);
    assert.equal((await route.get(kind)).status, 404, url);
    assert.equal(route.requests.length, 0, url);
  }
});

test("default avatar responses still reject redirects, oversized bodies, and non-images", async () => {
  const url = "https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png";
  for (const upstream of [
    () => new Response(null, { status: 302, headers: { Location: "https://evil.test/image.png" } }),
    () => new Response("oversized", { headers: { "Content-Type": "image/png", "Content-Length": "2000001" } }),
    () => new Response("<script>bad</script>", { headers: { "Content-Type": "text/html" } }),
  ]) {
    assert.equal((await imageRoute(url, upstream).get()).status, 404);
  }
});
