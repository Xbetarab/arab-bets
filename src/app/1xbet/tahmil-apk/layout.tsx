import { ArticleJsonLd } from "@/components/seo/article-jsonld";
import { GUIDES } from "@/lib/guides";
import { articleJsonLd, guideMetadata } from "@/lib/seo";
import type { Metadata } from 'next';


export const metadata: Metadata = guideMetadata(GUIDES["/1xbet/tahmil-apk"]);

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'شلون أثبت 1xbet APK بجهازي؟', acceptedAnswer: { '@type': 'Answer', text: 'حمّل الملف من الزر أعلاه، فعّل "مصادر غير معروفة" من إعدادات الأمان، افتح الملف واضغط تثبيت. العملية كاملة تأخذ أقل من دقيقتين.' } },
    { '@type': 'Question', name: 'التطبيق آمن؟ ليش مو موجود بكوكل بلي؟', acceptedAnswer: { '@type': 'Answer', text: 'متجر Google Play لا يقبل تطبيقات المراهنات في المنطقة — هذا ينطبق على كل شركات المراهنات. الملف من مصدر 1xBet الرسمي، وهو الأسلوب المعتمد عالمياً لهذا النوع من التطبيقات.' } },
    { '@type': 'Question', name: 'يشتغل على جميع أجهزة الأندرويد؟', acceptedAnswer: { '@type': 'Answer', text: 'يعمل على أندرويد 6.0 فما فوق — أغلب الأجهزة المُصنَّعة خلال آخر 8 سنوات. للأجهزة الأقدم، استخدم النسخة عبر المتصفح.' } },
  ],
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: 'https://arabtips.com' },
    { '@type': 'ListItem', position: 2, name: 'مراجعة 1xBet العراق', item: 'https://arabtips.com/1xbet' },
    { '@type': 'ListItem', position: 3, name: 'تحميل تطبيق 1xBet APK', item: 'https://arabtips.com/1xbet/tahmil-apk' },
  ],
};

export default function TahmilApkLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ArticleJsonLd data={articleJsonLd(GUIDES["/1xbet/tahmil-apk"])} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {children}
    </>
  );
}
