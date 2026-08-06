import type { Metadata } from 'next';

const BASE_URL = 'https://arabtips.com';

export const metadata: Metadata = {
  title: "التسجيل في Pariland | خطوة بخطوة 2026",
  description:
    "شرح التسجيل في Pariland خطوة بخطوة: اختر العراق والدينار العراقي وأدخل الرمز الترويجي X9GO أثناء إنشاء الحساب لمضاعفة مكافأتك الترحيبية.",
  alternates: { canonical: `${BASE_URL}/pariland/tasjil` },
  openGraph: {
    title: "التسجيل في Pariland | خطوة بخطوة 2026",
    description: "شرح التسجيل في Pariland خطوة بخطوة: اختر العراق والدينار العراقي وأدخل الرمز الترويجي X9GO أثناء إنشاء الحساب لمضاعفة مكافأتك الترحيبية.",
    url: `${BASE_URL}/pariland/tasjil`,
    siteName: 'ArabTips',
    locale: 'ar_IQ',
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
      "name": "كم يستغرق التسجيل في Pariland؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "أقل من دقيقتين — اختر طريقة التسجيل، أدخل بياناتك والرمز الترويجي، ثم أكّد الحساب."
      }
    },
    {
      "@type": "Question",
      "name": "وين أدخل الرمز الترويجي أثناء التسجيل؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "خانة الرمز الترويجي تظهر مرة واحدة فقط في نموذج التسجيل — أدخل X9GO قبل التأكيد، لأنه لا يمكن إضافته بعد إنشاء الحساب."
      }
    },
    {
      "@type": "Question",
      "name": "أي عملة أختار للعراق؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "اختر الدينار العراقي (IQD) لتناسب طرق الدفع المحلية مثل زين كاش وآسيا سيل وFIB."
      }
    }
  ]
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "الرئيسية",
      "item": "https://arabtips.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Pariland العراق",
      "item": "https://arabtips.com/pariland"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "التسجيل",
      "item": "https://arabtips.com/pariland/tasjil"
    }
  ]
};

export default function TasjilLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {children}
    </>
  );
}
