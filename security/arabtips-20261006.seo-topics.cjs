#!/usr/bin/env node
'use strict';

// Dry-run by default. Only the explicit allowlist below can be written.
// No environment, authentication, database or administration files are read.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const BASE = 'https://arabtips.com';
const COMPONENT = 'src/components/seo/TopicNavigation.tsx';
const IRAQ_PAGE = 'src/app/1xbet/page.tsx';
const IRAQ_CLIENT = 'src/app/1xbet/page-client.tsx';
const IRAQ_WRAPPER = `import type { Metadata } from "next";
import GuidePage from "./page-client";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://arabtips.com/1xbet",
    languages: {
      "ar-IQ": "https://arabtips.com/1xbet",
      "ar-EG": "https://arabtips.com/eg/1xbet",
      "x-default": "https://arabtips.com/1xbet",
    },
  },
};

export default function XbetPage() {
  return <GuidePage />;
}
`;
const TOPICS = ['aviator', 'bonus', 'idaa', 'promo-code', 'sahb', 'tahmil-apk'];
const HIDDEN = {
  'src/app/pariland/idaa/layout.tsx': [
    'شنو طرق الإيداع المدعومة في العراق؟', 'هل الإيداع فوري؟', 'هل أحتاج الرمز الترويجي قبل الإيداع؟',
  ],
  'src/app/pariland/sahb/layout.tsx': [
    'شنو الحد الأدنى للسحب من Pariland؟', 'ليش حد آسيا سيل الأقصى واطي؟', 'شنو البيانات المطلوبة للسحب؟',
  ],
  'src/app/eg/1xbet/idaa/layout.tsx': [
    'إيه أشهر طرق الإيداع في 1xBet مصر؟', 'الإيداع بفودافون كاش بيوصل بسرعة؟',
  ],
};

const COMPONENT_SOURCE = `import Link from 'next/link';

const clusters = {
  egypt: {
    title: 'أدلة 1xBet في مصر',
    links: [
      ['/eg/1xbet', 'دليل 1xBet مصر'],
      ['/eg/1xbet/tahmil-apk', 'تحميل التطبيق'],
      ['/eg/1xbet/promo-code', 'الكود الترويجي'],
      ['/eg/1xbet/idaa', 'طرق الإيداع'],
      ['/eg/1xbet/sahb', 'طرق السحب'],
      ['/eg/1xbet/bonus', 'شروط المكافآت'],
      ['/eg/1xbet/aviator', 'شرح لعبة Aviator ومخاطرها'],
    ],
  },
  pariland: {
    title: 'أدلة Pariland في العراق',
    links: [
      ['/pariland', 'دليل Pariland العراق'],
      ['/pariland/tasjil', 'التسجيل'],
      ['/pariland/tahmil-apk', 'تحميل التطبيق'],
      ['/pariland/promo-code', 'الكود الترويجي'],
      ['/pariland/idaa', 'طرق الإيداع'],
      ['/pariland/sahb', 'طرق السحب'],
      ['/pariland/bonus', 'شروط المكافآت'],
    ],
  },
} as const;

export default function TopicNavigation({ cluster }: { cluster: keyof typeof clusters }) {
  const { title, links } = clusters[cluster];
  return (
    <nav aria-label={title} dir="rtl" className="mx-auto max-w-5xl px-4 py-8">
      <h2 className="mb-4 text-xl font-bold">{title}</h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="block rounded-lg border p-3 underline underline-offset-4">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
`;

