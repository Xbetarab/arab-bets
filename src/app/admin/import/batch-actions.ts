"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { assertBatchUuid, buildImportPlan, parseImportSource, planWarnings, validateImportItemPatch } from "@/lib/import-batch-plan";
import type { BatchActionResult, GhostBatchIdentity, ImportBatch, ImportBatchItem, ImportBatchItemPatch, ImportBatchStats, ImportBatchSummary, ImportMode } from "@/lib/import-batch-types";

type AdminClient = ReturnType<typeof createAdminClient>;
const BATCH_COLUMNS = "id,input_hash,label,mode,status,plan,warnings,created_at,updated_at";

async function assertAdmin() {
  const session = await createClient();
  const { data: { user }, error } = await session.auth.getUser();
  if (error || !user || user.email !== "uomankotd@gmail.com") throw new Error("Unauthorized");
  return { supabase: createAdminClient(), userId: user.id };
}

function failure(error: unknown): BatchActionResult {
  return { success: false, errors: [error instanceof Error ? error.message : "تعذر تنفيذ العملية. حاول مرة أخرى."] };
}

function toBatch(value: unknown): ImportBatch {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("تعذر قراءة سجل الدفعة.");
  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string" || !Array.isArray(row.plan)) throw new Error("تعذر قراءة سجل الدفعة.");
  const plan = (row.plan as ImportBatchItem[]).map(item => ({ ...item, warnings: item.warnings ?? [] }));
  return {
    id: row.id, inputHash: String(row.input_hash), label: String(row.label), mode: row.mode as ImportMode,
    status: row.status as ImportBatch["status"], plan, warnings: Array.isArray(row.warnings) ? row.warnings as string[] : [],
    createdAt: String(row.created_at), updatedAt: String(row.updated_at),
  };
}

async function loadPool(supabase: AdminClient): Promise<GhostBatchIdentity[]> {
  const pool: GhostBatchIdentity[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.from("ghost_identities")
      .select("username,display_name,activity_weight,role_preference").order("username").range(offset, offset + 999);
    if (error) throw new Error("تعذر جلب مخزون الهويات: " + error.message);
    for (const row of data ?? []) pool.push({ username: row.username, displayName: row.display_name,
      activityWeight: typeof row.activity_weight === "number" ? row.activity_weight : 0.5,
      rolePreference: row.role_preference === "poster" || row.role_preference === "commenter" ? row.role_preference : "balanced" });
    if (!data || data.length < 1000) break;
  }
  return pool;
}

async function targetDates(supabase: AdminClient, ids: string[]) {
  const dates: Record<string, string> = {};
  for (let offset = 0; offset < ids.length; offset += 100) {
    const { data, error } = await supabase.from("posts").select("id,created_at").in("id", ids.slice(offset, offset + 100));
    if (error) throw new Error("تعذر التحقق من المنشورات المستهدفة: " + error.message);
    for (const row of data ?? []) dates[row.id] = row.created_at;
  }
  return dates;
}

async function decorate(supabase: AdminClient, batch: ImportBatch): Promise<ImportBatch> {
  const ids = [...new Set(batch.plan.flatMap(item => item.targetPostId ? [item.targetPostId] : []))];
  batch.warnings = planWarnings(batch.plan, await targetDates(supabase, ids));
  return batch;
}

