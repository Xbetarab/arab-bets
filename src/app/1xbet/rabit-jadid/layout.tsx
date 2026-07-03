import type { Metadata } from 'next';

const BASE_URL = 'https://arabtips.com';

export const metadata: Metadata = {
  title: 'رابط 1xBet الشغّال الجديد 2026 | تجاوز الحجب في العراق',
  description:
    'رابط 1xbet الشغال والبديل المحدّث باستمرار للعراق. حل مشكلة حجب 1xbet: افتح الموقع الرسمي مباشرة أو حمّل تطبيق APK، وحسابك يبقى نفسه.',
  alternates: { canonical: `${BASE_URL}/1xbet/rabit-jadid` },
  openGraph: {
    title: 'رابط 1xBet الشغّال الآن — تجاوز الحجب في العراق',
    description: 'الرابط البديل المحدّث باستمرار. اضغط وادخل مباشرة، حسابك يبقى نفسه.',
    url: `${BASE_URL}/1xbet/rabit-jadid`,
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
    { '@type': 'Question', name: 'ليش الرابط ما يفتح عندي؟', acceptedAnswer: { '@type': 'Answer', text: 'أغلب مزودي الإنترنت في العراق يحجبون رابط 1xbet الرئيسي من فترة لأخرى. المشكلة ليست في حسابك — فقط الرابط القديم توقّف. استخدم الرابط المحدّث أو حمّل التطبيق.' } },
    { '@type': 'Question', name: 'شلون أفتح 1xbet بعد الحجب؟', acceptedAnswer: { '@type': 'Answer', text: 'ثلاث طرق: الرابط الشغال المحدّث، تطبيق APK الذي يتجاوز الحجب، وحسابك نفسه يعمل على أي رابط دون إنشاء حساب جديد.' } },
    { '@type': 'Question', name: 'الرابط الجديد آمن؟ حسابي يبقى نفسه؟', acceptedAnswer: { '@type': 'Answer', text: 'نعم. الرابط البديل يوصلك لنفس منصة 1xbet الرسمية — حسابك ورصيدك ومكافآتك كما هي، تدخل بنفس بياناتك.' } },
    { '@type': 'Question', name: 'كل ما ينحجب الرابط، شنو أسوي؟', acceptedAnswer: { '@type': 'Answer', text: 'احفظ الصفحة في المفضلة. نحدّث الرابط الشغال باستمرار — ارجع لها متى ما توقف الرابط عندك.' } },
  ],
};

export default function RabitJadidLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      {children}
    </>
  );
}
