import { ArticleJsonLd } from "@/components/seo/article-jsonld";
import { GUIDES } from "@/lib/guides";
import { articleJsonLd, guideMetadata } from "@/lib/seo";
import type { Metadata } from 'next';


export const metadata: Metadata = guideMetadata(GUIDES["/1xbet/sahb"]);

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'ليش آسيا سيل يحدد السحب بـ10,000 دينار بس؟', acceptedAnswer: { '@type': 'Answer', text: 'هذا حد أقصى مفروض من مزود الخدمة نفسه لآسيا سيل تحديداً. إذا تريد سحب مبلغ أكبر، استخدم زين كاش أو الفاست بي (حتى 1,500,000 دينار) أو FIB (حتى 2,000,000 دينار).' } },
    { '@type': 'Question', name: 'شنو أسوي إذا الاسم ما يطابق بطلب السحب؟', acceptedAnswer: { '@type': 'Answer', text: 'مع FIB وكي كارد، الاسم المُدخل يجب يطابق اسم صاحب الحساب بالضبط. تأكد من كتابة الاسم كما هو مسجّل بالضبط قبل الإرسال.' } },
    { '@type': 'Question', name: 'أقدر أسحب لطريقة مختلفة عن اللي أودعت فيها؟', acceptedAnswer: { '@type': 'Answer', text: 'تقنياً ممكن، لكن السحب بنفس طريقة الإيداع أسرع وأقل تعقيداً ويتجنّب طلب توثيق إضافي.' } },
    { '@type': 'Question', name: 'شكد يستغرق السحب عادة؟', acceptedAnswer: { '@type': 'Answer', text: 'زين كاش والفاست بي من الأسرع (دقائق إلى ساعة)، بينما FIB وكي كارد قد يستغرقان وقتاً أطول بسبب التحقق من مطابقة الاسم.' } },
  ],
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: 'https://arabtips.com' },
    { '@type': 'ListItem', position: 2, name: 'مراجعة 1xBet العراق', item: 'https://arabtips.com/1xbet' },
    { '@type': 'ListItem', position: 3, name: 'طرق السحب', item: 'https://arabtips.com/1xbet/sahb' },
  ],
};

export default function SahbLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ArticleJsonLd data={articleJsonLd(GUIDES["/1xbet/sahb"])} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {children}
    </>
  );
}
