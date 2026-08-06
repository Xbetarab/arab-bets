import type { Metadata } from 'next';

const BASE_URL = 'https://arabtips.com';

export const metadata: Metadata = {
  title: "الرمز الترويجي Pariland X9GO | مكافأة مضاعفة 2026",
  description:
    "الرمز الترويجي Pariland هو X9GO — أدخل البرومو كود أثناء التسجيل لمضاعفة مكافأتك الترحيبية على أول إيداع.",
  alternates: { canonical: `${BASE_URL}/pariland/promo-code` },
  openGraph: {
    title: "الرمز الترويجي Pariland X9GO | مكافأة مضاعفة 2026",
    description: "الرمز الترويجي Pariland هو X9GO — أدخل البرومو كود أثناء التسجيل لمضاعفة مكافأتك الترحيبية على أول إيداع.",
    url: `${BASE_URL}/pariland/promo-code`,
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
      "name": "شنو الرمز الترويجي Pariland؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "الرمز الترويجي Pariland هو X9GO، وهو برومو كود يمنحك مكافأة ترحيبية مضاعفة على أول إيداع."
      }
    },
    {
      "@type": "Question",
      "name": "وين أدخل البرومو كود؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "في خانة الرمز الترويجي داخل نموذج التسجيل — تظهر مرة واحدة فقط قبل تأكيد إنشاء الحساب."
      }
    },
    {
      "@type": "Question",
      "name": "شنو الفرق مع الرمز وبدونه؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "بدون الرمز تحصل على المكافأة الأساسية فقط، ومع الرمز X9GO تتضاعف مكافأتك الترحيبية على أول إيداع."
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
      "name": "الرمز الترويجي",
      "item": "https://arabtips.com/pariland/promo-code"
    }
  ]
};

export default function PromoCodeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {children}
    </>
  );
}
