const MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

export function formatArabicDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  const label = MONTHS[month - 1];
  if (!year || !label || !day) return iso;
  return `${day} ${label} ${year}`;
}

export function GuideByline({
  published,
  updated,
}: {
  published: string;
  updated: string;
}) {
  return (
    <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
      بقلم{" "}
      <a href="/about" className="underline underline-offset-4">
        فريق عرب تيبس
      </a>
      {" · "}
      آخر تحديث: <time dateTime={updated}>{formatArabicDate(updated)}</time>
      <span className="sr-only">
        {" "}
        — نُشر في <time dateTime={published}>{formatArabicDate(published)}</time>
      </span>
    </p>
  );
}
