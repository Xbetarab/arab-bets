import type { Metadata } from 'next';

const BASE_URL = 'https://arabtips.com';

export const metadata: Metadata = {
  title: "لعبة الطيارة Aviator في 1xBet مصر 2026 | الشرح والمخاطر",
  description:
    "شرح لعبة الطيارة Aviator في 1xBet مصر: إزاي بتشتغل بنظام RNG، وأهم حاجة المخاطر الحقيقية قبل أي رهان. لعبة حظ بحتة ومفيش استراتيجية مضمونة — العب بمسؤولية.",
  alternates: { canonical: `${BASE_URL}/eg/1xbet/aviator` },
  openGraph: {
    title: "لعبة الطيارة Aviator في 1xBet مصر 2026",
    description: "شرح لعبة الطيارة Aviator والمخاطر الحقيقية قبل الرهان — لعبة حظ بحتة.",
    url: `${BASE_URL}/eg/1xbet/aviator`,
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
      "name": "لعبة الطيارة عادلة؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "اللعبة بتشتغل بنظام RNG (أرقام عشوائية) معتمد، ونتيجة كل جولة بتتحدّد عشوائياً ومستقلة عن اللي قبلها — مفيش نمط تقدر تتوقعه."
      }
    },
    {
      "@type": "Question",
      "name": "فيه استراتيجية مضمونة للربح؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "لأ خالص. دي لعبة حظ بحتة، وأي حد بيقولك \"استراتيجية مضمونة\" بيضحك عليك. المنصة دايماً ليها هامش ربح إحصائي، فالعب بحذر ومتحطّش فلوس مش قادر تخسرها."
      }
    },
    {
      "@type": "Question",
      "name": "أقدر أجرّبها ببلاش الأول؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "أغلب المنصات فيها وضع تجريبي (Demo) تقدر تجرّب بيه الآلية من غير فلوس حقيقية — دوّر عليه قبل ما تراهن بجد."
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
    { "@type": "ListItem", "position": 3, "name": "لعبة الطيارة Aviator", "item": "https://arabtips.com/eg/1xbet/aviator" }
  ]
};

export default function AviatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {children}
    </>
  );
}
