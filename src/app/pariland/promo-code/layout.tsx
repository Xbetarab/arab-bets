import type { Metadata } from 'next';
import { ArticleJsonLd } from "@/components/seo/article-jsonld";
import { GUIDES } from "@/lib/guides";
import { articleJsonLd, guideMetadata } from "@/lib/seo";



const guide = GUIDES["/pariland/promo-code"];

export const metadata: Metadata = guideMetadata(guide);


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
      <ArticleJsonLd data={articleJsonLd(guide)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {children}
    </>
  );
}
