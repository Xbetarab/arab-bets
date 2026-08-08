import type { Metadata } from 'next';

const BASE_URL = 'https://arabtips.com';

export const metadata: Metadata = {
  title: "مكافآت 1xBet مصر 2026 | مكافأة الكازينو والرياضة وشروط الرهان",
  description:
    "اعرف كل حاجة عن مكافآت 1xBet في مصر — مكافأة الرياضة على أول إيداع ومكافأة الكازينو الموزّعة على 4 إيداعات، وشروط الرهان لتحرير المكافأة. استخدم البرومو كود X9GO.",
  alternates: { canonical: `${BASE_URL}/eg/1xbet/bonus` },
  openGraph: {
    title: "مكافآت 1xBet مصر 2026",
    description: "مكافأة الكازينو موزّعة على 4 إيداعات ومكافأة الرياضة على الأول — افهم الشروط قبل ما تبدأ.",
    url: `${BASE_URL}/eg/1xbet/bonus`,
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
      "name": "الفرق بين مكافأة الرياضة والكازينو إيه؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "مكافأة الرياضة 100% على أول إيداع للمراهنات الرياضية. مكافأة الكازينو متوزّعة على 4 إيداعات (100%، 50%، 25%، 25%) مع لفات مجانية."
      }
    },
    {
      "@type": "Question",
      "name": "شرط الرهان لتحرير المكافأة إيه؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "لازم تدوّر مبلغ المكافأة كذا مرة برهانات تراكمية (3 أحداث أو أكتر في تذكرة واحدة، كل حدث احتماله 1.40 فأعلى) قبل ما تقدر تسحبها."
      }
    },
    {
      "@type": "Question",
      "name": "ليه المكافأة مش بتتحرّر؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "أشهر الأسباب: استخدام رهانات مفردة بدل التراكمية، أو أحداث احتمالها أقل من 1.40، أو السحب المبكر (Cash Out) اللي عادة مش بيتحسب."
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
    { "@type": "ListItem", "position": 3, "name": "المكافآت", "item": "https://arabtips.com/eg/1xbet/bonus" }
  ]
};

export default function BonusLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {children}
    </>
  );
}
