import type { Metadata } from 'next';

const BASE_URL = 'https://arabtips.com';

export const metadata: Metadata = {
  title: "Pariland العراق 2026 | المراجعة الكاملة والرمز الترويجي",
  description:
    "مراجعة Pariland العراق 2026: التسجيل، تحميل التطبيق، طرق الإيداع والسحب، والمكافآت. استخدم الرمز الترويجي X9GO أثناء التسجيل لمضاعفة مكافأتك الترحيبية.",
  alternates: { canonical: `${BASE_URL}/pariland` },
  openGraph: {
    title: "Pariland العراق 2026 | المراجعة الكاملة والرمز الترويجي",
    description: "مراجعة Pariland العراق 2026: التسجيل، تحميل التطبيق، طرق الإيداع والسحب، والمكافآت. استخدم الرمز الترويجي X9GO أثناء التسجيل لمضاعفة مكافأتك الترحيبية.",
    url: `${BASE_URL}/pariland`,
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
      "name": "شنو هو Pariland؟ وهل هو آمن؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Pariland منصة مراهنات رياضية وكازينو أونلاين مرخّصة، تعمل بنفس تقنية المنصات العالمية المعروفة وتقبل اللاعبين من الدول العربية بما فيها العراق، مع دعم كامل للغة العربية والدينار العراقي."
      }
    },
    {
      "@type": "Question",
      "name": "وين أدخل الرمز الترويجي؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "أدخل الرمز الترويجي X9GO في الخانة المخصصة أثناء التسجيل — يظهر مرة واحدة فقط عند إنشاء الحساب، ولا يمكن إضافته بعد ذلك."
      }
    },
    {
      "@type": "Question",
      "name": "شلون أسجّل وأبدأ؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "التسجيل يستغرق أقل من دقيقتين — اختر إحدى طرق التسجيل الأربع، أدخل بياناتك والرمز الترويجي، واختر العملة الدينار العراقي."
      }
    },
    {
      "@type": "Question",
      "name": "شنو طرق الإيداع والسحب المتاحة للعراق؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "تدعم المنصة طرق الدفع الشائعة في العراق: زين كاش، آسيا سيل، FIB وغيرها — راجع صفحتي الإيداع والسحب للحدود والشروط الحقيقية لكل طريقة."
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
    }
  ]
};

export default function ParilandLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {children}
    </>
  );
}