async function readBatch(supabase: AdminClient, id: string): Promise<ImportBatch> {
  assertBatchUuid(id);
  const { data, error } = await supabase.from("admin_import_batches").select(BATCH_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error("تعذر قراءة الدفعة: " + error.message);
  if (!data) throw new Error("الدفعة غير موجودة.");
  return toBatch(data);
}

/** Preview only writes a private batch plan; it never creates profiles or public content. */
export async function previewImportBatch(jsonString: string, mode: ImportMode, label = "دفعة استيراد"): Promise<BatchActionResult> {
  const { supabase, userId } = await assertAdmin();
  try {
    if (typeof label !== "string" || !label.trim() || label.length > 200) throw new Error("اسم الدفعة مطلوب وبحد أقصى 200 حرف.");
    const parsed = parseImportSource(jsonString, mode);
    // Looking up the immutable source hash first also keeps completed history reusable
    // after an imported target or an identity has subsequently been removed.
    const { data: existing, error: lookupError } = await supabase.from("admin_import_batches")
      .select(BATCH_COLUMNS).eq("input_hash", parsed.inputHash).maybeSingle();
    if (lookupError) throw new Error("تعذر التحقق من الدفعات السابقة: " + lookupError.message);
    const pool = await loadPool(supabase);
    const identities = pool.map(({ username, displayName }) => ({ username, displayName }));
    if (existing) return { success: true, errors: [], batch: await decorate(supabase, toBatch(existing)), reused: true, identities };
    const dates = await targetDates(supabase, parsed.targetPostIds);
    const { plan, warnings } = buildImportPlan(parsed, pool, dates);
    const { data, error } = await supabase.rpc("admin_import_create", {
      p_input_hash: parsed.inputHash, p_label: label.trim(), p_mode: mode,
      p_plan: plan, p_warnings: warnings, p_created_by: userId,
    });
    if (error) throw new Error("تعذر حفظ المعاينة: " + error.message);
    revalidatePath("/admin/import");
    return { success: true, errors: [], batch: await decorate(supabase, toBatch(data)), reused: false, identities };
  } catch (error) { return failure(error); }
}

export async function listImportBatches(): Promise<BatchActionResult> {
  const { supabase } = await assertAdmin();
  try {
    const { data, error } = await supabase.rpc("admin_import_history", { p_limit: 30 });
    if (error) throw new Error("تعذر تحميل سجل الدفعات: " + error.message);
    if (!Array.isArray(data)) throw new Error("تعذر قراءة سجل الدفعات.");
    return { success: true, errors: [], batches: data as ImportBatchSummary[] };
  } catch (error) { return failure(error); }
}

export async function getImportBatch(id: string): Promise<BatchActionResult> {
  const { supabase } = await assertAdmin();
  try {
    const batch = await readBatch(supabase, id);
    const pool = await loadPool(supabase);
    return { success: true, errors: [], batch: await decorate(supabase, batch), identities: pool.map(({ username, displayName }) => ({ username, displayName })) };
  } catch (error) { return failure(error); }
}

export async function updateImportBatchItem(id: string, key: string, patch: ImportBatchItemPatch): Promise<BatchActionResult> {
  const { supabase } = await assertAdmin();
  try {
    assertBatchUuid(id);
    if (typeof key !== "string" || !key || key.length > 1000) throw new Error("معرّف العنصر غير صالح.");
    const pool = await loadPool(supabase);
    const changes = validateImportItemPatch(patch, pool);
    // The database rechecks state while holding the same lock used by publishing.
    const { data, error } = await supabase.rpc("admin_import_edit", { p_batch_id: id, p_key: key, p_changes: changes });
    if (error) throw new Error("تعذر حفظ تعديل العنصر: " + error.message);
    revalidatePath("/admin/import");
    return { success: true, errors: [], batch: await decorate(supabase, toBatch(data)) };
  } catch (error) { return failure(error); }
}

export async function pauseImportBatch(id: string): Promise<BatchActionResult> {
  const { supabase } = await assertAdmin();
  try {
    assertBatchUuid(id);
    const { data, error } = await supabase.rpc("admin_import_control", { p_batch_id: id, p_action: "pause" });
    if (error) throw new Error("تعذر إيقاف الدفعة: " + error.message);
    revalidatePath("/admin/import");
    return { success: true, errors: [], batch: await decorate(supabase, toBatch(data)) };
  } catch (error) { return failure(error); }
}

export async function resumeImportBatch(id: string): Promise<BatchActionResult> {
  const { supabase } = await assertAdmin();
  try {
    assertBatchUuid(id);
    const { data, error } = await supabase.rpc("admin_import_control", { p_batch_id: id, p_action: "resume" });
    if (error) throw new Error("تعذر بدء أو استكمال الدفعة: " + error.message);
    revalidatePath("/admin/import");
    return { success: true, errors: [], batch: await decorate(supabase, toBatch(data)) };
  } catch (error) { return failure(error); }
}

export async function processImportBatchStep(id: string): Promise<BatchActionResult> {
  const { supabase } = await assertAdmin();
  try {
    assertBatchUuid(id);
    const { data, error } = await supabase.rpc("admin_import_step", { p_batch_id: id, p_limit: 10 });
    if (error) throw new Error("تعذر استكمال النشر: " + error.message);
    const batch = await decorate(supabase, toBatch(data));
    const errors = batch.plan.filter(item => item.state === "failed").map(item => `${item.key}: ${item.error ?? "تعذر النشر"}`);
    revalidatePath("/");
    revalidatePath("/admin/import");
    return { success: errors.length === 0, errors, batch };
  } catch (error) { return failure(error); }
}

export async function getImportBatchStats(id: string): Promise<BatchActionResult> {
  const { supabase } = await assertAdmin();
  try {
    assertBatchUuid(id);
    const { data, error } = await supabase.rpc("admin_import_stats", { p_batch_id: id });
    if (error) throw new Error("تعذر قراءة إحصاءات الدفعة: " + error.message);
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("تعذر قراءة إحصاءات الدفعة.");
    return { success: true, errors: [], stats: data as ImportBatchStats };
  } catch (error) { return failure(error); }
}
