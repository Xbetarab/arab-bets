import type { Metadata } from 'next';

const BASE_URL = 'https://arabtips.com';

export const metadata: Metadata = {
  title: 'طرق الإيداع في 1xBet العراق 2026 | زين كاش، آسيا سيل، FIB خطوة بخطوة',
  description:
    'شرح مفصّل لطرق الإيداع في 1xbet العراق: زين كاش، آسيا سيل، FIB، الفاست بي، وUSDT. خطوات كل طريقة، الحد الأدنى، وحل مشاكل الإيداع الشائعة.',
  alternates: { canonical: `${BASE_URL}/1xbet/idaa` },
  openGraph: {
    title: 'طرق الإيداع في 1xBet العراق — خطوة بخطوة لكل طريقة',
    description: 'زين كاش، آسيا سيل، FIB، USDT — شرح كامل مع حل مشاكل الإيداع الشائعة.',
    url: `${BASE_URL}/1xbet/idaa`,
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
    { '@type': 'Question', name: 'شكد الحد الأدنى للإيداع؟', acceptedAnswer: { '@type': 'Answer', text: 'يبدأ من حوالي 1,400 دينار لبعض الطرق، لكن لتفعيل المكافأة الترحيبية الكاملة تحتاج إيداعاً لا يقل عن 14,000 دينار تقريباً.' } },
    { '@type': 'Question', name: 'شلون أسوي إيداع بزين كاش؟', acceptedAnswer: { '@type': 'Answer', text: 'من حسابك اختر "الإيداع" ← "زين كاش"، أدخل رقم محفظتك والمبلغ، وأكّد من تطبيق زين كاش. الرصيد يضاف خلال ثوانٍ.' } },
    { '@type': 'Question', name: 'ليش الإيداع ما يوصل لحسابي؟', acceptedAnswer: { '@type': 'Answer', text: 'أغلب الحالات سببها اختلاف رقم المحفظة عن رقم الهاتف المسجّل بالحساب، أو تأخر مؤقت من مزود الدفع. تأكد من تطابق الأرقام، وإذا استمرت المشكلة تواصل مع الدعم المباشر بالموقع.' } },
    { '@type': 'Question', name: 'أقدر أسوي إيداع بعملات رقمية؟', acceptedAnswer: { '@type': 'Answer', text: 'نعم، عبر USDT من محفظة OKX أو Binance مباشرة لعنوان محفظتك بالموقع — يستغرق عادة من 5 إلى 15 دقيقة حسب سرعة تأكيد الشبكة.' } },
  ],
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: 'https://arabtips.com' },
    { '@type': 'ListItem', position: 2, name: 'مراجعة 1xBet العراق', item: 'https://arabtips.com/1xbet' },
    { '@type': 'ListItem', position: 3, name: 'طرق الإيداع', item: 'https://arabtips.com/1xbet/idaa' },
  ],
};

export default function IdaaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {children}
    </>
  );
}
