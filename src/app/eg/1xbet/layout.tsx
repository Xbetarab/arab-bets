import { GUIDES } from "@/lib/guides";
import { guideMetadata } from "@/lib/seo";
import type { Metadata } from 'next';
import TopicNavigation from "@/components/seo/TopicNavigation";



export const metadata: Metadata = guideMetadata(GUIDES["/eg/1xbet"]);

export default function Eg1xbetLayout({ children }: { children: React.ReactNode }) {
  return <>{children}
      <TopicNavigation cluster="egypt" /></>;
}
