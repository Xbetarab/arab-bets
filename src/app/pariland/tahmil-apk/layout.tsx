import type { Metadata } from 'next';
import { ArticleJsonLd } from "@/components/seo/article-jsonld";
import { GUIDES } from "@/lib/guides";
import { articleJsonLd, guideMetadata } from "@/lib/seo";



const guide = GUIDES["/pariland/tahmil-apk"];

export const metadata: Metadata = guideMetadata(guide);


const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "شنو متطلبات تطبيق Pariland؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "يعمل التطبيق على أندرويد 5.0 فأعلى، بحجم تقريبي 56 ميغابايت، ويدعم اللغة العربية مع تحديثات تلقائية داخل التطبيق."
      }
    },
    {
      "@type": "Question",
      "name": "شلون أثبّت ملف APK؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "فعّل \"مصادر غير معروفة\" من إعدادات الأمان في هاتفك، حمّل ملف APK، افتحه واضغط تثبيت، ثم سجّل بالرمز الترويجي X9GO."
      }
    },
    {
      "@type": "Question",
      "name": "هل التطبيق متوفر للآيفون؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "هذه الصفحة تشرح نسخة الأندرويد APK؛ مستخدمو الآيفون يمكنهم استخدام نسخة الموقع عبر المتصفح."
      }
    }
  ]
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "الرئيسية",
      "item": "https://arabtips.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Pariland العراق",
      "item": "https://arabtips.com/pariland"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "تحميل التطبيق",
      "item": "https://arabtips.com/pariland/tahmil-apk"
    }
  ]
};

export default function TahmilApkLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ArticleJsonLd data={articleJsonLd(guide)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {children}
    </>
  );
}
