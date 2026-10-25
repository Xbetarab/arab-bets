import type { Metadata } from 'next';
import { ArticleJsonLd } from "@/components/seo/article-jsonld";
import { GUIDES } from "@/lib/guides";
import { articleJsonLd, guideMetadata } from "@/lib/seo";



const guide = GUIDES["/1xbet/aviator"];

export const metadata: Metadata = guideMetadata(guide);


const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'لعبة الطيارة عادلة؟ مو مُتلاعب فيها؟', acceptedAnswer: { '@type': 'Answer', text: 'اللعبة تعمل بنظام RNG معتمد، ونتيجة كل جولة تُحدَّد عشوائياً بشكل مستقل عن الجولات السابقة.' } },
    { '@type': 'Question', name: 'أقدر أجرّبها مجاناً قبل المراهنة بفلوس حقيقية؟', acceptedAnswer: { '@type': 'Answer', text: 'أغلب المنصات توفر وضع تجريبي (Demo) لتجربة الآلية بدون مخاطرة مالية.' } },
    { '@type': 'Question', name: 'شكد الحد الأدنى للرهان بلعبة الطيارة؟', acceptedAnswer: { '@type': 'Answer', text: 'يختلف حسب المنصة، لكنه عادة منخفض جداً — راجع الحد المعروض داخل اللعبة نفسها.' } },
    { '@type': 'Question', name: 'فيه استراتيجية مضمونة للربح؟', acceptedAnswer: { '@type': 'Answer', text: 'لا. هذه لعبة حظ بحتة تعتمد على أرقام عشوائية، والمنصة دائماً لها هامش ربح إحصائي. لا توجد طريقة مضمونة للربح.' } },
  ],
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: 'https://arabtips.com' },
    { '@type': 'ListItem', position: 2, name: 'مراجعة 1xBet العراق', item: 'https://arabtips.com/1xbet' },
    { '@type': 'ListItem', position: 3, name: 'لعبة الطيارة Aviator', item: 'https://arabtips.com/1xbet/aviator' },
  ],
};

export default function AviatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ArticleJsonLd data={articleJsonLd(guide)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {children}
    </>
  );
}
