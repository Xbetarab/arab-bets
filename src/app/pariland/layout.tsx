import { GUIDES } from "@/lib/guides";
import { guideMetadata } from "@/lib/seo";
import type { Metadata } from 'next';
import TopicNavigation from "@/components/seo/TopicNavigation";



export const metadata: Metadata = guideMetadata(GUIDES["/pariland"]);

export default function ParilandLayout({ children }: { children: React.ReactNode }) {
  return <>{children}
      <TopicNavigation cluster="pariland" /></>;
}
