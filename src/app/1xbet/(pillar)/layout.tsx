import type { Metadata } from "next";
import { ArticleJsonLd } from "@/components/seo/article-jsonld";
import { GUIDES } from "@/lib/guides";
import { articleJsonLd, guideMetadata } from "@/lib/seo";

const guide = GUIDES["/1xbet"];

export const metadata: Metadata = {
  ...guideMetadata(guide),
  keywords: [
    "1xbet",
    "1xBet العراق",
    "برومو كود 1xbet العراق",
    "تسجيل 1xbet",
    "تنزيل تطبيق 1xbet",
    "رابط 1xbet الشغال",
    "زين كاش",
    "آسيا سيل",
  ],
};

export default function XbetPillarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ArticleJsonLd data={articleJsonLd(guide)} />
      {children}
    </>
  );
}
