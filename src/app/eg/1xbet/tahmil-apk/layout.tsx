import { ArticleJsonLd } from "@/components/seo/article-jsonld";
import { GUIDES } from "@/lib/guides";
import { articleJsonLd, guideMetadata } from "@/lib/seo";
import type { Metadata } from 'next';


export const metadata: Metadata = guideMetadata(GUIDES["/eg/1xbet/tahmil-apk"]);

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "إزاي أحمّل تطبيق 1xBet APK على الأندرويد في مصر؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "فعّل خيار \"مصادر غير معروفة\" من إعدادات الأمان، دوس على زر التحميل واستنى ملف الـAPK ينزّل، افتحه واعمل تثبيت، وبعدها سجّل حساب جديد وحط البرومو كود X9GO."
      }
    },
    {
      "@type": "Question",
      "name": "التطبيق شغّال على أنهي إصدار أندرويد؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "التطبيق بيشتغل على أندرويد 5.0 فأعلى، وحجمه حوالي 56 ميجا، ومتاح باللغة العربية ومجاني بالكامل."
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
    { "@type": "ListItem", "position": 3, "name": "تحميل التطبيق APK", "item": "https://arabtips.com/eg/1xbet/tahmil-apk" }
  ]
};

export default function TahmilApkLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ArticleJsonLd data={articleJsonLd(GUIDES["/eg/1xbet/tahmil-apk"])} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {children}
    </>
  );
}
