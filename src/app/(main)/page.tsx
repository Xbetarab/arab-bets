import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { fetchFeedPage } from "@/app/actions/feed";
import Feed from "@/components/feed";
import { ArticleJsonLd } from "@/components/seo/article-jsonld";
import { SITE_URL } from "@/lib/seo";
import type { Post } from "@/lib/supabase/types";

const title = "مجتمع المراهنين العرب في العراق | عرب تيبس";
const description =
  "مجتمع المراهنين العرب في العراق: نقاش التوقعات والنتائج الرياضية بين المتابعين. اقرأ المنشورات وشارك رأيك مع المجتمع.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/` },
  openGraph: {
    title,
    description,
    url: `${SITE_URL}/`,
    siteName: "عرب تيبس",
    locale: "ar_IQ",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/icon-512.png`,
        width: 512,
        height: 512,
        alt: "عرب تيبس",
      },
    ],
  },
  twitter: {
    card: "summary",
    title,
    description,
    images: [`${SITE_URL}/icon-512.png`],
  },
};

function communityJsonLd(posts: Post[]) {
  const forumPosts = posts
    .filter((post) => post.content?.trim())
    .slice(0, 20)
    .map((post) => ({
      "@type": "DiscussionForumPosting",
      headline: post.content.replace(/\s+/g, " ").trim().slice(0, 110),
      text: post.content.slice(0, 4000),
      datePublished: post.created_at,
      url: `${SITE_URL}/post/${post.id}`,
      author: {
        "@type": "Person",
        name: post.profiles?.display_name || "عضو في المجتمع",
      },
      interactionStatistic: {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: post.likes_count ?? 0,
      },
    }));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "عرب تيبس",
        alternateName: ["ArabTips", "مجتمع المراهنين العرب"],
        url: SITE_URL,
        logo: `${SITE_URL}/icon-512.png`,
        areaServed: { "@type": "Country", name: "Iraq" },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: "مجتمع المراهنين العرب",
        url: SITE_URL,
        inLanguage: "ar-IQ",
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/#webpage`,
        url: `${SITE_URL}/`,
        name: "مجتمع المراهنين العرب",
        description,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        mainEntity: forumPosts,
      },
    ],
  };
}

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin = user?.email === "uomankotd@gmail.com";
  const initialFeed = await fetchFeedPage();

  return (
    <>
      <ArticleJsonLd data={communityJsonLd(initialFeed.posts)} />
      <header dir="rtl" className="mb-4">
        <h1 className="text-xl font-bold text-white">
          ArabTips — مجتمع المراهنين العرب
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          شارك آراءك وتوقعاتك الرياضية مع المجتمع.
        </p>
      </header>
      <h2 className="mb-3 text-sm font-medium text-zinc-500">آخر المنشورات</h2>
      <Feed
        userId={user?.id ?? null}
        isAdmin={isAdmin}
        initialPosts={initialFeed.posts}
        initialCursor={initialFeed.nextCursor}
      />
    </>
  );
}
