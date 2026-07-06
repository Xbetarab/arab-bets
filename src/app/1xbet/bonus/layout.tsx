import type { Metadata } from 'next';

const BASE_URL = 'https://arabtips.com';

export const metadata: Metadata = {
  title: 'مكافآت 1xBet العراق 2026 | شروط الرهان بالتفصيل والحساب الحقيقي',
  description:
    'شرح كامل لمكافآت 1xbet: توزيع مكافأة الكازينو على 4 إيداعات، مكافأة الرياضة 100%، وشرط الرهان (تدوير 5 مرات) بمثال محسوب حقيقي وأخطاء شائعة تمنع تحرير المكافأة.',
  alternates: { canonical: `${BASE_URL}/1xbet/bonus` },
  openGraph: {
    title: 'مكافآت 1xBet العراق — الشروط والحساب الحقيقي',
    description: 'توزيع المكافآت عبر 4 إيداعات، ومثال محسوب لشرط الرهان.',
    url: `${BASE_URL}/1xbet/bonus`,
    siteName: 'ArabTips',
    locale: 'ar_IQ',
    type: 'article',
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'شنو الفرق بين مكافأة الرياضة ومكافأة الكازينو؟', acceptedAnswer: { '@type': 'Answer', text: 'مكافأة الرياضة 100% على الإيداع الأول فقط للمراهنات الرياضية. مكافأة الكازينو موزعة على أول 4 إيداعات (100%، 50%، 25%، 25%) مع 150 لفة مجانية.' } },
    { '@type': 'Question', name: 'إيش يعتبر رهان تراكمي لتحرير المكافأة؟', acceptedAnswer: { '@type': 'Answer', text: 'رهان تراكمي يعني اختيار 3 أحداث أو أكثر في تذكرة واحدة، وكل حدث احتماليته 1.40 فأعلى. رهان مفرد لا يُحسب أبداً.' } },
    { '@type': 'Question', name: 'استخدمت رهاناً باحتمال أقل من 1.40، شنو يصير؟', acceptedAnswer: { '@type': 'Answer', text: 'ذلك الرهان لا يُحتسب ضمن التدوير الخمسة حتى لو ربحته.' } },
    { '@type': 'Question', name: 'إذا سحبت رهاني قبل انتهاء المباراة، هل يُحسب؟', acceptedAnswer: { '@type': 'Answer', text: 'لا — الرهانات المسحوبة مبكراً (Cash Out) عادة لا تُحسب ضمن شرط تدوير المكافأة.' } },
  ],
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: 'https://arabtips.com' },
    { '@type': 'ListItem', position: 2, name: 'مراجعة 1xBet العراق', item: 'https://arabtips.com/1xbet' },
    { '@type': 'ListItem', position: 3, name: 'المكافآت', item: 'https://arabtips.com/1xbet/bonus' },
  ],
};

export default function BonusLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {children}
    </>
  );
}
