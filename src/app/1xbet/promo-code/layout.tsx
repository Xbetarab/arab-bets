import type { Metadata } from 'next';

const BASE_URL = 'https://arabtips.com';

export const metadata: Metadata = {
  title: 'كود خصم 1xBet — الرمز الترويجي X9GO للاعب العراقي',
  description:
    'الرمز الترويجي 1xbet الحصري X9GO: يضاعف المكافأة الترحيبية الرياضية والكازينو. شرح إدخال كود خصم 1xbet أثناء التسجيل خطوة بخطوة — لا يمكن إضافته بعد إنشاء الحساب.',
  alternates: { canonical: `${BASE_URL}/1xbet/promo-code` },
  openGraph: {
    title: 'كود خصم 1xBet — الرمز الترويجي X9GO',
    description: 'انسخ الكود وأدخله أثناء التسجيل لمضاعفة مكافأتك الترحيبية.',
    url: `${BASE_URL}/1xbet/promo-code`,
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
    { '@type': 'Question', name: 'وين أدخل كود الخصم بالضبط؟', acceptedAnswer: { '@type': 'Answer', text: 'أثناء التسجيل فقط — في خانة "الرمز الترويجي" أسفل نموذج إنشاء الحساب. بعد إتمام التسجيل لا يمكن إضافته نهائياً.' } },
    { '@type': 'Question', name: 'سجّلت بدون الكود، أقدر أضيفه لاحقاً؟', acceptedAnswer: { '@type': 'Answer', text: 'لا — الكود يُدخل مرة واحدة أثناء إنشاء الحساب فقط. لمن فاته: التواصل مع الدعم المباشر قد يساعد بالحالات الحديثة جداً، لكن بدون ضمان.' } },
    { '@type': 'Question', name: 'شنو الفرق بين التسجيل بالكود وبدونه؟', acceptedAnswer: { '@type': 'Answer', text: 'بدون الكود تحصل على المكافأة القياسية فقط. مع الكود تُفعَّل النسخة المضاعفة: مكافأة رياضية 100% ومكافأة كازينو موزعة على أول 4 إيداعات مع لفات مجانية.' } },
    { '@type': 'Question', name: 'المكافأة تنسحب فوراً؟', acceptedAnswer: { '@type': 'Answer', text: 'لا — يجب تدويرها 5 مرات برهانات تراكمية تتضمن 3 أحداث على الأقل باحتمالات 1.40 فأعلى خلال المدة المحددة بالشروط.' } },
  ],
};

export default function PromoCodeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      {children}
    </>
  );
}
