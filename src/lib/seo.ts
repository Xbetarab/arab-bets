import type { Metadata } from "next";
import type { GuideEntry } from "@/lib/guides";

export const SITE_URL = "https://arabtips.com";
export const GUIDE_AUTHOR_NAME = "فريق عرب تيبس";

export function guideMetadata(guide: GuideEntry): Metadata {
  const url = `${SITE_URL}${guide.path}`;
  const languages = guide.hreflang
    ? {
        "ar-IQ": `${SITE_URL}${guide.hreflang.iq}`,
        "ar-EG": `${SITE_URL}${guide.hreflang.eg}`,
        "x-default": `${SITE_URL}${guide.hreflang.iq}`,
      }
    : undefined;

  return {
    title: guide.title,
    description: guide.description,
    alternates: {
      canonical: url,
      ...(languages ? { languages } : {}),
    },
    openGraph: {
      title: guide.title,
      description: guide.description,
      url,
      siteName: "ArabTips",
      locale: guide.locale,
      type: "article",
      publishedTime: guide.published,
      modifiedTime: guide.modified,
      authors: [GUIDE_AUTHOR_NAME],
    },
    twitter: {
      card: "summary",
      title: guide.title,
      description: guide.description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
      },
    },
  };
}

export function articleJsonLd(guide: GuideEntry) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    inLanguage: guide.locale === "ar_EG" ? "ar-EG" : "ar-IQ",
    datePublished: guide.published,
    dateModified: guide.modified,
    mainEntityOfPage: `${SITE_URL}${guide.path}`,
    author: {
      "@type": "Organization",
      name: GUIDE_AUTHOR_NAME,
      url: `${SITE_URL}/about`,
    },
    publisher: {
      "@type": "Organization",
      name: "ArabTips",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icon-512.png`,
      },
    },
  };
}
