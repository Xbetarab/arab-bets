import { ArticleJsonLd } from "@/components/seo/article-jsonld";
import { GUIDES } from "@/lib/guides";
import { articleJsonLd, guideMetadata } from "@/lib/seo";
import type { Metadata } from 'next';


export const metadata: Metadata = guideMetadata(GUIDES["/1xbet/bonus"]);

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'شنو الفرق بين مكافأة الرياضة ومكافأة الكازينو؟', acceptedAnswer: { '@type': 'Answer', text: 'مكافأة الرياضة 100% على الإيداع الأول فقط للمراهنات الرياضية. مكافأة الكازينو موزعة على أول 4 إيداعات (100%، 50%، 25%، 25%) مع 150 لفة مجانية.' } },
    { '@type': 'Question', name: 'إيش يعتبر رهان تراكمي لتحرير المكافأة؟', acceptedAnswer: { '@type': 'Answer', text: 'رهان تراكمي يعني اختيار 3 أحداث أو أكثر في تذكرة واحدة، وكل حدث احتماليته 1.40 فأعلى. رهان مفرد لا يُحسب أبداً.' } },
    { '@type': 'Question', name: 'استخدمت رهاناً باحتمال أقل من 1.40، شنو يصير؟', acceptedAnswer: { '@type': 'Answer', text: 'ذلك الرهان لا يُحتسب ضمن التدوير الخمسة حتى لو ربحته.' } },
    { '@type': 'Question', name: 'إذا سحبت رهاني قبل انتهاء المباراة، هل يُحسب؟', acceptedAnswer: { '@type': 'Answer', text: 'لا — الرهانات المسحوبة مبكراً (Cash Out) عادة لا تُحسب ضمن شرط تدوير المكافأة.' } },
  ],
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: 'https://arabtips.com' },
    { '@type': 'ListItem', position: 2, name: 'مراجعة 1xBet العراق', item: 'https://arabtips.com/1xbet' },
    { '@type': 'ListItem', position: 3, name: 'المكافآت', item: 'https://arabtips.com/1xbet/bonus' },
  ],
};

export default function BonusLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ArticleJsonLd data={articleJsonLd(GUIDES["/1xbet/bonus"])} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {children}
    </>
  );
}
