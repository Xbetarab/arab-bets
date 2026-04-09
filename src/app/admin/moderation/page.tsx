"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  approvePost,
  rejectPost,
  approveComment,
  rejectComment,
  updateAutoApprove,
} from "../actions";
import { formatRelativeTime } from "@/lib/format-time";

type PendingPost = {
  id: string;
  content: string;
  created_at: string;
  profiles: { username: string; display_name: string; avatar_url: string | null };
};

type PendingComment = {
  id: string;
  content: string;
  created_at: string;
  profiles: { username: string; display_name: string; avatar_url: string | null };
};

type ModerationSettings = {
  auto_approve_posts: boolean;
  auto_approve_comments: boolean;
};

export default function ModerationPage() {
  const [posts, setPosts] = useState<PendingPost[]>([]);
  const [comments, setComments] = useState<PendingComment[]>([]);
  const [settings, setSettings] = useState<ModerationSettings>({
    auto_approve_posts: true,
    auto_approve_comments: true,
  });
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  async function loadData() {
    setLoading(true);
    const supabase = createClient();

    const [postsRes, commentsRes, settingsRes] = await Promise.all([
      supabase
        .from("posts")
        .select("id, content, created_at, profiles:author_id(username, display_name, avatar_url)")
        .eq("is_approved", false)
        .order("created_at", { ascending: false }),
      supabase
        .from("comments")
        .select("id, content, created_at, profiles:author_id(username, display_name, avatar_url)")
        .eq("is_approved", false)
        .order("created_at", { ascending: false }),
      supabase
        .from("app_settings")
        .select("value")
        .eq("key", "moderation")
        .maybeSingle(),
    ]);

    setPosts((postsRes.data as unknown as PendingPost[]) ?? []);
    setComments((commentsRes.data as unknown as PendingComment[]) ?? []);
    if (settingsRes.data?.value) {
      setSettings(settingsRes.data.value as ModerationSettings);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleApprovePost(id: string) {
    startTransition(async () => {
      await approvePost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    });
  }

  function handleRejectPost(id: string) {
    startTransition(async () => {
      await rejectPost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    });
  }

  function handleApproveComment(id: string) {
    startTransition(async () => {
      await approveComment(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
    });
  }

  function handleRejectComment(id: string) {
    startTransition(async () => {
      await rejectComment(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
    });
  }

  function handleToggleAutoApprove(
    key: "auto_approve_posts" | "auto_approve_comments"
  ) {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    startTransition(async () => {
      const confirmed = await updateAutoApprove(
        newSettings.auto_approve_posts,
        newSettings.auto_approve_comments
      );
      // Re-sync state with what DB actually has
      if (confirmed) {
        setSettings(confirmed);
      }
    });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="block h-8 w-8 rounded-full border-2 border-zinc-600 border-t-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <h1 className="text-xl font-bold text-white">قائمة المراجعة</h1>

      {/* Auto-approve toggles */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-medium text-zinc-300">إعدادات الموافقة التلقائية</h2>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.auto_approve_posts}
            onChange={() => handleToggleAutoApprove("auto_approve_posts")}
            disabled={isPending}
            className="w-4 h-4 accent-emerald-500"
          />
          <span className="text-sm text-zinc-400">موافقة تلقائية على المنشورات</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.auto_approve_comments}
            onChange={() => handleToggleAutoApprove("auto_approve_comments")}
            disabled={isPending}
            className="w-4 h-4 accent-emerald-500"
          />
          <span className="text-sm text-zinc-400">موافقة تلقائية على التعليقات</span>
        </label>
      </div>

      {/* Pending posts */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-zinc-300">
          منشورات معلقة ({posts.length})
        </h2>
        {posts.length === 0 ? (
          <p className="text-zinc-500 text-sm">لا توجد منشورات معلقة</p>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2"
            >
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="text-zinc-300 font-medium">
                  {post.profiles?.display_name}
                </span>
                <span>@{post.profiles?.username}</span>
                <span>&middot; {formatRelativeTime(post.created_at)}</span>
              </div>
              <p className="text-sm text-zinc-200 line-clamp-3">{post.content}</p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => handleApprovePost(post.id)}
                  disabled={isPending}
                  className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  موافقة
                </button>
                <button
                  onClick={() => handleRejectPost(post.id)}
                  disabled={isPending}
                  className="text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  رفض
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pending comments */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-zinc-300">
          تعليقات معلقة ({comments.length})
        </h2>
        {comments.length === 0 ? (
          <p className="text-zinc-500 text-sm">لا توجد تعليقات معلقة</p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2"
            >
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="text-zinc-300 font-medium">
                  {comment.profiles?.display_name}
                </span>
                <span>@{comment.profiles?.username}</span>
                <span>&middot; {formatRelativeTime(comment.created_at)}</span>
              </div>
              <p className="text-sm text-zinc-200 line-clamp-3">
                {comment.content}
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => handleApproveComment(comment.id)}
                  disabled={isPending}
                  className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  موافقة
                </button>
                <button
                  onClick={() => handleRejectComment(comment.id)}
                  disabled={isPending}
                  className="text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  رفض
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
