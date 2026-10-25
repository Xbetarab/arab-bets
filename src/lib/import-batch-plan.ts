import { createHash, randomUUID } from "node:crypto";
import type { GhostBatchIdentity, ImportBatchItem, ImportBatchItemPatch, ImportMode } from "./import-batch-types";

const MAX_ITEMS = 1000;
// Leave space for the Server Action envelope inside Next's 1 MB request limit.
const MAX_BYTES = 900_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SPORTS: Record<string, string> = {
  "كرة قدم": "football", football: "football", "سلة": "basketball", "كرة سلة": "basketball",
  basketball: "basketball", "تنس": "tennis", tennis: "tennis", "ملاكمة": "boxing", boxing: "boxing",
  "فنون قتالية": "mma", mma: "mma", MMA: "mma", "رياضات إلكترونية": "esports", esports: "esports",
  "كريكت": "other", "أخرى": "other", other: "other",
};

type SourceItem = Omit<ImportBatchItem, "id" | "username" | "displayName" | "state" | "error" | "publishedId" | "warnings"> & {
  requestedUsername: string | null;
};
export type ParsedImport = { mode: ImportMode; items: SourceItem[]; inputHash: string; targetPostIds: string[] };

function record(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${path}: يجب أن يكون كائناً.`);
  return value as Record<string, unknown>;
}

export function assertBatchUuid(value: unknown): asserts value is string {
  if (typeof value !== "string" || !UUID.test(value)) throw new Error("معرّف غير صالح. استخدم UUID، وليس رابط المنشور.");
}

export function normalizeImportTimestamp(value: unknown, now = Date.now()): string {
  if (typeof value !== "string" || !value.trim()) throw new Error("حقل created_at مطلوب.");
  const iso = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/i.exec(value);
  if (!iso) throw new Error("اكتب التاريخ بصيغة ISO مع المنطقة الزمنية، مثل 2026-10-01T15:00:00+03:00 للعراق أو Z لتوقيت UTC.");
  if (Number(iso[4]) > 23 || Number(iso[5]) > 59 || Number(iso[6] ?? 0) > 59) throw new Error(`تاريخ غير صالح: ${value}`);
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error(`تاريخ غير صالح: ${value}`);
  // Date.parse normalizes e.g. February 31; reject that accidental calendar rollover.
  const day = /^(\d{4})-(\d{2})-(\d{2})(?:T|\s|$)/.exec(value);
  if (day) {
    const year = Number(day[1]), month = Number(day[2]), dayNumber = Number(day[3]);
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    if (month < 1 || month > 12 || dayNumber < 1 || dayNumber > lastDay) throw new Error(`تاريخ غير صالح: ${value}`);
  }
  if (date.getTime() > now + 60_000) throw new Error(`التاريخ ${value} في المستقبل؛ يجب أن يكون في الماضي أو الحاضر.`);
  return date.toISOString();
}

function likes(value: unknown): number {
  if (value === undefined) return 0;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 2_147_483_647) {
    throw new Error("likes_count يجب أن يكون عدداً صحيحاً غير سالب.");
  }
  return value;
}

function text(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) throw new Error("حقل content مطلوب ويجب أن يكون نصاً غير فارغ.");
  return value;
}

function normalizeSport(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new Error("حقل sport يجب أن يكون نصاً.");
  return SPORTS[value] ?? null;
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
  return JSON.stringify(value);
}

export function parseImportSource(json: string, mode: ImportMode, now = Date.now()): ParsedImport {
  if (mode !== "posts" && mode !== "comments") throw new Error("نوع الاستيراد غير صالح.");
  if (typeof json !== "string" || Buffer.byteLength(json, "utf8") > MAX_BYTES) throw new Error("الملف كبير جداً. قسّمه إلى دفعات أصغر من 900 كيلوبايت.");
  let data: Record<string, unknown>;
  try { data = record(JSON.parse(json), "الملف"); } catch { throw new Error("ملف JSON غير صالح. تأكد من صحة التنسيق."); }
  const roots = data[mode];
  if (!Array.isArray(roots) || roots.length === 0) throw new Error(`الملف يجب أن يحتوي على مصفوفة ${mode} غير فارغة.`);
  const items: SourceItem[] = [];
  const targets = new Set<string>();

  function add(raw: unknown, kind: "post" | "comment", key: string, postKey: string | null, parentKey: string | null, targetPostId: string | null, depth: number) {
    if (depth > 20) throw new Error("تسلسل الردود عميق جداً؛ الحد 20 مستوى.");
    if (items.length >= MAX_ITEMS) throw new Error("الدفعة تتجاوز 1000 منشور وتعليق. قسّم الملف إلى دفعات أصغر.");
    const row = record(raw, key);
    try {
      if (row.author_username !== undefined && typeof row.author_username !== "string") throw new Error("author_username يجب أن يكون نصاً.");
      items.push({ key, kind, postKey, parentKey, targetPostId, content: text(row.content),
        requestedUsername: typeof row.author_username === "string" && row.author_username.trim() ? row.author_username : null,
        sport: kind === "post" ? normalizeSport(row.sport) : null,
        createdAt: normalizeImportTimestamp(row.created_at, now), likesCount: likes(row.likes_count) });
      const childName = kind === "post" ? "comments" : "replies";
      if (row[childName] !== undefined && !Array.isArray(row[childName])) throw new Error(`${childName} يجب أن تكون مصفوفة.`);
      const children = (row[childName] ?? []) as unknown[];
      children.forEach((child, index) => add(child, "comment", `${key}.${childName}.${index}`, kind === "post" ? key : postKey,
        kind === "comment" ? key : null, targetPostId, depth + 1));
    } catch (error) { throw new Error(`${key}: ${error instanceof Error ? error.message : String(error)}`); }
  }

  roots.forEach((root, index) => {
    const key = `${mode}.${index}`;
    if (mode === "posts") add(root, "post", key, null, null, null, 0);
    else {
      const group = record(root, key);
      assertBatchUuid(group.post_id);
      const postId = group.post_id.toLowerCase();
      if (!Array.isArray(group.entries) || group.entries.length === 0) throw new Error(`${key}: entries يجب أن تكون مصفوفة غير فارغة.`);
      targets.add(postId);
      group.entries.forEach((entry, entryIndex) => add(entry, "comment", `${key}.entries.${entryIndex}`, null, null, postId, 0));
    }
  });
  return { mode, items, targetPostIds: [...targets], inputHash: createHash("sha256").update(canonical({ version: 1, mode, items })).digest("hex") };
}

export function weightedBatchIdentity(pool: GhostBatchIdentity[], context: "post" | "comment", usage: Map<string, number>, random = Math.random): GhostBatchIdentity {
  if (!pool.length) throw new Error("لا توجد حسابات شبحية في المخزون. ارفع ملف الهويات أولاً.");
  const weights = pool.map((identity) => {
    const role = context === "post" ? "poster" : "commenter";
    const boost = identity.rolePreference === role ? 1.5 : identity.rolePreference === "balanced" ? 1 : 0.5;
    return Math.max(identity.activityWeight * boost * Math.pow(0.5, usage.get(identity.username) ?? 0), 0.01);
  });
  let cursor = random() * weights.reduce((sum, weight) => sum + weight, 0);
  return pool.find((_, index) => { cursor -= weights[index]; return cursor <= 0; }) ?? pool[pool.length - 1];
}

export function planWarnings(items: ImportBatchItem[], targetDates: Record<string, string> = {}): string[] {
  const seen = new Map<string, string>();
  const byKey = new Map(items.map(item => [item.key, item]));
  const warnings: string[] = [];
  for (const item of items) {
    item.warnings = item.warnings.filter(warning => !warning.startsWith("نص مكرر داخل الدفعة") &&
      !["تاريخ التعليق يسبق المنشور أو التعليق الذي يرد عليه.", "التعليق يسبق المنشور زمنياً", "الرد يسبق التعليق الأب زمنياً"].includes(warning));
    const normalized = item.content.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase();
    const prior = seen.get(normalized);
    if (prior) item.warnings.push(`نص مكرر داخل الدفعة، ظهر أولاً في ${prior}.`);
    else seen.set(normalized, item.key);
    const parentDate = item.parentKey ? byKey.get(item.parentKey)?.createdAt : undefined;
    const postDate = item.postKey ? byKey.get(item.postKey)?.createdAt : item.targetPostId ? targetDates[item.targetPostId] : undefined;
    if ([parentDate, postDate].some(before => before && new Date(item.createdAt).getTime() < new Date(before).getTime())) {
      item.warnings.push("تاريخ التعليق يسبق المنشور أو التعليق الذي يرد عليه.");
    }
    warnings.push(...item.warnings.map(warning => `${item.key}: ${warning}`));
  }
  return warnings;
}

export function buildImportPlan(parsed: ParsedImport, pool: GhostBatchIdentity[], targetDates: Record<string, string> = {}, random = Math.random, makeId: () => string = randomUUID) {
  if (!pool.length) throw new Error("لا توجد حسابات شبحية في المخزون. ارفع ملف الهويات أولاً.");
  for (const target of parsed.targetPostIds) if (!targetDates[target]) throw new Error(`المنشور ${target} غير موجود.`);
  const usage = new Map<string, number>();
  const plan: ImportBatchItem[] = parsed.items.map(({ requestedUsername, ...item }) => {
    const explicit = pool.find(identity => identity.username === requestedUsername);
    const identity = explicit ?? weightedBatchIdentity(pool, item.kind, usage, random);
    usage.set(identity.username, (usage.get(identity.username) ?? 0) + 1);
    return { ...item, id: makeId(), username: identity.username, displayName: identity.displayName,
      state: "pending", error: null, publishedId: null,
      warnings: requestedUsername && !explicit ? ["الهوية المطلوبة ليست في المخزون الحالي؛ عُيّنت هوية من المخزون."] : [] };
  });
  return { plan, warnings: planWarnings(plan, targetDates) };
}

export function validateImportItemPatch(input: ImportBatchItemPatch, pool: GhostBatchIdentity[], now = Date.now()): ImportBatchItemPatch {
  const patch = record(input, "التعديل");
  const allowed = new Set(["content", "username", "createdAt", "likesCount", "sport"]);
  if (!Object.keys(patch).length || Object.keys(patch).some(key => !allowed.has(key))) throw new Error("حقول التعديل غير صالحة.");
  const result: ImportBatchItemPatch = {};
  if (Object.hasOwn(patch, "content")) result.content = text(patch.content);
  if (Object.hasOwn(patch, "createdAt")) result.createdAt = normalizeImportTimestamp(patch.createdAt, now);
  if (Object.hasOwn(patch, "likesCount")) result.likesCount = likes(patch.likesCount);
  if (Object.hasOwn(patch, "sport")) result.sport = normalizeSport(patch.sport);
  if (Object.hasOwn(patch, "username")) {
    if (typeof patch.username !== "string" || !pool.some(identity => identity.username === patch.username)) throw new Error("اختر هوية من المخزون الحالي فقط.");
    result.username = patch.username;
  }
  return result;
}
