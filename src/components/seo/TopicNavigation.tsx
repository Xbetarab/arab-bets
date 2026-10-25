import Link from 'next/link';

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
