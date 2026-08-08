import type { Metadata } from 'next';

const BASE_URL = 'https://arabtips.com';

export const metadata: Metadata = {
  title: "طرق الإيداع في 1xBet مصر 2026 | فودافون كاش، فوري، انستاباي",
  description:
    "اعرف كل طرق الإيداع المصرية في 1xBet — فودافون كاش، فوري، انستاباي، اتصالات كاش، أورنج كاش والعملات الرقمية. اختار الطريقة اللي تناسبك وابدأ اللعب.",
  alternates: { canonical: `${BASE_URL}/eg/1xbet/idaa` },
  openGraph: {
    title: "طرق الإيداع في 1xBet مصر 2026",
    description: "طرق الإيداع المصرية المدعومة في 1xBet: فودافون كاش، فوري، انستاباي وأكتر.",
    url: `${BASE_URL}/eg/1xbet/idaa`,
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
      "name": "إيه أشهر طرق الإيداع في 1xBet مصر؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "أشهر طرق الإيداع المصرية هي فودافون كاش، وكمان فوري، انستاباي، اتصالات كاش، أورنج كاش، بالإضافة للعملات الرقمية زي USDT."
      }
    },
    {
      "@type": "Question",
      "name": "الإيداع بفودافون كاش بيوصل بسرعة؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "أيوة، الإيداع من محفظة فودافون كاش بيكون فوري في العادة، فتقدر تبدأ اللعب على طول بعد تأكيد العملية."
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
    { "@type": "ListItem", "position": 3, "name": "طرق الإيداع", "item": "https://arabtips.com/eg/1xbet/idaa" }
  ]
};

export default function IdaaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {children}
    </>
  );
}
