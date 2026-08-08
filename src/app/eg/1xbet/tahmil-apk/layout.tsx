import type { Metadata } from 'next';

const BASE_URL = 'https://arabtips.com';

export const metadata: Metadata = {
  title: "تحميل تطبيق 1xBet مصر APK 2026 | خطوات التثبيت والبرومو كود X9GO",
  description:
    "حمّل تطبيق 1xBet APK لأندرويد في مصر خطوة بخطوة، واعرف متطلبات التشغيل وطريقة تفعيل المصادر غير المعروفة، ومتنساش تكتب البرومو كود X9GO وقت التسجيل.",
  alternates: { canonical: `${BASE_URL}/eg/1xbet/tahmil-apk` },
  openGraph: {
    title: "تحميل تطبيق 1xBet مصر APK 2026",
    description: "خطوات تحميل وتثبيت تطبيق 1xBet APK في مصر مع البرومو كود X9GO.",
    url: `${BASE_URL}/eg/1xbet/tahmil-apk`,
    siteName: 'ArabTips',
    locale: 'ar_EG',
    type: 'article',
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "إزاي أحمّل تطبيق 1xBet APK على الأندرويد في مصر؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "فعّل خيار \"مصادر غير معروفة\" من إعدادات الأمان، دوس على زر التحميل واستنى ملف الـAPK ينزّل، افتحه واعمل تثبيت، وبعدها سجّل حساب جديد وحط البرومو كود X9GO."
      }
    },
    {
      "@type": "Question",
      "name": "التطبيق شغّال على أنهي إصدار أندرويد؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "التطبيق بيشتغل على أندرويد 5.0 فأعلى، وحجمه حوالي 56 ميجا، ومتاح باللغة العربية ومجاني بالكامل."
      }
    }
  ]
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "الرئيسية", "item": "https://arabtips.com" },
    { "@type": "ListItem", "position": 2, "name": "1xBet مصر", "item": "https://arabtips.com/eg/1xbet" },
    { "@type": "ListItem", "position": 3, "name": "تحميل التطبيق APK", "item": "https://arabtips.com/eg/1xbet/tahmil-apk" }
  ]
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
