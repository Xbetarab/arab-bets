import type { Metadata } from "next";
import GuidePage from "./page-client";
import { GUIDES } from "@/lib/guides";
import { guideMetadata } from "@/lib/seo";

export const metadata: Metadata = guideMetadata(GUIDES["/1xbet"]);

export default function XbetPage() {
  return <GuidePage />;
}
