const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const { NextRequest } = require("next/server");

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

test("auth callback accepts local paths and rejects authority/host injection", () => {
  const { safeAuthRedirect } = loadSource("src/lib/auth-redirect.ts");
  const origin = "https://arabtips.com";
  for (const next of [null, "@evil.example/", ".evil.example", "https://evil.example/", "//evil.example/", "/\\evil.example/", "/\n/evil.example/"]) {
    assert.equal(safeAuthRedirect(origin, next).href, `${origin}/`);
  }
  assert.equal(safeAuthRedirect(origin, "/profile/edit?tab=avatar#form").href, `${origin}/profile/edit?tab=avatar#form`);
});

test("analytics requires admin authorization even when its cache is warm", async () => {
  let user = { id: "admin", email: "uomankotd@gmail.com" };
  let queryCount = 0;
  function query() {
    queryCount++;
    const chain = new Proxy({}, {
      get(_target, property) {
        if (property === "then") return (resolve) => resolve({ data: [], count: 0, error: null });
        return () => chain;
      },
    });
    return chain;
  }
  const admin = { from: query, rpc: query };
  const actions = loadSource("src/app/admin/analytics/actions.ts", {
    "@/lib/supabase/server": { createClient: async () => ({ auth: { getUser: async () => ({ data: { user } }) } }) },
    "@/lib/supabase/admin": { createAdminClient: () => admin },
  });
  const first = await actions.fetchAllAnalytics();
  const queriesAfterWarm = queryCount;
  assert.equal((await actions.fetchAllAnalytics()), first);
  assert.equal(queryCount, queriesAfterWarm, "admin cache hit should avoid DB queries");
  user = null;
  await assert.rejects(actions.fetchAllAnalytics(), /Unauthorized/);
  await assert.rejects(actions.fetchAllAnalytics(true), /Unauthorized/);
  user = { id: "ordinary", email: "ordinary@example.test" };
  await assert.rejects(actions.fetchAllAnalytics(), /Unauthorized/);
  assert.equal(queryCount, queriesAfterWarm, "unauthorized callers must not query privileged data");
});

test("proxy forwards refresh cookies and no-cache headers onto protected redirects", async () => {
  const { proxy } = loadSource("src/proxy.ts", {
    "@supabase/ssr": {
      createServerClient: (_url, _key, options) => ({
        auth: { getUser: async () => {
          options.cookies.setAll([{ name: "test-session", value: "refreshed", options: { path: "/", sameSite: "lax" } }], {
            "Cache-Control": "private, no-cache, no-store",
            Expires: "0",
            Pragma: "no-cache",
          });
          return { data: { user: null } };
        } },
      }),
    },
  });
  const response = await proxy(new NextRequest("https://arabtips.com/profile/edit"));
  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), "https://arabtips.com/auth/login");
  assert.equal(response.cookies.get("test-session").value, "refreshed");
  assert.match(response.headers.get("cache-control"), /no-store/);
  assert.equal(response.headers.get("expires"), "0");
  assert.equal(response.headers.get("pragma"), "no-cache");
});

test("verified sessions are never sent as shared cacheable responses", async () => {
  const { proxy } = loadSource("src/proxy.ts", {
    "@supabase/ssr": { createServerClient: () => ({ auth: { getUser: async () => ({ data: { user: { id: "ordinary" } } }) } }) },
  });
  const response = await proxy(new NextRequest("https://arabtips.com/"));
  assert.match(response.headers.get("cache-control"), /private.*no-store/);
});

test("production landing pages stay public while private routes require login", async () => {
  const { proxy, config } = loadSource("src/proxy.ts", {
    "@supabase/ssr": { createServerClient: () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }) },
  });
  const { unstable_doesMiddlewareMatch } = require("next/experimental/testing/server");
  for (const pathname of ["/1xbet", "/1xbet/promo-code", "/pariland", "/pariland/bonus", "/go/1xbet", "/eg", "/eg/1xbet", "/about", "/about/team", "/api/sports-image/123/avatar"]) {
    const response = await proxy(new NextRequest(`https://arabtips.com${pathname}`));
    assert.equal(response.status, 200, `public page ${pathname}`);
    assert.equal(response.headers.get("location"), null);
  }
  // Unknown URLs are no longer bounced to login; they fall through to the app 404.
  for (const pathname of ["/sports", "/sports-admin", "/api/sports-image-private/123/avatar", "/profile/someone"]) {
    const response = await proxy(new NextRequest(`https://arabtips.com${pathname}`));
    assert.equal(response.status, 200, `pass-through ${pathname}`);
    assert.equal(response.headers.get("location"), null);
  }
  const legacySitemap = await proxy(new NextRequest("https://arabtips.com/sitemap_index.xml"));
  assert.equal(legacySitemap.status, 301);
  assert.equal(legacySitemap.headers.get("location"), "https://arabtips.com/sitemap.xml");
  for (const pathname of ["/admin", "/admin/settings", "/profile/edit", "/create"]) {
    const response = await proxy(new NextRequest(`https://arabtips.com${pathname}`));
    assert.equal(response.status, 307, `protected page ${pathname}`);
    assert.equal(response.headers.get("location"), "https://arabtips.com/auth/login");
  }
  for (const pathname of ["/robots.txt", "/sitemap.xml", "/llms.txt"]) {
    assert.equal(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: pathname }), false, `public crawler asset ${pathname}`);
  }
  assert.equal(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: "/admin" }), true);
});

test("production sends anti-embedding, MIME and HTTPS headers", async () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    const config = loadSource("next.config.ts").default;
    const [{ headers }] = await config.headers();
    const values = Object.fromEntries(headers.map(({ key, value }) => [key.toLowerCase(), value]));
    assert.equal(config.poweredByHeader, false);
    assert.equal(values["x-frame-options"], "DENY");
    assert.equal(values["x-content-type-options"], "nosniff");
    assert.match(values["content-security-policy"], /frame-ancestors 'none'/);
    assert.match(values["strict-transport-security"], /max-age=31536000/);
    assert.doesNotMatch(values["strict-transport-security"], /includeSubDomains|preload/);
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
});
