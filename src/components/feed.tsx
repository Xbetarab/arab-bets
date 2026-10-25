"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Post } from "@/lib/supabase/types";
import { fetchFeedPage } from "@/app/actions/feed";
import PostCard from "./post-card";
import TipCard from "./tip-card";
import ImportedPostCard, { type XSportsPost } from "./x-sports-post";
import Link from "next/link";

export default function Feed({ userId, isAdmin = false, initialPosts, initialCursor, importedPosts = [], importedReplies = [] }: {
  userId: string | null;
  isAdmin?: boolean;
  initialPosts: Post[];
  initialCursor: string | null;
  importedPosts?: XSportsPost[];
  importedReplies?: XSportsPost[];
}) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(initialCursor);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // The first page is rendered by the server; subscribe without fetching it again.
  useEffect(() => {
    let cancelled = false;

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

  // Keep imported items in the same chronological list as ordinary posts.
  // They remain separate records, so native likes, comments and admin actions
  // are never called with an external ID.
  const feedItems = [
    ...posts.map((post) => ({ kind: "local" as const, key: `local:${post.id}`, time: Date.parse(post.created_at), post })),
    ...importedPosts.map((post) => ({ kind: "imported" as const, key: `imported:${post.x_id}`, time: Date.parse(post.posted_at), post })),
  ].sort((a, b) => b.time - a.time || a.key.localeCompare(b.key));

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

      {feedItems.length === 0 ? (
        <div dir="rtl" className="text-center py-12 text-zinc-500 text-sm">
          لا توجد منشورات حتى الآن. كن أول من ينشر!
        </div>
      ) : (
        <>
          {feedItems.map((item) => item.kind === "imported" ? (
            <ImportedPostCard
              key={item.key}
              post={item.post}
              userId={userId}
              replies={importedReplies.filter((reply) => reply.conversation_id === item.post.x_id)}
            />
          ) : item.post.tip_data ? (
            <TipCard key={item.key} post={item.post} userId={userId} isAdmin={isAdmin} />
          ) : (
            <PostCard key={item.key} post={item.post} userId={userId} isAdmin={isAdmin} />
          ))}

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
