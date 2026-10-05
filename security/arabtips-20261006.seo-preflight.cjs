"use strict";
// Read-only exact-byte preflight. Never applies a patch or contacts Supabase.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");
const manifest = {
  "expected_git_head": "606e974b9a3df9f3ac641795d33372307d01a1e1",
  "patch_sha256": "eee1874bce839cc1ac1545bbc1c9408c86ef23463444e757fe8e1dbd1f7c9855",
  "files": [
    {
      "path": "public/robots.txt",
      "before_sha256": "37c5eb33363832fc03d4c1e5ffa11d73d81564bdd8ee7d22e526b1a9fe78a48d",
      "after_sha256": "6083e049b9e8f01731bf9a1892d7db7b59c5c94518972531d5c7e54cf208f511",
      "before_bytes": 135,
      "after_bytes": 117
    },
    {
      "path": "src/app/layout.tsx",
      "before_sha256": "a64ccf1680c63b0687c750e12951c34d562815290274ebed82719da101f22935",
      "after_sha256": "d3caa1159676f917f6049584b8c1db86062dcbe793ab60cf27c988d7863f5cf9",
      "before_bytes": 1537,
      "after_bytes": 1586
    },
    {
      "path": "src/app/(main)/page.tsx",
      "before_sha256": "57d8792f886488810c886bb7d53a864d31322538e82459034630e23d4359bdda",
      "after_sha256": "3e15e8d4b15527d4f7dced7bb2fc7d4c64993c293986d1f351a9fea32e6e1b28",
      "before_bytes": 369,
      "after_bytes": 1745
    },
    {
      "path": "src/components/feed.tsx",
      "before_sha256": "cf410510d15214d83ccf93d40c60b639bf27d5d2e27fbcbad7d1e726369aa11b",
      "after_sha256": "318b335f5662e2fbf4abeb5d569c8ab0f4d1425f4d4649297ac4557a1486b583",
      "before_bytes": 4901,
      "after_bytes": 4642
    },
    {
      "path": "src/proxy.ts",
      "before_sha256": "739560fc2f7139e3ada4c71c244b61cfc9c2d7c15b350c35e392476a748e0826",
      "after_sha256": "31c96caf01e952af7ae40c2e310e29eb914b48962a3b6caab1ba1993d21fe751",
      "before_bytes": 2704,
      "after_bytes": 2721
    },
    {
      "path": "tests/feed-ssr-seo.test.cjs",
      "before_sha256": null,
      "after_sha256": "4af899cb71541899be7e81b084a2159485c2ab55af42b12a039fc789409d7b32",
      "before_bytes": null,
      "after_bytes": 7921
    }
  ]
};
const [checkoutArgument, patchArgument, phase] = process.argv.slice(2);
if (!checkoutArgument || !patchArgument || !["before", "after"].includes(phase)) {
  console.error("Usage: node core-preflight.cjs CHECKOUT CORE_PATCH before|after");
  process.exit(2);
}
const git = process.env.ARABTIPS_GIT_BIN || "git";
function hash(bytes) { return crypto.createHash("sha256").update(bytes).digest("hex"); }
function runGit(args) {
  const result = spawnSync(git, args, { encoding: "utf8" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Read-only git check failed: ${result.stderr.trim()}`);
  return result.stdout.trim();
}
function statOrMissing(file) {
  try { return fs.lstatSync(file); }
  catch (error) { if (error.code === "ENOENT") return null; throw error; }
}
try {
  const checkout = fs.realpathSync(checkoutArgument);
  if (!fs.statSync(checkout).isDirectory()) throw new Error("Checkout is not a directory");
  const patchFile = fs.realpathSync(patchArgument);
  if (hash(fs.readFileSync(patchFile)) !== manifest.patch_sha256) throw new Error("Core patch SHA256 mismatch");
  const head = runGit(["-C", checkout, "rev-parse", "HEAD"]);
  if (head !== manifest.expected_git_head) throw new Error(`Unexpected checkout HEAD: ${head}`);
  const checked = [];
  for (const item of manifest.files) {
    const file = path.join(checkout, item.path);
    const expected = item[`${phase}_sha256`];
    const stat = statOrMissing(file);
    if (expected === null) {
      if (stat !== null) throw new Error(`Expected absent new file: ${item.path}`);
    } else {
      if (!stat?.isFile() || stat.isSymbolicLink()) throw new Error(`Expected regular file: ${item.path}`);
      const realFile = fs.realpathSync(file);
      if (!realFile.startsWith(checkout + path.sep)) throw new Error(`File escapes checkout: ${item.path}`);
      if (hash(fs.readFileSync(file)) !== expected) throw new Error(`${phase} SHA256 mismatch: ${item.path}`);
    }
    checked.push({ path: item.path, sha256: expected });
  }
  const args = ["-C", checkout, "apply", "--check", "--whitespace=error-all"];
  if (phase === "after") args.push("--reverse");
  args.push(patchFile);
  runGit(args);
  console.log(JSON.stringify({ phase, result: "PASS", read_only: true, applied: false,
    expected_git_head: head, patch_sha256: manifest.patch_sha256,
    file_count: checked.length, files: checked }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ phase, result: "FAIL", read_only: true, applied: false, error: error.message }));
  process.exit(1);
}
