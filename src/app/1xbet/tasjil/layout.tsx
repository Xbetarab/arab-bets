import type { Metadata } from 'next';
import { ArticleJsonLd } from "@/components/seo/article-jsonld";
import { GUIDES } from "@/lib/guides";
import { articleJsonLd, guideMetadata } from "@/lib/seo";



const guide = GUIDES["/1xbet/tasjil"];

export const metadata: Metadata = guideMetadata(guide);


const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'وين أدخل الرمز الترويجي أثناء التسجيل؟', acceptedAnswer: { '@type': 'Answer', text: 'يظهر خانة "الرمز الترويجي" أسفل نموذج التسجيل في أغلب الطرق. أدخل X9GO فيها قبل التأكيد — لا يمكن إضافته بعد إنشاء الحساب.' } },
    { '@type': 'Question', name: 'ليش التسجيل يفشل ويرفض بياناتي؟', acceptedAnswer: { '@type': 'Answer', text: 'أشهر الأسباب: رقم الهاتف أو البريد الإلكتروني مستخدم مسبقاً، أو العمر أقل من 18 عاماً.' } },
    { '@type': 'Question', name: 'أي طريقة تسجيل الأسرع؟', acceptedAnswer: { '@type': 'Answer', text: '"عن طريق الرمز" هي الأسرع — يُنشئ الموقع رقم حساب وكلمة مرور تلقائياً خلال ثوانٍ.' } },
    { '@type': 'Question', name: 'أقدر أغيّر طريقة الدخول لاحقاً؟', acceptedAnswer: { '@type': 'Answer', text: 'نعم، يمكنك لاحقاً ربط بريد إلكتروني أو رقم هاتف إضافي من إعدادات الحساب.' } },
  ],
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: 'https://arabtips.com' },
    { '@type': 'ListItem', position: 2, name: 'مراجعة 1xBet العراق', item: 'https://arabtips.com/1xbet' },
    { '@type': 'ListItem', position: 3, name: 'التسجيل', item: 'https://arabtips.com/1xbet/tasjil' },
  ],
};

export default function TasjilLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ArticleJsonLd data={articleJsonLd(guide)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {children}
    </>
  );
}
