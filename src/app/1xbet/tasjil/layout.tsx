import type { Metadata } from 'next';

const BASE_URL = 'https://arabtips.com';

export const metadata: Metadata = {
  title: 'تسجيل 1xBet العراق 2026 | 4 طرق للتسجيل خطوة بخطوة',
  description:
    'شرح تسجيل 1xbet العراق بأربع طرق: عن طريق الرمز، الهاتف، البريد الإلكتروني، والشبكات الاجتماعية. أدخل الرمز الترويجي أثناء التسجيل لمضاعفة مكافأتك.',
  alternates: { canonical: `${BASE_URL}/1xbet/tasjil` },
  openGraph: {
    title: 'تسجيل 1xBet العراق — 4 طرق خطوة بخطوة',
    description: 'اختر طريقتك: الرمز، الهاتف، البريد الإلكتروني، أو الشبكات الاجتماعية.',
    url: `${BASE_URL}/1xbet/tasjil`,
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
    { '@type': 'Question', name: 'وين أدخل الرمز الترويجي أثناء التسجيل؟', acceptedAnswer: { '@type': 'Answer', text: 'يظهر خانة "الرمز الترويجي" أسفل نموذج التسجيل في أغلب الطرق. أدخل X9GO فيها قبل التأكيد — لا يمكن إضافته بعد إنشاء الحساب.' } },
    { '@type': 'Question', name: 'ليش التسجيل يفشل ويرفض بياناتي؟', acceptedAnswer: { '@type': 'Answer', text: 'أشهر الأسباب: رقم الهاتف أو البريد الإلكتروني مستخدم مسبقاً، أو العمر أقل من 18 عاماً.' } },
    { '@type': 'Question', name: 'أي طريقة تسجيل الأسرع؟', acceptedAnswer: { '@type': 'Answer', text: '"عن طريق الرمز" هي الأسرع — يُنشئ الموقع رقم حساب وكلمة مرور تلقائياً خلال ثوانٍ.' } },
    { '@type': 'Question', name: 'أقدر أغيّر طريقة الدخول لاحقاً؟', acceptedAnswer: { '@type': 'Answer', text: 'نعم، يمكنك لاحقاً ربط بريد إلكتروني أو رقم هاتف إضافي من إعدادات الحساب.' } },
  ],
};

export default function TasjilLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      {children}
    </>
  );
}
