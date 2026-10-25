import type { Metadata } from 'next';
import { ArticleJsonLd } from "@/components/seo/article-jsonld";
import { GUIDES } from "@/lib/guides";
import { articleJsonLd, guideMetadata } from "@/lib/seo";



const guide = GUIDES["/eg/1xbet/idaa"];

export const metadata: Metadata = guideMetadata(guide);


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
      <ArticleJsonLd data={articleJsonLd(guide)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {children}
    </>
  );
}
