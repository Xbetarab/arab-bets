"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { BatchActionResult, ImportBatch, ImportBatchStats, ImportBatchSummary, ImportMode } from "@/lib/import-batch-types";
import {
  getImportBatch, getImportBatchStats, listImportBatches, pauseImportBatch,
  previewImportBatch, processImportBatchStep, resumeImportBatch, updateImportBatchItem,
} from "./batch-actions";
import BatchPreview, { iraqDate, type BatchIdentity, type BatchItemPatch } from "./batch-preview";

const buttonClass = "min-h-[44px] rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400";
const statusLabel: Record<ImportBatch["status"], string> = {
  draft: "معاينة محفوظة", running: "قيد النشر", paused: "متوقفة مؤقتًا", completed: "مكتملة", partial: "تحتاج مراجعة",
};
const modeLabel: Record<ImportMode, string> = { posts: "منشورات وتعليقات", comments: "تعليقات فقط" };

function summaryOf(batch: ImportBatch): ImportBatchSummary {
  return {
    id: batch.id, label: batch.label, mode: batch.mode, status: batch.status, createdAt: batch.createdAt, updatedAt: batch.updatedAt,
    total: batch.plan.length,
    published: batch.plan.filter((item) => item.state === "published").length,
    duplicates: batch.plan.filter((item) => item.state === "duplicate").length,
    failed: batch.plan.filter((item) => item.state === "failed").length,
    pending: batch.plan.filter((item) => item.state === "pending").length,
  };
}

