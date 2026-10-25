import { ArticleJsonLd } from "@/components/seo/article-jsonld";
import { GUIDES } from "@/lib/guides";
import { articleJsonLd, guideMetadata } from "@/lib/seo";
import type { Metadata } from 'next';


export const metadata: Metadata = guideMetadata(GUIDES["/eg/1xbet/idaa"]);



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
      <ArticleJsonLd data={articleJsonLd(GUIDES["/eg/1xbet/idaa"])} />
      
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {children}
    </>
  );
}
