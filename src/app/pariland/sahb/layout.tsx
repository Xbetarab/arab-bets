import type { Metadata } from 'next';

const BASE_URL = 'https://arabtips.com';

export const metadata: Metadata = {
  title: "طرق السحب من Pariland | الحدود والشروط الحقيقية 2026",
  description:
    "حدود السحب من Pariland بالدينار العراقي لكل طريقة: زين كاش، الفاست بي، FIB، آسيا سيل وكي كارد Qi، مع البيانات المطلوبة والتحذيرات.",
  alternates: { canonical: `${BASE_URL}/pariland/sahb` },
  openGraph: {
    title: "طرق السحب من Pariland | الحدود والشروط الحقيقية 2026",
    description: "حدود السحب من Pariland بالدينار العراقي لكل طريقة: زين كاش، الفاست بي، FIB، آسيا سيل وكي كارد Qi، مع البيانات المطلوبة والتحذيرات.",
    url: `${BASE_URL}/pariland/sahb`,
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
      "name": "شنو الحد الأدنى للسحب من Pariland؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "يبدأ الحد الأدنى من حوالي 5,000 دينار عبر FIB و7,000 دينار عبر زين كاش والفاست بي وآسيا سيل."
      }
    },
    {
      "@type": "Question",
      "name": "ليش حد آسيا سيل الأقصى واطي؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "الحد الأقصى للسحب عبر آسيا سيل هو 10,000 دينار فقط — لسحب مبالغ أكبر استخدم زين كاش أو FIB."
      }
    },
    {
      "@type": "Question",
      "name": "شنو البيانات المطلوبة للسحب؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "رقم الهاتف المرتبط بالمحفظة، ومطابقة الاسم في الحسابات المصرفية مثل FIB وكي كارد Qi."
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
      "name": "طرق السحب",
      "item": "https://arabtips.com/pariland/sahb"
    }
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
