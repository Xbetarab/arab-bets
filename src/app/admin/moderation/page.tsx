"use client";

import { useEffect, useState, useTransition } from "react";
import {
  approvePost,
  rejectPost,
  approveComment,
  rejectComment,
  updateAutoApprove,
  fetchPendingContent,
} from "../actions";
import type { PendingPost, PendingComment } from "../actions";
import { formatRelativeTime } from "@/lib/format-time";
import Image from "next/image";

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
    try {
      const data = await fetchPendingContent();
      setPosts(data.posts);
      setComments(data.comments);
      setSettings(data.settings);
    } catch (err) {
      console.error("Failed to load moderation data:", err);
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">قائمة المراجعة</h1>
        <button
          onClick={() => loadData()}
          disabled={loading}
          className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
        >
          تحديث
        </button>
      </div>

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
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3"
            >
              {/* Author info */}
              <div className="flex items-center gap-2" dir="rtl">
                <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                  {post.profiles?.avatar_url ? (
                    <Image
                      src={post.profiles.avatar_url}
                      alt=""
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    (post.profiles?.display_name?.[0] ?? "؟")
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-zinc-200 text-sm font-medium">
                    {post.profiles?.display_name}
                  </span>
                  <span className="text-zinc-500 text-xs">
                    @{post.profiles?.username} · {formatRelativeTime(post.created_at)}
                  </span>
                </div>
              </div>

              {/* Sport badge */}
              {post.sport && (
                <span className="inline-block text-xs bg-emerald-600/20 text-emerald-400 px-2 py-0.5 rounded-full">
                  {post.sport === "football" ? "كرة قدم" :
                   post.sport === "basketball" ? "سلة" :
                   post.sport === "tennis" ? "تنس" :
                   post.sport === "boxing" ? "ملاكمة" :
                   post.sport === "mma" ? "فنون قتالية" :
                   post.sport === "esports" ? "رياضات إلكترونية" :
                   post.sport === "other" ? "أخرى" : post.sport}
                </span>
              )}

              {/* Full post content */}
              <p className="text-sm text-zinc-200 whitespace-pre-wrap" dir="rtl">
                {post.content}
              </p>

              {/* Post image(s) */}
              {post.media_urls && post.media_urls.length > 0 && (
                <div className="space-y-2">
                  {post.media_urls.map((url, i) => (
                    <Image
                      key={i}
                      src={url}
                      alt="صورة المنشور"
                      width={400}
                      height={300}
                      className="rounded-lg max-h-64 w-auto object-contain bg-zinc-800"
                    />
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => handleApprovePost(post.id)}
                  disabled={isPending}
                  className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  موافقة
                </button>
                <button
                  onClick={() => handleRejectPost(post.id)}
                  disabled={isPending}
                  className="text-xs bg-red-600 hover:bg-red-500 text-white px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
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
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3"
            >
              {/* Author info */}
              <div className="flex items-center gap-2" dir="rtl">
                <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                  {comment.profiles?.avatar_url ? (
                    <Image
                      src={comment.profiles.avatar_url}
                      alt=""
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    (comment.profiles?.display_name?.[0] ?? "؟")
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-zinc-200 text-sm font-medium">
                    {comment.profiles?.display_name}
                  </span>
                  <span className="text-zinc-500 text-xs">
                    @{comment.profiles?.username} · {formatRelativeTime(comment.created_at)}
                  </span>
                </div>
              </div>

              {/* Context: which post this comment is on */}
              {comment.post && (
                <div className="text-xs text-zinc-500 bg-zinc-800/50 rounded-lg px-3 py-2" dir="rtl">
                  <span className="text-zinc-400">على منشور: </span>
                  <span className="text-zinc-300">
                    {comment.post.content.length > 80
                      ? comment.post.content.slice(0, 80) + "..."
                      : comment.post.content}
                  </span>
                </div>
              )}

              {/* Full comment content */}
              <p className="text-sm text-zinc-200 whitespace-pre-wrap" dir="rtl">
                {comment.content}
              </p>

              {/* Reply indicator */}
              {comment.parent_id && (
                <span className="text-xs text-zinc-500">↩ رد على تعليق</span>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => handleApproveComment(comment.id)}
                  disabled={isPending}
                  className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  موافقة
                </button>
                <button
                  onClick={() => handleRejectComment(comment.id)}
                  disabled={isPending}
                  className="text-xs bg-red-600 hover:bg-red-500 text-white px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
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
