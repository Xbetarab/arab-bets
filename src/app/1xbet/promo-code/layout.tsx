import { ArticleJsonLd } from "@/components/seo/article-jsonld";
import { GUIDES } from "@/lib/guides";
import { articleJsonLd, guideMetadata } from "@/lib/seo";
import type { Metadata } from 'next';


export const metadata: Metadata = guideMetadata(GUIDES["/1xbet/promo-code"]);

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'وين أدخل كود الخصم بالضبط؟', acceptedAnswer: { '@type': 'Answer', text: 'أثناء التسجيل فقط — في خانة "الرمز الترويجي" أسفل نموذج إنشاء الحساب. بعد إتمام التسجيل لا يمكن إضافته نهائياً.' } },
    { '@type': 'Question', name: 'سجّلت بدون الكود، أقدر أضيفه لاحقاً؟', acceptedAnswer: { '@type': 'Answer', text: 'لا — الكود يُدخل مرة واحدة أثناء إنشاء الحساب فقط. لمن فاته: التواصل مع الدعم المباشر قد يساعد بالحالات الحديثة جداً، لكن بدون ضمان.' } },
    { '@type': 'Question', name: 'شنو الفرق بين التسجيل بالكود وبدونه؟', acceptedAnswer: { '@type': 'Answer', text: 'بدون الكود تحصل على المكافأة القياسية فقط. مع الكود تُفعَّل النسخة المضاعفة: مكافأة رياضية 100% ومكافأة كازينو موزعة على أول 4 إيداعات مع لفات مجانية.' } },
    { '@type': 'Question', name: 'المكافأة تنسحب فوراً؟', acceptedAnswer: { '@type': 'Answer', text: 'لا — يجب تدويرها 5 مرات برهانات تراكمية تتضمن 3 أحداث على الأقل باحتمالات 1.40 فأعلى خلال المدة المحددة بالشروط.' } },
  ],
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: 'https://arabtips.com' },
    { '@type': 'ListItem', position: 2, name: 'مراجعة 1xBet العراق', item: 'https://arabtips.com/1xbet' },
    { '@type': 'ListItem', position: 3, name: 'الرمز الترويجي', item: 'https://arabtips.com/1xbet/promo-code' },
  ],
};

export default function PromoCodeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ArticleJsonLd data={articleJsonLd(GUIDES["/1xbet/promo-code"])} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {children}
    </>
  );
}
