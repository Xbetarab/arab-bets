const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");
const metadata = {
  "application_status": "NOT DEPLOYED",
  "database_status": "NOT DEPLOYED",
  "expected_git_head": "606e974b9a3df9f3ac641795d33372307d01a1e1",
  "expected_cwd": "/root/arab-bets",
  "live_middleware_sha256": "5c59ac71511a3082d866525dbcbbe4781c0d5c388690b5d6ea1b2fa250815574",
  "baseline_description": "Git commit plus exactly verified live middleware public-route additions",
  "preserved": [
    "no standalone output; existing next start / PM2 deployment",
    "framer-motion ^12.42.2 and existing motion lock entries",
    "primary admin actions/import and all ghost allocations",
    "all existing tracked/untracked marketing pages and crawler assets",
    "existing private environment files and service credentials"
  ],
  "excluded": [
    "all security SQL; database deployment is separate",
    "nginx deployment; handled separately",
    "Docker-only source configuration",
    "marketing pages, assets, sitemap and robots"
  ],
  "application_patch_sha256": "78bf8b21d0915be7446c0d18c1a92e5b5e479994ca81f2d54294c5f9e1460e62",
  "rollback_patch_sha256": "02335cf0a3f819f370da7aea4cf8c74dc2a22d978e184c55dc3d5dc91ac75206",
  "files": [
    {
      "path": "eslint.config.mjs",
      "before_sha256": "727615b35bf580cd6f625d0a65d17db4218fdb865d487388e710984bbbc85d12",
      "after_sha256": "a99af37f012ced3ca5cefae92c414898f1dffd103c31cdc970cf339f264087df"
    },
    {
      "path": "next.config.ts",
      "before_sha256": "6644e23b5bdf1186d5e42240510ad677eeb7fadbe9119e9cffb031ddc69531aa",
      "after_sha256": "ee9bf595c8c8231f546944d79cd3166b7471b316eec35edbc20e2e91008f07c7"
    },
    {
      "path": "package-lock.json",
      "before_sha256": "e555a9a63af1e76fe8f70fd2a0578d982d4af38d2277618c72b24f73679b6ce4",
      "after_sha256": "5f9004a633b132480fa9b3b5a1860fcf47d93fea678e031f7f5e7598a31d6494"
    },
    {
      "path": "package.json",
      "before_sha256": "d408ccaaed36ca3f2a2163dd7844b4a1642160ea5a0c6a8f8ebb7816f45eebd9",
      "after_sha256": "df53c84162b9dc73e7fc9fbefac0e034fa66fb09fdc636cb0f6d6c38c21a284a"
    },
    {
      "path": "src/app/actions/clicks.ts",
      "before_sha256": "3653dd943e68fe28dd23c88d131b9d21a080100749f6bc621d390f20e16ffdb5",
      "after_sha256": "7aac6f680b90ae25967d70c9beb51190fcb1fccf534e9304cbf1a9b30b7ddbd2"
    },
    {
      "path": "src/app/actions/comments.ts",
      "before_sha256": "c8ab80f8b4397d969ac7085764120d3d32a342bc6274a928fe323e795cb49207",
      "after_sha256": "d0772370884057affed65415d037ff297f654aab8db4a4b98e3d121098f44aec"
    },
    {
      "path": "src/app/actions/follows.ts",
      "before_sha256": "b72a6f84a887785f0c29e1fc4f62614e2cae07a36069d69bf19d8265a4af89a7",
      "after_sha256": "a183c816959752751621ae467987ecdc0be88eed9ce07f0bfd3778b21fc7a56f"
    },
    {
      "path": "src/app/actions/likes.ts",
      "before_sha256": "36fd9e964aa70dac85ec797ee61dd21ed0c74e3eb507860acbeda168ba8eb260",
      "after_sha256": "91ecd8cb35a46d468d7d93f3725829b1b375c65c1479b864255d5f04c69295a7"
    },
    {
      "path": "src/app/actions/posts.ts",
      "before_sha256": "8b01191850ef5d34c2f2b118e22bd3bd874e5b1f3a9143441cff7a052a9b2a69",
      "after_sha256": "8f3ebf780424198981ba22e31474981709ef8aff830c07aecc016480e1d39f89"
    },
    {
      "path": "src/app/actions/profile.ts",
      "before_sha256": "7cfa77b53e238db9d54ff52cad4d6ab1dc8831d281a94f03ee15eb36a3b6eab5",
      "after_sha256": "d5642a7351fb638eda812410d17b05646d28da35eceb49f0437e4fee8568d95b"
    },
    {
      "path": "src/app/admin/analytics/actions.ts",
      "before_sha256": "a3ef900c18afae8327d2f88b8f047b3391b31f1d5009094f18ae620489534aa0",
      "after_sha256": "834888cc2e7e135e1928dfb5408eacb0b774a919320b10d47745f48c32aef590"
    },
    {
      "path": "src/app/auth/callback/route.ts",
      "before_sha256": "2aac95f68549bec5d6f8a3b44d4ece52518f5a59e892bba3b7453bade4ba1621",
      "after_sha256": "ad35856b92637dfcce489bd2ca0bccd1be0a0067223faae811c1168ea817413d"
    },
    {
      "path": "src/lib/auth-redirect.ts",
      "before_sha256": null,
      "after_sha256": "31533b5f5cc2836d7f8f3cc9fbaa14d4fb431b1e2b48edcb822e14d5474bd8e9"
    },
    {
      "path": "src/lib/input-validation.ts",
      "before_sha256": null,
      "after_sha256": "bc0ae9f08782b3d5bbc0dfbb16a57d1daaefb829d3b475bb4590d65e206ad738"
    },
    {
      "path": "src/lib/supabase/admin.ts",
      "before_sha256": "ffc834df2f09c671558c491d8405f8189357aff5c47c995c6f7906f69bc89021",
      "after_sha256": "29be4a3c2a7f798750623e76f85d4e97f436305d26f208493d8c7e2d9f35dcf4"
    },
    {
      "path": "src/middleware.ts",
      "before_sha256": "5c59ac71511a3082d866525dbcbbe4781c0d5c388690b5d6ea1b2fa250815574",
      "after_sha256": null
    },
    {
      "path": "src/proxy.ts",
      "before_sha256": null,
      "after_sha256": "739560fc2f7139e3ada4c71c244b61cfc9c2d7c15b350c35e392476a748e0826"
    },
    {
      "path": "tests/actions-security.test.cjs",
      "before_sha256": null,
      "after_sha256": "af3d6554c177f9c174d98b83d85d1a697d4c2c6134f7ff98bca241b8194245e0"
    },
    {
      "path": "tests/auth-security.test.cjs",
      "before_sha256": null,
      "after_sha256": "5fa993772b09edf58312fb0ea5a6997e737fda07ce680d4c2b4426de22b9016c"
    },
    {
      "path": "tests/interactions-security.test.cjs",
      "before_sha256": null,
      "after_sha256": "17825b34f5a2db48d373cefb39026da2cf39ba821b1122426b3ed3ca321aa756"
    }
  ],
  "verification": {
    "application_patch_applies_to_exact_live_reference": true,
    "rollback_restores_exact_live_reference": true,
    "marketing_and_admin_actions_untouched": true,
    "local_marketing_limit": "Uncommitted server marketing pages were not copied locally; final server build must validate them before PM2 restart."
  },
  "nginx_status": "DEPLOYED",
  "nginx_backup": "/root/arabtips-nginx-backup-20261006",
  "nginx_evidence": "evidence/live-nginx-check.json"
};
const [checkoutArg, patchArg, phase] = process.argv.slice(2);
if (!checkoutArg || !patchArg || !["before", "after"].includes(phase)) {
  throw new Error("Usage: node preflight.cjs CHECKOUT PATCH before|after");
}
const checkout = path.resolve(checkoutArg);
const patch = path.resolve(patchArg);
const hash = (filename) => crypto.createHash("sha256").update(fs.readFileSync(filename)).digest("hex");
function git(args) {
  const result = spawnSync("git", args, { cwd: checkout, encoding: "utf8" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr.trim() || `git ${args[0]} failed`);
  return result.stdout.trim();
}
if (!fs.existsSync(patch) || !fs.lstatSync(patch).isFile() || hash(patch) !== metadata.application_patch_sha256) {
  throw new Error("Application patch SHA-256 differs from the reviewed patch");
}
if (git(["rev-parse", "HEAD"]) !== metadata.expected_git_head) {
  throw new Error("Git HEAD differs from the reviewed production commit");
}
for (const entry of metadata.files) {
  const filename = path.join(checkout, entry.path);
  const expected = entry[phase === "before" ? "before_sha256" : "after_sha256"];
  if (expected === null) {
    if (fs.existsSync(filename)) throw new Error(`Unexpected file: ${entry.path}`);
  } else if (!fs.existsSync(filename) || !fs.lstatSync(filename).isFile() || hash(filename) !== expected) {
    throw new Error(`Source checksum mismatch: ${entry.path}`);
  }
}
git(["apply", ...(phase === "after" ? ["--reverse"] : []), "--check", "--whitespace=error-all", patch]);
console.log(`PASS: ${phase} reviewed patch, HEAD, ${metadata.files.length} source hashes, and read-only patch applicability checks. No files changed.`);
