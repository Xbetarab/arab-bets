import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Post } from "@/lib/supabase/types";
import Navbar from "@/components/navbar";
import PostCard from "@/components/post-card";
import Link from "next/link";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("posts")
    .select("content, profiles:author_id(display_name)")
    .eq("id", id)
    .single();

  if (!post) {
    return { title: "منشور غير موجود | arabtips" };
  }

  const authorName =
    (post.profiles as unknown as { display_name: string })?.display_name ??
    "مستخدم";
  const contentPreview = post.content?.slice(0, 120) || "منشور على arabtips";

  return {
    title: `${authorName} على arabtips`,
    description: contentPreview,
    openGraph: {
      title: `${authorName} على arabtips`,
      description: contentPreview,
      type: "article",
      siteName: "arabtips",
    },
    twitter: {
      card: "summary",
      title: `${authorName} على arabtips`,
      description: contentPreview,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from("posts")
    .select("*, profiles:author_id(*)")
    .eq("id", id)
    .single();

  if (error || !post) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("username, display_name, avatar_url")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar
        username={profile?.username ?? null}
        displayName={profile?.display_name ?? null}
        avatarUrl={profile?.avatar_url ?? null}
        isLoggedIn={!!user}
      />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-4">
          <Link
            href="/"
            className="text-zinc-500 hover:text-emerald-400 text-sm transition-colors"
            dir="rtl"
          >
            → العودة للرئيسية
          </Link>
        </div>
        <PostCard
          post={post as unknown as Post}
          userId={user?.id ?? null}
          permalink
        />
      </main>
    </div>
  );
}
