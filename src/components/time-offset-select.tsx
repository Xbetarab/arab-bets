"use client";

const TIME_OFFSETS = [
  { label: "الآن", value: 0 },
  { label: "منذ دقيقة", value: 1 * 60 * 1000 },
  { label: "منذ 5 دقائق", value: 5 * 60 * 1000 },
  { label: "منذ 15 دقيقة", value: 15 * 60 * 1000 },
  { label: "منذ ساعة", value: 1 * 60 * 60 * 1000 },
  { label: "منذ 6 ساعات", value: 6 * 60 * 60 * 1000 },
  { label: "منذ 12 ساعة", value: 12 * 60 * 60 * 1000 },
  { label: "منذ يوم", value: 24 * 60 * 60 * 1000 },
  { label: "منذ 3 أيام", value: 3 * 24 * 60 * 60 * 1000 },
  { label: "منذ أسبوع", value: 7 * 24 * 60 * 60 * 1000 },
  { label: "منذ شهر", value: 30 * 24 * 60 * 60 * 1000 },
] as const;

export function computeTimestamp(offsetMs: number): string {
  return new Date(Date.now() - offsetMs).toISOString();
}

export default function TimeOffsetSelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (ms: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-zinc-500">وقت النشر</label>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none cursor-pointer"
      >
        {TIME_OFFSETS.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
    </div>
  );
}