function fail(message) { throw new Error(message); }
function hash(bytes) { return crypto.createHash('sha256').update(bytes).digest('hex'); }
function assert(condition, message) { if (!condition) fail(message); }
function loadTs(root, explicit) {
  const location = explicit || path.join(root, 'node_modules/typescript');
  return require(location);
}
function parse(ts, file, source, allowClient = false) {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  assert(sf.parseDiagnostics.length === 0, `${file}: TypeScript parse errors`);
  assert(allowClient || !sf.statements.some(s => ts.isExpressionStatement(s) && ts.isStringLiteral(s.expression) && s.expression.text === 'use client'), `${file}: expected server layout`);
  return sf;
}
function walk(ts, node, fn) { fn(node); ts.forEachChild(node, child => walk(ts, child, fn)); }
function name(ts, node) {
  assert(node && (ts.isIdentifier(node) || ts.isStringLiteral(node)), 'Computed or unsupported property name');
  return node.text;
}
function properties(ts, object) {
  assert(ts.isObjectLiteralExpression(object), 'Expected literal object');
  const result = new Map();
  for (const prop of object.properties) {
    assert(ts.isPropertyAssignment(prop), 'Spread, method or shorthand property is unsupported');
    const key = name(ts, prop.name);
    assert(!result.has(key), `Duplicate object property ${key}`);
    result.set(key, prop);
  }
  return result;
}
function constants(ts, sf) {
  const result = new Map();
  for (const stmt of sf.statements) if (ts.isVariableStatement(stmt)) {
    for (const decl of stmt.declarationList.declarations) if (ts.isIdentifier(decl.name) && decl.initializer &&
      (ts.isStringLiteral(decl.initializer) || ts.isNoSubstitutionTemplateLiteral(decl.initializer))) result.set(decl.name.text, decl.initializer.text);
  }
  return result;
}
function literal(ts, node, values) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isIdentifier(node) && values.has(node.text)) return values.get(node.text);
  if (ts.isTemplateExpression(node)) {
    let out = node.head.text;
    for (const span of node.templateSpans) out += literal(ts, span.expression, values) + span.literal.text;
    return out;
  }
  fail('Expected statically resolvable string');
}
function getMetadata(ts, sf) {
  const found = [];
  for (const stmt of sf.statements) if (ts.isVariableStatement(stmt) && stmt.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
    for (const decl of stmt.declarationList.declarations) if (ts.isIdentifier(decl.name) && decl.name.text === 'metadata') found.push(decl.initializer);
  }
  assert(found.length === 1 && found[0], `${sf.fileName}: require one exported literal metadata object`);
  properties(ts, found[0]);
  return found[0];
}
function editLanguages(ts, sf, source, canonical, suffix, edits) {
  const meta = getMetadata(ts, sf);
  const alternates = properties(ts, meta).get('alternates');
  assert(alternates, `${sf.fileName}: missing self-canonical alternates`);
  const props = properties(ts, alternates.initializer);
  assert(props.has('canonical') && literal(ts, props.get('canonical').initializer, constants(ts, sf)) === canonical, `${sf.fileName}: canonical differs from public snapshot`);
  const languages = { 'ar-IQ': `${BASE}/1xbet${suffix}`, 'ar-EG': `${BASE}/eg/1xbet${suffix}`, 'x-default': `${BASE}/1xbet${suffix}` };
  if (props.has('languages')) {
    const existing = properties(ts, props.get('languages').initializer);
    assert(existing.size === 3 && Object.entries(languages).every(([k, v]) => existing.has(k) && literal(ts, existing.get(k).initializer, constants(ts, sf)) === v), `${sf.fileName}: unexpected existing hreflang values`);
    return;
  }
  const last = alternates.initializer.properties.at(-1);
  assert(last, 'Empty alternates object');
  const tail = source.slice(last.end, alternates.initializer.end - 1);
  assert(/^\s*,?\s*$/.test(tail), 'Unsupported alternates trailing comments');
  const insertion = `${tail.includes(',') ? '' : ','} languages: ${JSON.stringify(languages)} `;
  edits.push({ start: alternates.initializer.end - 1, end: alternates.initializer.end - 1, text: insertion });
}
function isFaq(ts, node) {
  if (!ts.isObjectLiteralExpression(node)) return false;
  const prop = properties(ts, node).get('@type');
  return prop && ts.isStringLiteral(prop.initializer) && prop.initializer.text === 'FAQPage';
}
function faqSignature(ts, node, expected) {
  const props = properties(ts, node);
  const entities = props.get('mainEntity')?.initializer;
  assert(entities && ts.isArrayLiteralExpression(entities), 'FAQ mainEntity must be literal array');
  const names = entities.elements.map(entity => {
    const n = properties(ts, entity).get('name')?.initializer;
    assert(n && ts.isStringLiteral(n), 'FAQ question must be a literal string');
    return n.text;
  });
  assert(JSON.stringify(names) === JSON.stringify(expected), 'FAQ questions differ from reviewed public snapshot');
}
function findJsonScripts(ts, sf, variable) {
  const found = [];
  walk(ts, sf, node => {
    if (!ts.isJsxSelfClosingElement(node) && !ts.isJsxElement(node)) return;
    const opening = ts.isJsxElement(node) ? node.openingElement : node;
    if (!ts.isIdentifier(opening.tagName) || opening.tagName.text !== 'script') return;
    const attributes = opening.attributes.properties;
    const type = attributes.find(a => ts.isJsxAttribute(a) && a.name.text === 'type');
    const unsafe = attributes.find(a => ts.isJsxAttribute(a) && a.name.text === 'dangerouslySetInnerHTML');
    if (!type?.initializer || !ts.isStringLiteral(type.initializer) || type.initializer.text !== 'application/ld+json' || !unsafe?.initializer || !ts.isJsxExpression(unsafe.initializer)) return;
    const html = properties(ts, unsafe.initializer.expression).get('__html')?.initializer;
    if (html && ts.isCallExpression(html) && ts.isPropertyAccessExpression(html.expression) && html.expression.expression.getText(sf) === 'JSON' && html.expression.name.text === 'stringify' && html.arguments.length === 1 && ts.isIdentifier(html.arguments[0]) && html.arguments[0].text === variable) found.push(node);
  });
  return found;
}
function removeHiddenFaq(ts, sf, source, expected, edits) {
  const found = [];
  for (const stmt of sf.statements) if (ts.isVariableStatement(stmt)) {
    for (const decl of stmt.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name) || !decl.initializer) continue;
      if (isFaq(ts, decl.initializer)) found.push({ stmt, decl, faq: decl.initializer });
      if (ts.isArrayLiteralExpression(decl.initializer)) for (const element of decl.initializer.elements) if (isFaq(ts, element)) found.push({ stmt, decl, faq: element, array: decl.initializer });
    }
  }
  assert(found.length === 1, `${sf.fileName}: expected exactly one top-level FAQ object`);
  const { stmt, decl, faq, array } = found[0];
  faqSignature(ts, faq, expected);
  const scripts = findJsonScripts(ts, sf, decl.name.text);
  assert(scripts.length === 1, `${sf.fileName}: expected exactly one reviewed JSON-LD script`);
  let uses = 0;
  walk(ts, sf, node => { if (ts.isIdentifier(node) && node.text === decl.name.text) uses++; });
  assert(uses === 2, `${sf.fileName}: JSON-LD variable has additional references`);
  if (array) {
    assert(array.elements.length > 1, 'FAQ-only JSON-LD array requires manual review');
    const index = array.elements.indexOf(faq);
    if (index < array.elements.length - 1) {
      const next = array.elements[index + 1];
      assert(/^[\s,]*$/.test(source.slice(faq.end, next.getStart(sf))), 'Unexpected array separator or comment');
      edits.push({ start: faq.getStart(sf), end: next.getStart(sf), text: '' });
    } else {
      const previous = array.elements[index - 1];
      assert(/^[\s,]*$/.test(source.slice(previous.end, faq.getStart(sf))), 'Unexpected array separator or comment');
      edits.push({ start: previous.end, end: faq.end, text: '' });
    }
  } else {
    assert(stmt.declarationList.declarations.length === 1 && !stmt.modifiers?.length, 'FAQ declaration is shared or exported');
    edits.push({ start: stmt.getStart(sf), end: stmt.end, text: '' });
    edits.push({ start: scripts[0].getStart(sf), end: scripts[0].end, text: '' });
  }
}
function extractIraqClient(ts, sf, source) {
  const directive = sf.statements[0];
  assert(directive && ts.isExpressionStatement(directive) && ts.isStringLiteral(directive.expression) && directive.expression.text === 'use client', 'Iraq page must begin with use client');
  const defaults = sf.statements.filter(s => ts.isFunctionDeclaration(s) && s.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword));
  assert(defaults.length === 1, 'Iraq page must have one default function export');
  const declarations = [];
  let totalReviews = 0;
  walk(ts, sf, node => {
    if (!ts.isObjectLiteralExpression(node)) return;
    const type = node.properties.find(p => ts.isPropertyAssignment(p) &&
      (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) && p.name.text === '@type');
    if (type && ts.isStringLiteral(type.initializer) && type.initializer.text === 'Review') totalReviews++;
  });
  for (const stmt of sf.statements) if (ts.isVariableStatement(stmt)) {
    for (const decl of stmt.declarationList.declarations) if (ts.isIdentifier(decl.name) && decl.initializer && ts.isObjectLiteralExpression(decl.initializer)) {
      const type = properties(ts, decl.initializer).get('@type')?.initializer;
      if (type && ts.isStringLiteral(type) && type.text === 'Review') declarations.push({ stmt, decl });
    }
  }
  assert(totalReviews === 1 && declarations.length === 1, 'Require exactly one standalone Review object in Iraq page');
  const { stmt, decl } = declarations[0];
  assert(stmt.declarationList.declarations.length === 1 && !stmt.modifiers?.length, 'Review declaration is shared or exported');
  const review = properties(ts, decl.initializer);
  const context = review.get('@context')?.initializer;
  assert(context && literal(ts, context, constants(ts, sf)) === 'https://schema.org', 'Unexpected Review context');
  function signature(key, expected) {
    const init = review.get(key)?.initializer;
    assert(init, `Missing Review ${key}`);
    const props = properties(ts, init);
    for (const [name, value] of Object.entries(expected)) assert(props.has(name) && literal(ts, props.get(name).initializer, constants(ts, sf)) === value, `Unexpected Review ${key}.${name}`);
  }
  signature('itemReviewed', { '@type': 'Organization', name: '1xBet', url: 'https://1xbet.com' });
  signature('author', { '@type': 'Organization', name: 'ArabTips', url: BASE });
  signature('reviewRating', { '@type': 'Rating', ratingValue: '4.6', bestRating: '5', worstRating: '1' });
  const scripts = findJsonScripts(ts, sf, decl.name.text);
  assert(scripts.length === 1, 'Require one Review JSON-LD script');
  let uses = 0;
  walk(ts, sf, node => { if (ts.isIdentifier(node) && node.text === decl.name.text) uses++; });
  assert(uses === 2, 'Review variable has additional references');
  const edits = [{ start: stmt.getStart(sf), end: stmt.end, text: '' },
    { start: scripts[0].getStart(sf), end: scripts[0].end, text: '' }];
  const after = applyEdits(source, edits);
  parse(ts, IRAQ_CLIENT, after, true);
  return after;
}
function addNavigation(ts, sf, source, cluster, edits) {
  let conflict = false;
  walk(ts, sf, node => { if (ts.isIdentifier(node) && node.text === 'TopicNavigation') conflict = true; });
  assert(!conflict, `${sf.fileName}: TopicNavigation identifier already exists`);
  const defaults = sf.statements.filter(s => ts.isFunctionDeclaration(s) && s.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword));
  assert(defaults.length === 1 && defaults[0].body, `${sf.fileName}: require one default layout function`);
  const returns = [];
  walk(ts, defaults[0].body, node => { if (ts.isReturnStatement(node)) returns.push(node); });
  assert(returns.length === 1 && returns[0].expression, 'Layout return must be unambiguous');
  const expression = returns[0].expression;
  const children = [];
  walk(ts, expression, node => {
    if (ts.isJsxExpression(node) && node.expression && ts.isIdentifier(node.expression) && node.expression.text === 'children') children.push(node);
  });
  const navigation = `<TopicNavigation cluster="${cluster}" />`;
  if (ts.isIdentifier(expression) && expression.text === 'children') {
    edits.push({ start: expression.getStart(sf), end: expression.end, text: `(<>{children}${navigation}</>)` });
  } else {
    assert(children.length === 1, `${sf.fileName}: require one directly rendered children expression`);
    edits.push({ start: children[0].end, end: children[0].end, text: `\n      ${navigation}` });
  }
  const imports = sf.statements.filter(ts.isImportDeclaration);
  const position = imports.length ? imports.at(-1).end : 0;
  edits.push({ start: position, end: position, text: '\nimport TopicNavigation from "@/components/seo/TopicNavigation";\n' });
}
function applyEdits(source, edits) {
  const ordered = [...edits].sort((a, b) => b.start - a.start || b.end - a.end);
  let bound = source.length;
  for (const e of ordered) {
    assert(e.start >= 0 && e.end >= e.start && e.end <= bound, 'Overlapping or invalid edits');
    source = source.slice(0, e.start) + e.text + source.slice(e.end);
    bound = e.start;
  }
  return source;
}
function safeFile(root, relative, allowMissing = false) {
  assert(!path.isAbsolute(relative) && !relative.split('/').includes('..'), 'Unsafe relative path');
  const target = path.join(root, relative);
  const parts = relative.split('/');
  let cursor = root;
  for (let i = 0; i < parts.length; i++) {
    cursor = path.join(cursor, parts[i]);
    let stat;
    try { stat = fs.lstatSync(cursor); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      assert(allowMissing, `${relative}: required path missing`);
      continue;
    }
    assert(!stat.isSymbolicLink(), `${relative}: symlink is unsupported`);
    assert(i === parts.length - 1 ? stat.isFile() : stat.isDirectory(), `${relative}: unexpected file type`);
  }
  return target;
}
function plan(root, ts) {
  const targets = new Map();
  for (const prefix of ['1xbet', 'eg/1xbet']) for (const topic of TOPICS) targets.set(`src/app/${prefix}/${topic}/layout.tsx`, { canonical: `${BASE}/${prefix}/${topic}`, suffix: `/${topic}` });
  targets.set('src/app/eg/1xbet/layout.tsx', { canonical: `${BASE}/eg/1xbet`, suffix: '', nav: 'egypt' });
  targets.set('src/app/pariland/layout.tsx', { nav: 'pariland' });
  for (const file of Object.keys(HIDDEN)) targets.set(file, { ...targets.get(file), faq: HIDDEN[file] });
  const output = [];
  for (const [file, actions] of targets) {
    const target = safeFile(root, file);
    const before = fs.readFileSync(target);
    const source = before.toString('utf8');
    assert(Buffer.from(source).equals(before), `${file}: invalid UTF-8`);
    const sf = parse(ts, file, source);
    const edits = [];
    if (actions.canonical) editLanguages(ts, sf, source, actions.canonical, actions.suffix, edits);
    if (actions.faq) removeHiddenFaq(ts, sf, source, actions.faq, edits);
    if (actions.nav) addNavigation(ts, sf, source, actions.nav, edits);
    const after = Buffer.from(applyEdits(source, edits));
    parse(ts, file, after.toString('utf8'));
    output.push({ file, target, before, after, mode: fs.statSync(target).mode & 0o777, actions });
  }
  const component = safeFile(root, COMPONENT, true);
  assert(!fs.existsSync(component), `${COMPONENT}: existing component must not be overwritten`);
  parse(ts, COMPONENT, COMPONENT_SOURCE);
  output.push({ file: COMPONENT, target: component, before: null, after: Buffer.from(COMPONENT_SOURCE), mode: 0o644, actions: { newNavigationComponent: true } });
  const page = safeFile(root, IRAQ_PAGE);
  const beforePage = fs.readFileSync(page);
  const pageSource = beforePage.toString('utf8');
  assert(Buffer.from(pageSource).equals(beforePage), 'Iraq page invalid UTF-8');
  const sf = parse(ts, IRAQ_PAGE, pageSource, true);
  const client = safeFile(root, IRAQ_CLIENT, true);
  assert(!fs.existsSync(client), 'Existing Iraq page-client must not be overwritten');
  const clientSource = extractIraqClient(ts, sf, pageSource);
  parse(ts, IRAQ_PAGE, IRAQ_WRAPPER);
  const pageMode = fs.statSync(page).mode & 0o777;
  output.push({ file: IRAQ_CLIENT, target: client, before: null, after: Buffer.from(clientSource), mode: pageMode, actions: { preserveLivePage: true, removeOnlyReviewSchema: true } });
  output.push({ file: IRAQ_PAGE, target: page, before: beforePage, after: Buffer.from(IRAQ_WRAPPER), mode: pageMode, actions: { reviewedServerWrapper: true, selfCanonical: true, reciprocalHreflang: true } });
  return output;
}
function manifest(items, ts, applied) {
  return { helper: 'arabtips-live-topic-seo-20261006', applied, typescript: ts.version,
    constraints: ['Only the explicit marketing allowlist is changed', 'Existing self-canonicals and unrelated metadata are preserved', 'Only the three reviewed hidden FAQ objects and one hidden Review object are removed', 'No fabricated dates, claims or reviews; no authentication, allocations or database writes'],
    files: items.map(i => ({ path: i.file, before_sha256: i.before === null ? null : hash(i.before), after_sha256: hash(i.after), changed: i.before === null || !i.before.equals(i.after), actions: i.actions })) };
}
function apply(root, items, backupDirectory, report) {
  assert(backupDirectory, '--apply requires --backup-dir outside the source directory');
  const backup = path.resolve(backupDirectory);
  assert(backup !== root && !backup.startsWith(root + path.sep), 'Backups must be outside source directory');
  const backupParent = fs.realpathSync(path.dirname(backup));
  assert(backupParent !== root && !backupParent.startsWith(root + path.sep), 'Backup parent must resolve outside source directory');
  assert(!fs.existsSync(backup), 'Backup directory already exists; choose a fresh private path');
  // Revalidate every file and absence before creating backups or modifying anything.
  for (const i of items) {
    const target = safeFile(root, i.file, i.before === null);
    assert(i.before === null ? !fs.existsSync(target) : fs.readFileSync(target).equals(i.before), `${i.file}: source changed after validation`);
  }
  fs.mkdirSync(backup, { recursive: false, mode: 0o700 });
  const changed = items.filter(i => i.before === null || !i.before.equals(i.after));
  for (const i of changed) if (i.before !== null) {
    const dest = path.join(backup, i.file);
    fs.mkdirSync(path.dirname(dest), { recursive: true, mode: 0o700 });
    fs.writeFileSync(dest, i.before, { flag: 'wx', mode: 0o600 });
  }
  const backupManifest = path.join(backup, 'manifest.json');
  fs.writeFileSync(backupManifest, JSON.stringify({ ...report, applied: false, status: 'prepared' }, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  const written = [];
  try {
    for (const i of changed) {
      safeFile(root, i.file, i.before === null);
      assert(i.before === null ? !fs.existsSync(i.target) : fs.readFileSync(i.target).equals(i.before), `${i.file}: source changed before write`);
      fs.mkdirSync(path.dirname(i.target), { recursive: true });
      safeFile(root, i.file, i.before === null);
      const temporary = i.target + `.arabtips-seo-${crypto.randomBytes(8).toString('hex')}.tmp`;
      try {
        fs.writeFileSync(temporary, i.after, { flag: 'wx', mode: i.mode });
        if (i.before === null) fs.linkSync(temporary, i.target);
        else fs.renameSync(temporary, i.target);
      } finally {
        if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
      }
      written.push(i);
    }
    for (const i of changed) assert(fs.readFileSync(i.target).equals(i.after), `${i.file}: write verification failed`);
    fs.writeFileSync(backupManifest, JSON.stringify({ ...report, applied: true, status: 'applied' }, null, 2) + '\n', { mode: 0o600 });
  } catch (error) {
    for (const i of written.reverse()) if (i.before === null) fs.unlinkSync(i.target); else fs.writeFileSync(i.target, i.before, { mode: i.mode });
    fs.writeFileSync(backupManifest, JSON.stringify({ ...report, applied: false, status: 'rolled_back_after_write_failure' }, null, 2) + '\n', { mode: 0o600 });
    throw error;
  }
}
function main(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--apply') options.apply = true;
    else if (['--root', '--backup-dir', '--typescript'].includes(arg)) { assert(argv[i + 1], `${arg} needs a value`); options[arg.slice(2)] = argv[++i]; }
    else fail(`Unknown option ${arg}`);
  }
  assert(options.root, 'Usage: node live-topic-seo.cjs --root SOURCE [--typescript MODULE_PATH] [--apply --backup-dir FRESH_PRIVATE_DIRECTORY]');
  const root = fs.realpathSync(path.resolve(options.root));
  const ts = loadTs(root, options.typescript && path.resolve(options.typescript));
  const items = plan(root, ts);
  const report = manifest(items, ts, !!options.apply);
  if (options.apply) apply(root, items, options['backup-dir'], report);
  return report;
}
module.exports = { main, plan, manifest, apply, COMPONENT_SOURCE, IRAQ_WRAPPER, HIDDEN, TOPICS, COMPONENT, IRAQ_PAGE, IRAQ_CLIENT };
if (require.main === module) {
  try { process.stdout.write(JSON.stringify(main(process.argv.slice(2)), null, 2) + '\n'); }
  catch (error) { process.stderr.write('FAIL CLOSED: ' + error.message + '\n'); process.exitCode = 1; }
}
