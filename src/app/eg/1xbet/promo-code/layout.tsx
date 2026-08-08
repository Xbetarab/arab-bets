import type { Metadata } from 'next';

const BASE_URL = 'https://arabtips.com';

export const metadata: Metadata = {
  title: "البرومو كود 1xBet مصر X9GO 2026 | ضاعف مكافأتك الترحيبية",
  description:
    "البرومو كود بتاع 1xBet في مصر هو X9GO — اكتبه وقت التسجيل عشان تضاعف مكافأتك الترحيبية على أول إيداع. اعرف الفرق بالكود ومن غيره وإزاي تستخدمه صح.",
  alternates: { canonical: `${BASE_URL}/eg/1xbet/promo-code` },
  openGraph: {
    title: "البرومو كود 1xBet مصر X9GO 2026",
    description: "استخدم البرومو كود X9GO وقت التسجيل في 1xBet مصر لمضاعفة مكافأتك الترحيبية.",
    url: `${BASE_URL}/eg/1xbet/promo-code`,
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
      "name": "إيه هو البرومو كود بتاع 1xBet في مصر؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "البرومو كود بتاع 1xBet في مصر هو X9GO. اكتبه في خانة البرومو كود وانت بتعمل حساب جديد عشان تضاعف مكافأتك الترحيبية على أول إيداع."
      }
    },
    {
      "@type": "Question",
      "name": "أكتب البرومو كود امتى بالظبط؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "خانة البرومو كود بتظهر مرة واحدة بس أثناء إنشاء الحساب. اكتب الكود X9GO قبل ما تأكّد التسجيل، لأنك مش هتقدر تضيفه بعد كده."
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
    { "@type": "ListItem", "position": 3, "name": "البرومو كود X9GO", "item": "https://arabtips.com/eg/1xbet/promo-code" }
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
