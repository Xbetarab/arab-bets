"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Post } from "@/lib/supabase/types";
import { fetchFeedPage } from "@/app/actions/feed";
import PostCard from "./post-card";
import TipCard from "./tip-card";
import Link from "next/link";

export default function Feed({ userId, isAdmin = false }: { userId: string | null; isAdmin?: boolean }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    fetchFeedPage().then((result) => {
      if (!cancelled) {
        setPosts(result.posts);
        setNextCursor(result.nextCursor);
        setLoading(false);
      }
    });

    // Real-time subscription for new posts at the top
    const supabase = createClient();
    const channel = supabase
      .channel("posts-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        async (payload) => {
          if (cancelled) return;
          const { data } = await supabase
            .from("posts")
            .select("*, profiles:author_id(*)")
            .eq("id", payload.new.id)
            .single();
          if (data && !cancelled) {
            const newPost = data as unknown as Post;
            if (newPost.is_approved || newPost.author_id === userId) {
              setPosts((prev) => {
                if (prev.some((p) => p.id === newPost.id)) return prev;
                return [newPost, ...prev];
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Load more posts
  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const result = await fetchFeedPage(nextCursor);
    setPosts((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const newPosts = result.posts.filter((p) => !existingIds.has(p.id));
      return [...prev, ...newPosts];
    });
    setNextCursor(result.nextCursor);
    setLoadingMore(false);
  }, [nextCursor, loadingMore]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

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
        <>
          {posts.map((post) =>
            post.tip_data ? (
              <TipCard key={post.id} post={post} userId={userId} isAdmin={isAdmin} />
            ) : (
              <PostCard key={post.id} post={post} userId={userId} isAdmin={isAdmin} />
            )
          )}

          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} className="h-1" />

          {loadingMore && (
            <div className="flex justify-center py-6">
              <span className="block h-6 w-6 rounded-full border-2 border-zinc-600 border-t-emerald-400 animate-spin" />
            </div>
          )}

          {!nextCursor && !loadingMore && (
            <p dir="rtl" className="text-center text-zinc-600 text-xs py-6">
              لا يوجد المزيد من المنشورات
            </p>
          )}
        </>
      )}
    </div>
  );
}
