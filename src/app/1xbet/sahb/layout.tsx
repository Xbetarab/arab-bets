import type { Metadata } from 'next';

const BASE_URL = 'https://arabtips.com';

export const metadata: Metadata = {
  title: 'طرق السحب من 1xBet العراق 2026 | الحدود والحقول المطلوبة لكل طريقة',
  description:
    'شرح مفصّل لطرق السحب من 1xbet العراق: زين كاش، الفاست بي، FIB، آسيا سيل، وكي كارد. الحد الأدنى والأقصى الحقيقي لكل طريقة، والبيانات المطلوبة، وأسباب تأخر السحب.',
  alternates: { canonical: `${BASE_URL}/1xbet/sahb` },
  openGraph: {
    title: 'طرق السحب من 1xBet العراق — الحدود الحقيقية لكل طريقة',
    description: 'زين كاش، الفاست بي، FIB، آسيا سيل، كي كارد — التفاصيل الكاملة وأسباب تأخر السحب.',
    url: `${BASE_URL}/1xbet/sahb`,
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
    { '@type': 'Question', name: 'ليش آسيا سيل يحدد السحب بـ10,000 دينار بس؟', acceptedAnswer: { '@type': 'Answer', text: 'هذا حد أقصى مفروض من مزود الخدمة نفسه لآسيا سيل تحديداً. إذا تريد سحب مبلغ أكبر، استخدم زين كاش أو الفاست بي (حتى 1,500,000 دينار) أو FIB (حتى 2,000,000 دينار).' } },
    { '@type': 'Question', name: 'شنو أسوي إذا الاسم ما يطابق بطلب السحب؟', acceptedAnswer: { '@type': 'Answer', text: 'مع FIB وكي كارد، الاسم المُدخل يجب يطابق اسم صاحب الحساب بالضبط. تأكد من كتابة الاسم كما هو مسجّل بالضبط قبل الإرسال.' } },
    { '@type': 'Question', name: 'أقدر أسحب لطريقة مختلفة عن اللي أودعت فيها؟', acceptedAnswer: { '@type': 'Answer', text: 'تقنياً ممكن، لكن السحب بنفس طريقة الإيداع أسرع وأقل تعقيداً ويتجنّب طلب توثيق إضافي.' } },
    { '@type': 'Question', name: 'شكد يستغرق السحب عادة؟', acceptedAnswer: { '@type': 'Answer', text: 'زين كاش والفاست بي من الأسرع (دقائق إلى ساعة)، بينما FIB وكي كارد قد يستغرقان وقتاً أطول بسبب التحقق من مطابقة الاسم.' } },
  ],
};

export default function SahbLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      {children}
    </>
  );
}
