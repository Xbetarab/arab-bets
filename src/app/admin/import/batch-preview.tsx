"use client";

import { useState } from "react";
import type { ImportBatch, ImportBatchItem } from "@/lib/import-batch-types";

export type BatchIdentity = { username: string; displayName: string };
export type BatchItemPatch = {
  content: string;
  username: string;
  createdAt: string;
  likesCount: number;
};

const fieldClass = "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500";
const buttonClass = "min-h-[44px] rounded-lg px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";

export function iraqDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "تاريخ غير صالح";
  return new Intl.DateTimeFormat("ar-IQ", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Baghdad",
  }).format(date);
}

function iraqInput(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  // The editor is explicitly in Baghdad time, independent of the browser zone.
  return new Date(date.getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0, 19);
}

const stateLabel: Record<ImportBatchItem["state"], string> = {
  pending: "بانتظار النشر", published: "منشور", duplicate: "مكرر · تم تخطيه", failed: "تعذر نشره",
};

function ItemCard({ item, depth, editable, identities, busy, onSave, onEditChange }: {
  item: ImportBatchItem;
  depth: number;
  editable: boolean;
  identities: BatchIdentity[];
  busy: boolean;
  onSave: (key: string, patch: BatchItemPatch) => Promise<boolean>;
  onEditChange: (key: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(item.content);
  const [username, setUsername] = useState(item.username);
  const [createdAt, setCreatedAt] = useState(iraqInput(item.createdAt));
  const [likes, setLikes] = useState(String(item.likesCount));
  const [error, setError] = useState("");
  const isPublished = item.state === "published" || item.state === "duplicate";
  const title = item.kind === "post" ? "منشور" : item.parentKey ? "رد" : "تعليق";

  function beginEdit() {
    setContent(item.content);
    setUsername(item.username);
    setCreatedAt(iraqInput(item.createdAt));
    setLikes(String(item.likesCount));
    setError("");
    setEditing(true);
    onEditChange(item.key);
  }

  function cancelEdit() {
    setEditing(false);
    setError("");
    onEditChange(null);
  }

  async function save() {
    const date = new Date(`${createdAt}+03:00`);
    if (!content.trim()) { setError("أدخل نص المحتوى قبل الحفظ."); return; }
    if (!createdAt || !Number.isFinite(date.getTime())) { setError("أدخل تاريخًا ووقتًا صالحين بتوقيت العراق."); return; }
    if (!/^\d+$/.test(likes) || !Number.isSafeInteger(Number(likes)) || Number(likes) > 2147483647) {
      setError("الإعجابات اليدوية يجب أن تكون عددًا صحيحًا من صفر إلى 2147483647."); return;
    }
    setError("");
    const saved = await onSave(item.key, {
      content,
      username,
      // Keep the original precision when only another field was edited.
      createdAt: createdAt === iraqInput(item.createdAt) ? item.createdAt : date.toISOString(),
      likesCount: Number(likes),
    });
    if (saved) cancelEdit();
  }

  return (
    <article
      aria-label={`${title}: ${item.displayName}`}
      className={`rounded-xl border p-3 sm:p-4 ${depth ? "border-zinc-700/80 bg-zinc-900/60" : "border-zinc-700 bg-zinc-900"}`}
      style={{ marginInlineStart: `${Math.min(depth, 3) * 12}px` }}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-semibold text-emerald-300">
            {Array.from(item.displayName)[0] || "؟"}
          </span>
          <div className="min-w-0">
            <div className="break-words text-sm font-semibold text-zinc-100">{item.displayName}</div>
            <div className="break-all text-xs text-zinc-500"><bdi>@{item.username}</bdi> · {title}</div>
          </div>
        </div>
        <span className={`rounded-full px-2 py-1 text-[11px] ${item.state === "failed" ? "bg-red-500/10 text-red-300" : isPublished ? "bg-emerald-500/10 text-emerald-300" : "bg-zinc-800 text-zinc-400"}`}>
          {stateLabel[item.state]}
        </span>
      </div>

      {editing ? (
        <form className="mt-4 space-y-3" onSubmit={(event) => { event.preventDefault(); void save(); }}>
          <label className="block space-y-1.5 text-xs text-zinc-400">
            <span>النص</span>
            <textarea className={`${fieldClass} min-h-28 resize-y`} value={content} onChange={(event) => setContent(event.target.value)} disabled={busy} required />
          </label>
          <label className="block space-y-1.5 text-xs text-zinc-400">
            <span>الهوية من المخزون الحالي</span>
            <select className={fieldClass} value={username} onChange={(event) => setUsername(event.target.value)} disabled={busy}>
              {!identities.some((identity) => identity.username === username) && <option value={username}>{item.displayName} — @{username} (تحقق من المخزون)</option>}
              {identities.map((identity) => <option key={identity.username} value={identity.username}>{identity.displayName} — @{identity.username}</option>)}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5 text-xs text-zinc-400">
              <span>التاريخ والوقت · العراق (UTC+3)</span>
              <input className={fieldClass} dir="ltr" type="datetime-local" step="1" value={createdAt} onChange={(event) => setCreatedAt(event.target.value)} disabled={busy} required />
            </label>
            <label className="block space-y-1.5 text-xs text-zinc-400">
              <span>الإعجابات اليدوية</span>
              <input className={fieldClass} dir="ltr" type="number" min="0" max="2147483647" step="1" inputMode="numeric" value={likes} onChange={(event) => setLikes(event.target.value)} disabled={busy} required />
            </label>
          </div>
          <p className="text-xs text-zinc-500">يُحوّل الوقت إلى UTC عند الحفظ. الإعجابات اليدوية قيمة تحددها أنت، وتظهر منفصلة عن تفاعل الأعضاء في الإحصاءات.</p>
          {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className={`${buttonClass} bg-emerald-600 text-white hover:bg-emerald-500`}>{busy ? "جارٍ الحفظ…" : "حفظ المعاينة"}</button>
            <button type="button" onClick={cancelEdit} disabled={busy} className={`${buttonClass} bg-zinc-800 text-zinc-300 hover:bg-zinc-700`}>إلغاء التعديل</button>
          </div>
        </form>
      ) : (
        <>
          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-zinc-200">{item.content}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-zinc-500">
            <time dateTime={item.createdAt} title={`UTC: ${item.createdAt}`}>{iraqDate(item.createdAt)} · العراق</time>
            <span>إعجابات يدوية: <strong className="font-medium text-zinc-300">{item.likesCount.toLocaleString("ar-IQ")}</strong></span>
            {item.sport && <span>{item.sport}</span>}
          </div>
          {!isPublished && <button type="button" disabled={!editable || busy} onClick={beginEdit} className={`${buttonClass} mt-2 text-emerald-400 hover:bg-emerald-500/10`}>تعديل النص أو الهوية أو الأرقام</button>}
        </>
      )}
      {item.error && <p role="alert" className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{item.error}</p>}
      {item.warnings.length > 0 && <ul className="mt-3 space-y-1 text-xs text-amber-300">{item.warnings.map((warning, index) => <li key={`${index}-${warning}`}>• {warning}</li>)}</ul>}
    </article>
  );
}

export default function BatchPreview({ batch, identities, busy, editingKey, onEditChange, onSave }: {
  batch: ImportBatch;
  identities: BatchIdentity[];
  busy: boolean;
  editingKey: string | null;
  onEditChange: (key: string | null) => void;
  onSave: (key: string, patch: BatchItemPatch) => Promise<boolean>;
}) {
  const [filter, setFilter] = useState<"all" | "remaining" | "issues">("all");
  const [visibleCount, setVisibleCount] = useState(30);
  const byKey = new Map(batch.plan.map((item) => [item.key, item]));
  const matching = batch.plan.filter((item) => filter === "all"
    || (filter === "remaining" && (item.state === "pending" || item.state === "failed"))
    || (filter === "issues" && (item.state === "failed" || item.warnings.length > 0 || item.state === "duplicate")));
  const displayed = matching.slice(0, visibleCount);
  const canEdit = batch.status === "draft" || batch.status === "paused" || batch.status === "partial";

  function depthOf(item: ImportBatchItem) {
    if (item.kind === "post") return 0;
    let depth = 1;
    let parentKey = item.parentKey;
    const visited = new Set<string>([item.key]);
    while (parentKey && !visited.has(parentKey)) {
      visited.add(parentKey);
      depth += 1;
      parentKey = byKey.get(parentKey)?.parentKey ?? null;
    }
    return depth;
  }

  return (
    <section aria-label="معاينة محتوى الدفعة" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-medium text-zinc-200">معاينة المحتوى <span className="text-zinc-500">({batch.plan.length})</span></h4>
        <label className="flex items-center gap-2 text-xs text-zinc-400">
          عرض
          <select className="min-h-[44px] rounded-lg border border-zinc-700 bg-zinc-900 px-2 text-zinc-200 focus:ring-2 focus:ring-emerald-500" value={filter} disabled={!!editingKey} onChange={(event) => { setFilter(event.target.value as typeof filter); setVisibleCount(30); }}>
            <option value="all">كل المحتوى</option>
            <option value="remaining">غير المنشور</option>
            <option value="issues">الملاحظات والأخطاء</option>
          </select>
        </label>
      </div>
      <p className="text-xs leading-6 text-zinc-500">التواريخ المعروضة بتوقيت العراق. الإزاحة إلى الداخل توضّح التعليقات والردود التابعة للمنشور.</p>
      {displayed.length === 0 && <p className="rounded-lg border border-zinc-800 p-5 text-center text-sm text-zinc-500">لا توجد عناصر في هذا العرض.</p>}
      {displayed.map((item) => {
        const parent = item.parentKey ? byKey.get(item.parentKey) : null;
        return (
          <div key={item.key} className="space-y-2">
            {item.kind === "comment" && item.targetPostId && !item.parentKey && (
              <p className="break-all text-xs text-zinc-500">على المنشور: <a href={`/post/${item.targetPostId}`} target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline underline-offset-2"><bdi>{item.targetPostId}</bdi><span className="sr-only"> (يفتح في تبويب جديد)</span></a></p>
            )}
            {parent && <p className="mr-6 truncate text-xs text-zinc-500">↳ رد على {parent.displayName}: {parent.content.slice(0, 80)}</p>}
            <ItemCard item={item} depth={depthOf(item)} editable={canEdit && (!editingKey || editingKey === item.key)} identities={identities} busy={busy} onSave={onSave} onEditChange={onEditChange} />
          </div>
        );
      })}
      {matching.length > visibleCount && <button type="button" disabled={!!editingKey} onClick={() => setVisibleCount((count) => count + 30)} className={`${buttonClass} w-full border border-zinc-700 text-zinc-300 hover:bg-zinc-800`}>عرض المزيد ({matching.length - visibleCount} متبقٍ)</button>}
    </section>
  );
}
