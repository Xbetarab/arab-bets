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
  return data as unknown as Post[];
}

export default function Feed({ userId }: { userId: string }) {
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

  // suppress unused var warning — userId reserved for future like/bookmark actions
  void userId;

  return (
    <div className="space-y-4">
      {/* Quick post CTA */}
      <Link
        href="/create"
        dir="rtl"
        className="block bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-zinc-500 text-sm hover:border-emerald-600/30 transition-colors"
      >
        شارك رأيك أو توقعاتك...
      </Link>

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="block h-8 w-8 rounded-full border-2 border-zinc-600 border-t-emerald-400 animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div dir="rtl" className="text-center py-12 text-zinc-500 text-sm">
          لا توجد منشورات حتى الآن. كن أول من ينشر!
        </div>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}
