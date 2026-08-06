import type { Metadata } from 'next';

const BASE_URL = 'https://arabtips.com';

export const metadata: Metadata = {
  title: "مكافآت Pariland | شروط الرهان بالتفصيل 2026",
  description:
    "شرح مكافآت Pariland: مكافأة الرياضة على الإيداع الأول ومكافأة الكازينو الموزعة على 4 إيداعات، مع شروط الرهان وأسباب عدم تحرير المكافأة.",
  alternates: { canonical: `${BASE_URL}/pariland/bonus` },
  openGraph: {
    title: "مكافآت Pariland | شروط الرهان بالتفصيل 2026",
    description: "شرح مكافآت Pariland: مكافأة الرياضة على الإيداع الأول ومكافأة الكازينو الموزعة على 4 إيداعات، مع شروط الرهان وأسباب عدم تحرير المكافأة.",
    url: `${BASE_URL}/pariland/bonus`,
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
      "name": "شنو الفرق بين مكافأة الرياضة والكازينو؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "مكافأة الرياضة 100% على الإيداع الأول للمراهنات الرياضية، بينما مكافأة الكازينو موزعة على 4 إيداعات (100%، 50%، 25%، 25%) مع لفات مجانية."
      }
    },
    {
      "@type": "Question",
      "name": "شنو شرط الرهان لتحرير المكافأة؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "يجب تدوير مبلغ المكافأة عدة مرات برهانات تراكمية (3 أحداث فأكثر بتذكرة واحدة، كل حدث باحتمالية 1.40 فأعلى) قبل أن تصبح قابلة للسحب."
      }
    },
    {
      "@type": "Question",
      "name": "ليش المكافأة ما تتحرر؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "أشهر الأسباب: استخدام رهانات مفردة بدل تراكمية، أو أحداث باحتمالية أقل من 1.40، أو السحب المبكر (Cash Out) الذي لا يُحتسب عادة."
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
      "name": "المكافآت",
      "item": "https://arabtips.com/pariland/bonus"
    }
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
