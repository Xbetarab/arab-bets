import type { Metadata } from 'next';

const BASE_URL = 'https://arabtips.com';

export const metadata: Metadata = {
  title: 'تحميل تطبيق 1xBet APK للأندرويد 2026 | تنزيل آخر إصدار',
  description:
    'تحميل تطبيق 1xbet APK للأندرويد مباشرة — تنزيل آخر إصدار 2026 بدون Google Play. شرح التثبيت خطوة بخطوة، ويعمل رغم الحجب في العراق.',
  alternates: { canonical: `${BASE_URL}/1xbet/tahmil-apk` },
  openGraph: {
    title: 'تحميل 1xBet APK للأندرويد — آخر إصدار 2026',
    description: 'تنزيل مباشر بصيغة APK، تثبيت خلال دقيقتين، يعمل رغم الحجب.',
    url: `${BASE_URL}/1xbet/tahmil-apk`,
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
    { '@type': 'Question', name: 'شلون أثبت 1xbet APK بجهازي؟', acceptedAnswer: { '@type': 'Answer', text: 'حمّل الملف من الزر أعلاه، فعّل "مصادر غير معروفة" من إعدادات الأمان، افتح الملف واضغط تثبيت. العملية كاملة تأخذ أقل من دقيقتين.' } },
    { '@type': 'Question', name: 'التطبيق آمن؟ ليش مو موجود بكوكل بلي؟', acceptedAnswer: { '@type': 'Answer', text: 'متجر Google Play لا يقبل تطبيقات المراهنات في المنطقة — هذا ينطبق على كل شركات المراهنات. الملف من مصدر 1xBet الرسمي، وهو الأسلوب المعتمد عالمياً لهذا النوع من التطبيقات.' } },
    { '@type': 'Question', name: 'يشتغل على جميع أجهزة الأندرويد؟', acceptedAnswer: { '@type': 'Answer', text: 'يعمل على أندرويد 6.0 فما فوق — أغلب الأجهزة المُصنَّعة خلال آخر 8 سنوات. للأجهزة الأقدم، استخدم النسخة عبر المتصفح.' } },
  ],
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: 'https://arabtips.com' },
    { '@type': 'ListItem', position: 2, name: 'مراجعة 1xBet العراق', item: 'https://arabtips.com/1xbet' },
    { '@type': 'ListItem', position: 3, name: 'تحميل تطبيق 1xBet APK', item: 'https://arabtips.com/1xbet/tahmil-apk' },
  ],
};

export default function TahmilApkLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {children}
    </>
  );
}
