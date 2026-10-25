import { createClient } from "@/lib/supabase/server";
import { fetchFeedPage } from "@/app/actions/feed";
import Feed from "@/components/feed";
import type { XSportsPost } from "@/components/x-sports-post";
import type { Metadata } from "next";
import { getSportsFeed, sportsFeedEnabled } from "@/lib/x-sports/public-feed";
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
    images: [{ url: `${SITE_URL}/icon-512.png`, width: 512, height: 512, alt: "عرب تيبس" }],
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

// The browser only needs a same-origin image proxy path, never raw source URLs.
type SportsFeedRow = Awaited<ReturnType<typeof getSportsFeed>>["replies"][number] & {
  likes_count?: number;
  is_liked?: boolean;
};
function toFeedPost(post: SportsFeedRow): XSportsPost {
  return {
    x_id: post.x_id,
    conversation_id: post.conversation_id,
    in_reply_to_x_id: post.in_reply_to_x_id,
    author_username: post.author_username,
    author_name: post.author_name,
    has_avatar: Boolean(post.author_avatar_url),
    body: post.body,
    posted_at: post.posted_at,
    media_count: Array.isArray(post.media_json) ? Math.min(post.media_json.length, 4) : 0,
    likes_count: post.likes_count ?? 0,
    is_liked: post.is_liked ?? false,
  };
}

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin = user?.email === "uomankotd@gmail.com";
  const initialFeed = await fetchFeedPage();
  let importedPosts: XSportsPost[] = [];
  let importedReplies: XSportsPost[] = [];
  try {
    if (await sportsFeedEnabled()) {
      const { roots, replies } = await getSportsFeed(20, user?.id ?? null);
      // Commit both collections together, so a reply failure cannot expose
      // imported roots without their conversation. Native posts stay available.
      const readyPosts = roots.map(toFeedPost);
      const readyReplies = replies.map(toFeedPost);
      importedPosts = readyPosts;
      importedReplies = readyReplies;
    }
  } catch {
    // Avoid logging upstream payloads, credentials, or source URLs.
    console.warn("Optional sports feed unavailable; rendering native feed.");
  }

  return (
    <>
      <ArticleJsonLd data={communityJsonLd(initialFeed.posts)} />
      <section dir="rtl" className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h1 className="text-xl font-bold text-white">ArabTips — مجتمع المراهنين العرب</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          شارك آراءك وتوقعاتك الرياضية مع المجتمع.
        </p>
      </section>
      <h2 className="mb-3 text-sm font-medium text-zinc-500">آخر المنشورات</h2>
      <Feed
        key={user?.id ?? "guest"}
        userId={user?.id ?? null}
        isAdmin={isAdmin}
        initialPosts={initialFeed.posts}
        initialCursor={initialFeed.nextCursor}
        importedPosts={importedPosts}
        importedReplies={importedReplies}
      />
    </>
  );
}