function FileCard({ mode, disabled, onPreview }: { mode: ImportMode; disabled: boolean; onPreview: (file: File, mode: ImportMode, label: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState("");
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="text-sm font-semibold text-zinc-200">{mode === "posts" ? "منشورات مع تعليقات وردود" : "تعليقات على منشورات موجودة"}</h3>
      <p className="min-h-10 text-xs leading-6 text-zinc-500">{mode === "posts" ? "اختر ملف المنشورات لتراجع النصوص والهويات والتواريخ قبل النشر." : "اختر ملف التعليقات المرتبطة بمعرّفات منشوراتك، مع الردود التابعة لها."}</p>
      <input ref={input} type="file" accept=".json,application/json" className="hidden" aria-label={`ملف ${modeLabel[mode]}`} disabled={disabled} onChange={(event) => {
        const chosen = event.target.files?.[0] ?? null;
        setFile(chosen);
        setLabel(chosen?.name.replace(/\.json$/i, "") ?? "");
      }} />
      <button type="button" disabled={disabled} onClick={() => input.current?.click()} className={`${buttonClass} min-h-24 w-full border border-dashed border-zinc-600 text-zinc-300 hover:border-emerald-500 hover:bg-emerald-500/5`}>
        <span className="block break-all">{file ? file.name : "اختيار ملف JSON"}</span>
        <span className="mt-1 block text-xs font-normal text-zinc-500">{file ? `${(file.size / 1024).toFixed(1)} KB · اضغط لتغيير الملف` : mode === "posts" ? 'صيغة الملف: { "posts": [...] }' : 'صيغة الملف: { "comments": [...] }'}</span>
      </button>
      {file && <label className="block space-y-1.5 text-xs text-zinc-400">
        <span>اسم الدفعة في السجل</span>
        <input value={label} onChange={(event) => setLabel(event.target.value)} maxLength={120} disabled={disabled} className="min-h-[44px] w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </label>}
      <button type="button" disabled={disabled || !file} onClick={() => file && onPreview(file, mode, label)} className={`${buttonClass} w-full bg-emerald-600 text-white hover:bg-emerald-500`}>إنشاء المعاينة</button>
      <p className="text-xs leading-5 text-zinc-500">يُحفظ المحتوى للمراجعة، ويبدأ النشر عندما تعتمد الدفعة.</p>
    </div>
  );
}

function StatsCard({ stats }: { stats: ImportBatchStats }) {
  const values = [
    ["منشورات هذه الدفعة", stats.managedPosts],
    ["تعليقات وردود هذه الدفعة", stats.managedComments],
    ["الإعجابات اليدوية عند النشر", stats.manualLikes],
    ["إعجابات خارج الهويات المُدارة المعروفة", stats.memberRelationshipLikes],
    ["سجلات إعجاب من الهويات المدارة", stats.managedRelationshipLikes],
    ["ردود خارج الهويات المُدارة المعروفة", stats.memberReplies],
  ] as const;
  return (
    <section aria-label="إحصاءات الدفعة" className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
      <h4 className="text-sm font-medium text-zinc-200">المحتوى والتفاعل</h4>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{values.map(([label, value]) => (
        <div key={label} className="rounded-lg bg-zinc-900 p-3">
          <div className="text-lg font-semibold tabular-nums text-zinc-100">{value.toLocaleString("ar-IQ")}</div>
          <div className="mt-1 text-[11px] leading-5 text-zinc-500">{label}</div>
        </div>
      ))}</div>
      <p className="text-xs leading-6 text-zinc-500">الإعجابات اليدوية هي القيمة التي حددتها عند النشر، وقد يختلف عنها العدد الحالي الظاهر للجمهور. سجلات التفاعل منفصلة عنها. «خارج الهويات المُدارة المعروفة» يستثني المخزون الحالي وهويات سجل الدفعات؛ وقد يشمل هويات شبحية قديمة خرجت من المخزون.</p>
      {stats.deletedItems > 0 && <p className="text-xs text-amber-300">{stats.deletedItems} من العناصر المنشورة لم تعد موجودة؛ الإحصاءات المتاحة تخص المحتوى الموجود.</p>}
    </section>
  );
}

export default function ImportBatchPanel() {
  const [isPending, startTransition] = useTransition();
  const [batch, setBatch] = useState<ImportBatch | null>(null);
  const [history, setHistory] = useState<ImportBatchSummary[]>([]);
  const [identities, setIdentities] = useState<BatchIdentity[]>([]);
  const [stats, setStats] = useState<ImportBatchStats | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [operation, setOperation] = useState("");
  const [running, setRunning] = useState(false);
  const [stopRequested, setStopRequested] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const stop = useRef(false);
  const activeRun = useRef(false);
  const mounted = useRef(true);
  const busy = isPending || running || operation !== "";
  const summary = batch ? summaryOf(batch) : null;

  useEffect(() => {
    mounted.current = true;
    startTransition(async () => {
      try {
        const result = await listImportBatches();
        if (!mounted.current) return;
        setHistory(result.batches ?? []);
        if (!result.success) setErrors(result.errors);
        setHistoryLoaded(true);
      } catch {
        if (mounted.current) { setErrors(["تعذر تحميل سجل الدفعات. أعد المحاولة بزر تحديث السجل."]); setHistoryLoaded(true); }
      }
    });
    return () => { mounted.current = false; stop.current = true; };
  }, []);

  function accept(result: BatchActionResult) {
    if (!mounted.current) return;
    if (result.batch) {
      setBatch(result.batch);
      const next = summaryOf(result.batch);
      setHistory((previous) => [next, ...previous.filter((entry) => entry.id !== next.id)].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    }
    if (result.identities) setIdentities(result.identities);
    if (result.stats) setStats(result.stats);
    setErrors(result.errors);
  }

  function handlePreview(file: File, mode: ImportMode, label: string) {
    if (busy || editingKey) return;
    if (file.size > 900000) {
      setErrors(["حجم الملف أكبر من الحد المسموح (900 كيلوبايت). قسّمه إلى ملفات أصغر، كل منها يحتوي على 1000 عنصر أو أقل."]);
      return;
    }
    setOperation("جارٍ قراءة الملف وتجهيز المعاينة…");
    setErrors([]);
    setNotice("");
    setStats(null);
    startTransition(async () => {
      try {
        const result = await previewImportBatch(await file.text(), mode, label.trim() || file.name);
        accept(result);
        if (result.success) setNotice(result.reused ? "هذا الملف موجود في السجل. فُتحت الدفعة السابقة لتتابعها دون تكرار النشر." : "المعاينة محفوظة. راجع المحتوى ثم اضغط اعتماد ونشر الدفعة.");
      } catch {
        setErrors(["تعذر تجهيز المعاينة. تحقق من الاتصال ثم أعد اختيار الملف؛ السجل يحفظ أي دفعة أُنشئت بالفعل."]);
      } finally { setOperation(""); }
    });
  }

  function refreshHistory() {
    setOperation("جارٍ تحديث السجل…");
    setErrors([]);
    startTransition(async () => {
      try {
        const result = await listImportBatches();
        if (result.batches) setHistory(result.batches);
        setErrors(result.errors);
        setHistoryLoaded(true);
      } catch { setErrors(["تعذر تحديث السجل. تحقق من الاتصال وحاول مجددًا."]); }
      finally { setOperation(""); }
    });
  }

  function openBatch(id: string) {
    setOperation("جارٍ فتح الدفعة…");
    setErrors([]);
    setNotice("");
    setStats(null);
    startTransition(async () => {
      try { accept(await getImportBatch(id)); }
      catch { setErrors(["تعذر فتح الدفعة. حاول مجددًا."]); }
      finally { setOperation(""); }
    });
  }

  function saveItem(key: string, patch: BatchItemPatch): Promise<boolean> {
    if (!batch || busy) return Promise.resolve(false);
    const id = batch.id;
    setOperation("جارٍ حفظ التعديل…");
    setErrors([]);
    return new Promise((resolve) => {
      startTransition(async () => {
        try {
          const result = await updateImportBatchItem(id, key, patch);
          accept(result);
          if (result.success) setNotice("حُفظ التعديل في المعاينة.");
          resolve(result.success);
        } catch { setErrors(["تعذر حفظ التعديل. افتح الدفعة مجددًا للتحقق قبل إعادة المحاولة."]); resolve(false); }
        finally { setOperation(""); }
      });
    });
  }

  function pauseBatch() {
    if (!batch || stopRequested) return;
    stop.current = true;
    setStopRequested(true);
    setNotice("جارٍ إيقاف الدفعة بعد اكتمال الخطوة الحالية…");
    // The running loop owns the next request; it persists the pause before exiting.
    if (activeRun.current) return;
    setOperation("جارٍ إيقاف الدفعة…");
    startTransition(async () => {
      try {
        const result = await pauseImportBatch(batch.id);
        accept(result);
        if (result.success) setNotice("أُوقفت العناصر المتبقية. يمكنك استكمالها من هذه الدفعة لاحقًا.");
      } catch { setErrors(["لم نتأكد من حفظ الإيقاف. حدّث الدفعة للتحقق من حالتها."]); }
      finally { setOperation(""); setStopRequested(false); }
    });
  }

  function publishBatch() {
    if (!batch || busy || editingKey || activeRun.current) return;
    const id = batch.id;
    activeRun.current = true;
    stop.current = false;
    setStopRequested(false);
    setRunning(true);
    setErrors([]);
    setNotice("جارٍ نشر المحتوى على خطوات. يمكنك إيقاف العناصر المتبقية في أي وقت.");
    setStats(null);
    startTransition(async () => {
      try {
        let result = await resumeImportBatch(id);
        accept(result);
        if (!result.success || !result.batch || result.errors.length > 0) return;
        let current = result.batch;
        // A finite upper bound and a progress check prevent automatic retry loops.
        const maximumSteps = current.plan.length + 1;
        for (let step = 0; step < maximumSteps && current.status === "running"; step++) {
          if (stop.current) break;
          const before = current.plan.filter((item) => item.state === "published" || item.state === "duplicate").length;
          result = await processImportBatchStep(id);
          accept(result);
          if (!result.success || !result.batch || result.errors.length > 0) {
            setNotice("توقف الاستكمال عند خطأ. راجع الملاحظات ثم استكمل الدفعة؛ العناصر المنشورة محفوظة.");
            return;
          }
          current = result.batch;
          const after = current.plan.filter((item) => item.state === "published" || item.state === "duplicate").length;
          if (current.status === "running" && after <= before) {
            const paused = await pauseImportBatch(id);
            accept(paused);
            setErrors(["توقفت الدفعة لعدم وجود تقدم في الخطوة الأخيرة. راجعها ثم أعد الاستكمال.", ...paused.errors]);
            return;
          }
        }
        if (stop.current && current.status === "running") {
          result = await pauseImportBatch(id);
          accept(result);
          if (result.success && mounted.current) setNotice("أُوقفت العناصر المتبقية. يمكنك استكمال الدفعة لاحقًا.");
        } else if (current.status === "completed") {
          setNotice("اكتملت الدفعة. يمكنك مراجعة العناصر المنشورة وإحصاءاتها هنا.");
          const metrics = await getImportBatchStats(id);
          if (metrics.stats) setStats(metrics.stats);
          if (metrics.errors.length > 0) setErrors(metrics.errors);
        } else if (current.status === "partial") {
          setNotice("نُشر جزء من الدفعة. راجع العناصر التي تعذر نشرها ثم استكمل المتبقي.");
        } else if (current.status === "running") {
          accept(await pauseImportBatch(id));
          setNotice("توقفت الدفعة مؤقتًا. راجع التقدم قبل الاستكمال.");
        }
      } catch {
        if (mounted.current) {
          setErrors(["انقطع الاتصال أثناء النشر. افتح الدفعة من السجل للتحقق من آخر تقدم، ثم استكملها. إعادة الاستكمال تستخدم العناصر المحفوظة."]);
          setNotice("");
        }
      } finally {
        activeRun.current = false;
        if (mounted.current) { setRunning(false); setStopRequested(false); }
      }
    });
  }

  function loadStats() {
    if (!batch) return;
    setOperation("جارٍ قراءة إحصاءات الدفعة…");
    startTransition(async () => {
      try {
        const result = await getImportBatchStats(batch.id);
        if (result.stats) setStats(result.stats);
        setErrors(result.errors);
      } catch { setErrors(["تعذر تحميل الإحصاءات. حاول مجددًا."]); }
      finally { setOperation(""); }
    });
  }

  return (
    <section dir="rtl" aria-labelledby="batch-panel-heading" className="space-y-5">
      <div>
        <div className="mb-2 text-[11px] font-medium tracking-wide text-emerald-400">مراجعة · نشر · متابعة</div>
        <h2 id="batch-panel-heading" className="text-lg font-bold text-white">دفعات المحتوى</h2>
        <p className="mt-2 text-sm leading-7 text-zinc-400">راجع المحتوى وهوية كل عنصر قبل النشر، ثم تابع التقدم من سجل واحد. إعادة رفع الملف نفسه تعيدك إلى دفعته المحفوظة.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FileCard mode="posts" disabled={busy || !!editingKey} onPreview={handlePreview} />
        <FileCard mode="comments" disabled={busy || !!editingKey} onPreview={handlePreview} />
      </div>

      <div aria-live="polite" aria-atomic="true">
        {(operation || notice) && <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm leading-6 text-emerald-200">{operation || notice}</p>}
      </div>
      {errors.length > 0 && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
        <p className="mb-2 text-sm font-medium text-red-300">تحتاج مراجعة</p>
        <ul className="max-h-48 space-y-2 overflow-auto text-xs leading-6 text-red-200">{errors.map((error, index) => <li key={`${index}-${error}`}>• {error}</li>)}</ul>
      </div>}

      {batch && summary && <div className="space-y-5 rounded-2xl border border-emerald-600/30 bg-zinc-950/30 p-3 sm:p-5" aria-busy={busy}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="break-words text-base font-semibold text-white">{batch.label}</h3>
            <p className="mt-1 text-xs text-zinc-500">{modeLabel[batch.mode]} · {iraqDate(batch.createdAt)} · العراق</p>
          </div>
          <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300">{statusLabel[batch.status]}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {([["عنصر منشور", summary.published], ["بانتظار النشر", summary.pending], ["مكرر تم تخطيه", summary.duplicates], ["تعذر نشره", summary.failed]] as const).map(([label, value]) => <div key={label} className="rounded-lg bg-zinc-900 p-3 text-center">
            <div className="text-xl font-semibold tabular-nums text-white">{value.toLocaleString("ar-IQ")}</div>
            <div className="mt-1 text-[11px] text-zinc-500">{label}</div>
          </div>)}
        </div>
        <div>
          <progress aria-label="تقدم الدفعة" className="h-2 w-full overflow-hidden rounded-full accent-emerald-500" max={summary.total || 1} value={summary.published + summary.duplicates} />
          <p className="mt-1 text-xs text-zinc-500">اكتمل التعامل مع {summary.published + summary.duplicates} من {summary.total} عنصر</p>
        </div>
        {batch.warnings.length > 0 && <details className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3" open>
          <summary className="min-h-[32px] cursor-pointer text-sm text-amber-300">ملاحظات المراجعة ({batch.warnings.length})</summary>
          <ul className="mt-2 max-h-48 space-y-1 overflow-auto text-xs leading-6 text-amber-200">{batch.warnings.map((warning, index) => <li key={`${index}-${warning}`}>• {warning}</li>)}</ul>
        </details>}
        {editingKey && <p className="text-xs text-amber-300">احفظ التعديل المفتوح أو ألغِه قبل نشر الدفعة أو تغيير العرض.</p>}
        <div className="flex flex-wrap gap-2">
          {batch.status !== "completed" && <button type="button" disabled={busy || !!editingKey || summary.pending + summary.failed === 0} onClick={publishBatch} className={`${buttonClass} bg-emerald-600 text-white hover:bg-emerald-500`}>
            {running ? "جارٍ نشر الدفعة…" : batch.status === "draft" ? "اعتماد ونشر الدفعة" : "استكمال العناصر المتبقية"}
          </button>}
          {(running || batch.status === "running") && <button type="button" disabled={stopRequested || (!running && busy)} onClick={pauseBatch} className={`${buttonClass} border border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20`}>{stopRequested ? "جارٍ الإيقاف…" : "إيقاف المتبقي مؤقتًا"}</button>}
          <button type="button" disabled={busy || !!editingKey} onClick={() => openBatch(batch.id)} className={`${buttonClass} border border-zinc-700 text-zinc-300 hover:bg-zinc-800`}>تحديث الدفعة</button>
          <button type="button" disabled={busy || !!editingKey || summary.published + summary.duplicates === 0} onClick={loadStats} className={`${buttonClass} border border-zinc-700 text-zinc-300 hover:bg-zinc-800`}>إحصاءات التفاعل</button>
        </div>
        <p className="text-xs leading-6 text-zinc-500">الإيقاف يحفظ ما نُشر ويوقف المتبقي بعد الخطوة الجارية. إذا أغلقت الصفحة، افتح الدفعة من السجل لاستكمالها.</p>
        {stats && <StatsCard stats={stats} />}
        <BatchPreview key={batch.id} batch={batch} identities={identities} busy={busy} editingKey={editingKey} onEditChange={setEditingKey} onSave={saveItem} />
      </div>}

      <section aria-labelledby="batch-history-heading" className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 id="batch-history-heading" className="text-sm font-semibold text-zinc-200">سجل الدفعات</h3>
          <button type="button" disabled={busy || !!editingKey} onClick={refreshHistory} className={`${buttonClass} text-emerald-400 hover:bg-emerald-500/10`}>تحديث السجل</button>
        </div>
        <p className="text-xs leading-6 text-zinc-500">هذا السجل يبدأ بالدفعات التي تُنشأ من هذه اللوحة. الاستيرادات القديمة لا تُضاف إليه تلقائيًا.</p>
        <p className="text-xs text-zinc-500">يعرض جميع الدفعات غير المكتملة وآخر 30 دفعة مكتملة.</p>
        {history.length === 0 && <p className="py-4 text-center text-sm text-zinc-500">{historyLoaded ? "ستظهر معايناتك ودفعاتك المنشورة هنا." : "جارٍ تحميل السجل…"}</p>}
        {history.length > 0 && <div className="max-h-96 space-y-2 overflow-y-auto">{history.map((entry) => (
          <button type="button" key={entry.id} disabled={busy || !!editingKey} onClick={() => openBatch(entry.id)} aria-pressed={entry.id === batch?.id} className={`w-full rounded-lg border p-3 text-right transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50 ${entry.id === batch?.id ? "border-emerald-500/40 bg-emerald-500/5" : "border-zinc-800 hover:border-zinc-600"}`}>
            <div className="flex flex-wrap justify-between gap-2"><span className="break-words text-sm font-medium text-zinc-200">{entry.label}</span><span className="text-xs text-emerald-400">{statusLabel[entry.status]}</span></div>
            <p className="mt-1 text-[11px] leading-6 text-zinc-500">{modeLabel[entry.mode]} · {iraqDate(entry.createdAt)} · {entry.total} عنصر</p>
            <p className="mt-1 text-xs text-zinc-400">{entry.published} عنصر منشور · {entry.pending} بانتظار النشر · {entry.duplicates} مكرر · {entry.failed} تعذر نشره</p>
          </button>
        ))}</div>}
      </section>
    </section>
  );
}
