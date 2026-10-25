import type { Metadata } from 'next';
import { ArticleJsonLd } from "@/components/seo/article-jsonld";
import { GUIDES } from "@/lib/guides";
import { articleJsonLd, guideMetadata } from "@/lib/seo";



const guide = GUIDES["/pariland/idaa"];

export const metadata: Metadata = guideMetadata(guide);


const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "شنو طرق الإيداع المدعومة في العراق؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "زين كاش، آسيا سيل، FIB، كي كارد Qi، الفاست بي، إضافة إلى العملات الرقمية مثل USDT."
      }
    },
    {
      "@type": "Question",
      "name": "هل الإيداع فوري؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "أغلب الطرق المحلية مثل زين كاش والفاست بي تصل فوراً تقريباً، بينما قد تستغرق التحويلات المصرفية وقتاً أطول."
      }
    },
    {
      "@type": "Question",
      "name": "هل أحتاج الرمز الترويجي قبل الإيداع؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "نعم، أدخل الرمز الترويجي X9GO أثناء التسجيل قبل الإيداع الأول لتحصل على المكافأة المضاعفة."
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
      "name": "طرق الإيداع",
      "item": "https://arabtips.com/pariland/idaa"
    }
  ]
};

export default function IdaaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ArticleJsonLd data={articleJsonLd(guide)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {children}
    </>
  );
}
