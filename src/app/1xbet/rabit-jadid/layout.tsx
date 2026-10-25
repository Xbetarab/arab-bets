import type { Metadata } from 'next';
import { ArticleJsonLd } from "@/components/seo/article-jsonld";
import { GUIDES } from "@/lib/guides";
import { articleJsonLd, guideMetadata } from "@/lib/seo";



const guide = GUIDES["/1xbet/rabit-jadid"];

export const metadata: Metadata = guideMetadata(guide);


const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'ليش الرابط ما يفتح عندي؟', acceptedAnswer: { '@type': 'Answer', text: 'أغلب مزودي الإنترنت في العراق يحجبون رابط 1xbet الرئيسي من فترة لأخرى. المشكلة ليست في حسابك — فقط الرابط القديم توقّف. استخدم الرابط المحدّث أو حمّل التطبيق.' } },
    { '@type': 'Question', name: 'شلون أفتح 1xbet بعد الحجب؟', acceptedAnswer: { '@type': 'Answer', text: 'ثلاث طرق: الرابط الشغال المحدّث، تطبيق APK الذي يتجاوز الحجب، وحسابك نفسه يعمل على أي رابط دون إنشاء حساب جديد.' } },
    { '@type': 'Question', name: 'الرابط الجديد آمن؟ حسابي يبقى نفسه؟', acceptedAnswer: { '@type': 'Answer', text: 'نعم. الرابط البديل يوصلك لنفس منصة 1xbet الرسمية — حسابك ورصيدك ومكافآتك كما هي، تدخل بنفس بياناتك.' } },
    { '@type': 'Question', name: 'كل ما ينحجب الرابط، شنو أسوي؟', acceptedAnswer: { '@type': 'Answer', text: 'احفظ الصفحة في المفضلة. نحدّث الرابط الشغال باستمرار — ارجع لها متى ما توقف الرابط عندك.' } },
  ],
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: 'https://arabtips.com' },
    { '@type': 'ListItem', position: 2, name: 'مراجعة 1xBet العراق', item: 'https://arabtips.com/1xbet' },
    { '@type': 'ListItem', position: 3, name: 'رابط 1xbet الشغال', item: 'https://arabtips.com/1xbet/rabit-jadid' },
  ],
};

export default function RabitJadidLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ArticleJsonLd data={articleJsonLd(guide)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {children}
    </>
  );
}
