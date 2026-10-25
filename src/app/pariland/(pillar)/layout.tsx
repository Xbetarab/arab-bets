import type { Metadata } from "next";
import { ArticleJsonLd } from "@/components/seo/article-jsonld";
import { GUIDES } from "@/lib/guides";
import { articleJsonLd, guideMetadata } from "@/lib/seo";

const guide = GUIDES["/pariland"];

export const metadata: Metadata = guideMetadata(guide);

export default function ParilandPillarLayout({
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
