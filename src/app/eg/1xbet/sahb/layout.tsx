import type { Metadata } from 'next';

const BASE_URL = 'https://arabtips.com';

export const metadata: Metadata = {
  title: "طرق السحب من 1xBet مصر 2026 | الحدود بالجنيه المصري",
  description:
    "جدول كامل بطرق السحب من 1xBet في مصر بالجنيه المصري — الحد الأدنى والأقصى لكل طريقة (فودافون كاش، اتصالات كاش، انستاباي، فوري) والبيانات المطلوبة.",
  alternates: { canonical: `${BASE_URL}/eg/1xbet/sahb` },
  openGraph: {
    title: "طرق السحب من 1xBet مصر 2026",
    description: "الحدود الدنيا والقصوى للسحب من 1xBet بالجنيه المصري والبيانات المطلوبة.",
    url: `${BASE_URL}/eg/1xbet/sahb`,
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
      "name": "إيه الحد الأدنى للسحب من 1xBet في مصر؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "الحد الأدنى بيختلف حسب الطريقة — يبدأ من حوالي 50 جنيه لفودافون كاش واتصالات كاش وفوري، و100 جنيه لانستاباي. راجع الحد المعروض جوه التطبيق قبل السحب للتأكيد."
      }
    },
    {
      "@type": "Question",
      "name": "أنهي بيانات محتاجها عشان أسحب؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "حسب الطريقة: رقم المحفظة لفودافون كاش واتصالات كاش، حساب InstaPay لانستاباي، كود الدفع لفوري، وعنوان المحفظة للعملات الرقمية."
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
    { "@type": "ListItem", "position": 3, "name": "طرق السحب", "item": "https://arabtips.com/eg/1xbet/sahb" }
  ]
};

export default function SahbLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {children}
    </>
  );
}
