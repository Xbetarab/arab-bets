#!/usr/bin/env node
'use strict';
// Read the current site and write a separate candidate only. Never reload nginx.
const fs = require('node:fs');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const [input, output] = process.argv.slice(2);
assert(input && output && process.argv.length === 4, 'Usage: node helper CURRENT_SITE NEW_CANDIDATE');
assert(fs.lstatSync(input).isFile() && !fs.lstatSync(input).isSymbolicLink(), 'Input must be a regular site file');
assert(!fs.existsSync(output), 'Candidate already exists; review it before replacing');
const before = fs.readFileSync(input, 'utf8');
const marker = 'server_name arabtips.com www.arabtips.com;';
const oldProxy = 'proxy_pass http://127.0.0.1:3001;';
const oldHttp = 'return 301 https://$host$request_uri;';
const count = (s, part) => s.split(part).length - 1;
assert.equal(count(before, marker), 2, 'Unexpected server-name inventory');
assert.equal(count(before, oldProxy), 1, 'Unexpected current upstream');
assert.equal(count(before, oldHttp), 2, 'Unexpected HTTP redirects');
assert.equal(count(before, 'listen 443 ssl;'), 1, 'Unexpected HTTPS blocks');
assert.equal(count(before, 'include /etc/nginx/arabtips-hidden.conf;'), 1, 'Hidden-file protection missing');
const firstName = before.indexOf(marker);
const secondName = before.indexOf(marker, firstName + marker.length);
assert(firstName < before.indexOf('listen 443 ssl;') && before.indexOf('listen 443 ssl;') < secondName, 'Unexpected HTTPS block placement');
assert(!before.includes('https://arabtips.com$request_uri'), 'Canonical redirect already present; do not apply twice');
const redirect = '\n    if ($host = www.arabtips.com) { return 301 https://arabtips.com$request_uri; }';
const after = before.replace(marker, marker + redirect)
  .replaceAll(oldHttp, 'return 301 https://arabtips.com$request_uri;')
  .replace(oldProxy, 'proxy_pass http://127.0.0.1:3002;');
assert.equal(count(after, 'include /etc/nginx/arabtips-hidden.conf;'), 1);
assert.equal(count(after, 'https://arabtips.com$request_uri'), 3);
assert.equal(count(after, 'proxy_pass http://127.0.0.1:3002;'), 1);
assert.equal(count(after, oldHttp), 0);
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
fs.writeFileSync(output, after, { flag: 'wx', mode: 0o600 });
console.log(JSON.stringify({stageOnly:true,input,output,beforeSha256:sha(before),afterSha256:sha(after),changes:['HTTPS www to apex preserving path/query','HTTP directly to HTTPS apex preserving path/query','upstream loopback 3001 to 3002'],requires:'Validate nginx -t and check the new app before reload'},null,2));
