import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '1xBet العراق 2026 | الدليل الشامل للتسجيل، الإيداع، ومكافأة 2,100,000 IQD',
  description: 'دليلك الشامل لموقع 1xBet في العراق. تعلم كيفية التسجيل بنقرة واحدة، طرق الإيداع والسحب عبر زين كاش وآسيا سيل حوالة، واحصل على الرابط الشغال وكود الخصم (X9GO).',
  keywords: ['1xbet', '1xBet العراق', 'تسجيل 1xbet', 'تنزيل تطبيق 1xbet', 'رابط 1xbet الشغال', 'شلون اسحب من 1xbet', 'زين كاش', 'آسيا سيل'],
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: 'https://arabtips.com' },
    { '@type': 'ListItem', position: 2, name: 'مراجعة 1xBet العراق', item: 'https://arabtips.com/1xbet' },
  ],
};

export default function XbetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {children}
    </>
  );
}
