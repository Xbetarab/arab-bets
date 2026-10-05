#!/usr/bin/env node
'use strict';
// Read-only by default. Only --apply changes the two listed production marketing files.
// Coordinates are ESLint's one-based UTF-16 line/column positions, not UTF-8 bytes.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const argv = process.argv.slice(2);
if (argv.length < 1 || argv.length > 2 || (argv[1] && argv[1] !== '--apply')) {
  console.error('Usage: node fix-live-jsx-quotes.cjs CHECKOUT [--apply]');
  process.exit(2);
}
const root = fs.realpathSync(argv[0]);
const apply = argv[1] === '--apply';
const ts = require(path.join(root, 'node_modules', 'typescript'));
const targets = [
  { file: 'src/app/1xbet/aviator/page.tsx', coordinates: [[173,64],[173,69],[318,100],[318,104],[318,109],[318,121],[319,58],[319,76],[319,81],[319,100],[327,70],[327,76]] },
  { file: 'src/app/1xbet/bonus/page.tsx', coordinates: [[261,103],[261,116]] }
];
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function fail(message) { throw new Error(message); }
function parse(file, text) {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  if (source.parseDiagnostics.length) fail(`${file}: TypeScript parse diagnostics; no files changed`);
  return source;
}
function rendered(file, text) {
  // React JSX transform decodes text entities. Identical output proves preserved rendering.
  return ts.transpileModule(text, { fileName: file, compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext,
    jsx: ts.JsxEmit.ReactJSX, removeComments: false
  }}).outputText;
}
try {
  const prepared = targets.map(({file, coordinates}) => {
    const filename = path.join(root, file);
    if (fs.realpathSync(filename) !== filename || !fs.statSync(filename).isFile()) fail(`${file}: unexpected symlink or file type`);
    const original = fs.readFileSync(filename);
    const text = original.toString('utf8');
    if (!Buffer.from(text, 'utf8').equals(original)) fail(`${file}: invalid UTF-8`);
    const source = parse(file, text);
    const jsxText = [];
    const visit = node => { if (ts.isJsxText(node)) jsxText.push(node); ts.forEachChild(node, visit); };
    visit(source);
    const edits = coordinates.map(([line, column]) => {
      const starts = source.getLineStarts();
      if (line < 1 || line > starts.length || column < 1) fail(`${file}:${line}:${column}: invalid coordinate`);
      const offset = starts[line - 1] + column - 1;
      const actual = source.getLineAndCharacterOfPosition(offset);
      if (actual.line !== line - 1 || actual.character !== column - 1) fail(`${file}:${line}:${column}: coordinate outside line`);
      const char = text[offset];
      if (char !== '"' && char !== "'") fail(`${file}:${line}:${column}: expected raw quote; no files changed`);
      if (!jsxText.some(node => node.pos <= offset && offset < node.end)) fail(`${file}:${line}:${column}: quote is not JsxText; no files changed`);
      return { offset, replacement: char === '"' ? '&quot;' : '&#39;' };
    });
    if (new Set(edits.map(edit => edit.offset)).size !== edits.length) fail(`${file}: duplicate coordinates`);
    let updated = text;
    for (const edit of edits.sort((a,b) => b.offset - a.offset)) updated = updated.slice(0,edit.offset) + edit.replacement + updated.slice(edit.offset + 1);
    parse(file, updated);
    if (rendered(file, text) !== rendered(file, updated)) fail(`${file}: JSX transform changed; no files changed`);
    return { file, filename, original, updated: Buffer.from(updated, 'utf8'), edits: edits.length, mode: fs.statSync(filename).mode & 0o777 };
  });
  if (prepared.reduce((count,item) => count + item.edits,0) !== 14) fail('Expected exactly14 edits');
  // Validate BOTH files again before any filesystem mutation.
  for (const item of prepared) if (!fs.readFileSync(item.filename).equals(item.original)) fail(`${item.file}: changed during validation; no files changed`);
  if (apply) {
    const temporary = [];
    try {
      for (const item of prepared) {
        const temp = `${item.filename}.jsx-quotes-${process.pid}.tmp`;
        fs.writeFileSync(temp, item.updated, {flag:'wx',mode:item.mode});
        temporary.push({temp,item});
      }
      for (const {temp,item} of temporary) fs.renameSync(temp,item.filename);
    } finally {
      for (const {temp} of temporary) if (fs.existsSync(temp)) fs.unlinkSync(temp);
    }
  }
  console.log(JSON.stringify({ mode: apply ? 'APPLIED' : 'DRY RUN; NO FILES CHANGED', edits:14, typescript:ts.version, jsx_rendering_preserved:true, files:prepared.map(item => ({path:item.file,edits:item.edits,before_sha256:sha(item.original),after_sha256:sha(item.updated)})) },null,2));
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exit(1);
}
