import { ArticleJsonLd } from "@/components/seo/article-jsonld";
import { GUIDES } from "@/lib/guides";
import { articleJsonLd, guideMetadata } from "@/lib/seo";
import type { Metadata } from 'next';


export const metadata: Metadata = guideMetadata(GUIDES["/eg/1xbet/sahb"]);

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
      <ArticleJsonLd data={articleJsonLd(GUIDES["/eg/1xbet/sahb"])} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {children}
    </>
  );
}
