"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Post } from "@/lib/supabase/types";
import PostCard from "./post-card";
import Link from "next/link";

async function loadPosts(): Promise<Post[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*, profiles:author_id(*)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];
  const posts = data as unknown as Post[];

  // Count actual likes and comments from their tables (RLS may prevent counter column updates)
  for (const post of posts) {
    const [{ count: likesCount }, { count: commentsCount }] = await Promise.all([
      supabase
        .from("likes")
        .select("id", { count: "exact", head: true })
        .eq("target_id", post.id)
        .eq("target_type", "post"),
      supabase
        .from("comments")
        .select("id", { count: "exact", head: true })
        .eq("post_id", post.id)
        .eq("is_approved", true),
    ]);
    post.likes_count = likesCount ?? post.likes_count;
    post.comments_count = commentsCount ?? post.comments_count;
  }

  return posts;
}

export default function Feed({ userId }: { userId: string | null }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial load + real-time subscription
  useEffect(() => {
    let cancelled = false;

    loadPosts().then((p) => {
      if (!cancelled) {
        setPosts(p);
        setLoading(false);
      }
    });

    const supabase = createClient();
    const channel = supabase
      .channel("posts-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        () => {
          loadPosts().then((p) => {
            if (!cancelled) setPosts(p);
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Quick post CTA */}
      {userId ? (
        <Link
          href="/create"
          dir="rtl"
          className="block bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-zinc-500 text-sm hover:border-emerald-600/30 transition-colors"
        >
          شارك رأيك أو توقعاتك...
        </Link>
      ) : (
        <div
          dir="rtl"
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-zinc-500 text-sm"
        >
          <Link href="/auth/login" className="text-emerald-400 hover:underline">
            سجل دخول
          </Link>{" "}
          لمشاركة رأيك أو توقعاتك
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="block h-8 w-8 rounded-full border-2 border-zinc-600 border-t-emerald-400 animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div dir="rtl" className="text-center py-12 text-zinc-500 text-sm">
          لا توجد منشورات حتى الآن. كن أول من ينشر!
        </div>
      ) : (
        posts.map((post) => (
          <PostCard key={post.id} post={post} userId={userId} />
        ))
      )}
    </div>
  );
}
