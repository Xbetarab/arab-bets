"use client";

import { useState, useTransition, useEffect } from "react";
import type { Post, TipData } from "@/lib/supabase/types";
import { formatRelativeTime } from "@/lib/format-time";
import { togglePostLike } from "@/app/actions/likes";
import { settleTip } from "@/app/actions/posts";
import { createClient } from "@/lib/supabase/client";
import CommentsSection from "./comments";
import Link from "next/link";

const PREDICTION_TYPES: Record<string, string> = {
  "نتيجة المباراة": "نتيجة المباراة",
  "عدد الأهداف": "عدد الأهداف",
  "كلا الفريقين يسجل": "كلا الفريقين يسجل",
  "أول من يسجل": "أول من يسجل",
  "هاندي كاب": "هاندي كاب",
  "أخرى": "أخرى",
};

function resultBadge(result: TipData["result"]) {
  switch (result) {
    case "won":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-600/20 text-green-400 px-2 py-0.5 rounded-full border border-green-600/30">
          🟢 ربح
        </span>
      );
    case "lost":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium bg-red-600/20 text-red-400 px-2 py-0.5 rounded-full border border-red-600/30">
          🔴 خسارة
        </span>
      );
    case "void":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium bg-zinc-600/20 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-600/30">
          ⚪ لا نتيجة
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium bg-yellow-600/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-600/30">
          🟡 قيد الانتظار
        </span>
      );
  }
}

function confidenceStars(level: number) {
  return (
    <span className="text-sm">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < level ? "text-yellow-400" : "text-zinc-700"}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function TipCard({
  post,
  userId,
  canSettle = false,
}: {
  post: Post;
  userId: string | null;
  canSettle?: boolean;
}) {
  const tip = post.tip_data!;
  const profile = post.profiles;
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count ?? 0);
  const [commentsCount, setCommentsCount] = useState(post.comments_count ?? 0);
  const [isPending, startTransition] = useTransition();
  const [showComments, setShowComments] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [showSettleMenu, setShowSettleMenu] = useState(false);
  const [currentResult, setCurrentResult] = useState(tip.result);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    supabase
      .from("likes")
      .select("id")
      .eq("user_id", userId)
      .eq("target_id", post.id)
      .eq("target_type", "post")
      .maybeSingle()
      .then(({ data }) => {
        if (data) setLiked(true);
      });
  }, [userId, post.id]);

  function handleLike() {
    if (!userId) return;
    setLiked((prev) => !prev);
    setLikesCount((prev) => Math.max(0, prev + (liked ? -1 : 1)));
    startTransition(async () => {
      const result = await togglePostLike(post.id);
      setLiked(result.liked);
    });
  }

  async function handleShare() {
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "arabtips", url });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    }
  }

  function handleSettle(result: "won" | "lost" | "void") {
    setShowSettleMenu(false);
    setCurrentResult(result);
    startTransition(async () => {
      await settleTip(post.id, result);
    });
  }

  // Match date display
  const matchDate = new Date(tip.match_date);
  const now = new Date();
  const isPast = matchDate < now;
  const matchDateStr = matchDate.toLocaleDateString("ar", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article
      dir="rtl"
      className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
    >
      {/* Tip header bar */}
      <div className="bg-emerald-600/10 border-b border-emerald-600/20 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">⚽</span>
          <span className="text-emerald-400 text-xs font-medium">توقع رياضي</span>
        </div>
        {resultBadge(currentResult)}
      </div>

      <div className="p-4 space-y-3">
        {/* Author */}
        <div className="flex items-center gap-3">
          <Link href={`/profile/${profile?.username}`}>
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="w-10 h-10 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-emerald-600/20 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">
                {profile?.display_name?.charAt(0) || "?"}
              </div>
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <Link
              href={`/profile/${profile?.username}`}
              className="text-white text-sm font-medium truncate block hover:text-emerald-400 transition-colors"
            >
              {profile?.display_name || "مجهول"}
            </Link>
            <p className="text-zinc-500 text-xs">
              <Link
                href={`/profile/${profile?.username}`}
                className="hover:text-emerald-400 transition-colors"
              >
                @{profile?.username}
              </Link>{" "}
              &middot;{" "}
              <Link
                href={`/post/${post.id}`}
                className="hover:text-emerald-400 transition-colors"
              >
                {formatRelativeTime(post.created_at)}
              </Link>
            </p>
          </div>
        </div>

        {/* Match info */}
        <div className="bg-zinc-800/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-center gap-3 text-white font-medium">
            <span className="text-sm">{tip.match_home}</span>
            <span className="text-emerald-400 text-xs font-bold px-2 py-0.5 bg-emerald-600/20 rounded">
              🆚
            </span>
            <span className="text-sm">{tip.match_away}</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
            <span>{tip.league}</span>
            <span>&middot;</span>
            <span>{isPast ? "انتهت" : matchDateStr}</span>
          </div>
        </div>

        {/* Prediction details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-zinc-500">
              {PREDICTION_TYPES[tip.prediction_type] || tip.prediction_type}:
            </span>
            <span className="text-sm text-white font-medium">
              {tip.prediction}
            </span>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded-lg">
              الأوديز: {tip.odds.toFixed(2)}
            </span>
            <span className="flex items-center gap-1 text-xs text-zinc-400">
              الثقة: {confidenceStars(tip.confidence)}
            </span>
          </div>
        </div>

        {/* Optional analysis text */}
        {post.content && (
          <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap border-t border-zinc-800/50 pt-3">
            {post.content}
          </p>
        )}

        {/* Settle buttons (for author/admin) */}
        {canSettle && currentResult === "pending" && (
          <div className="relative">
            <button
              onClick={() => setShowSettleMenu(!showSettleMenu)}
              className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              تحديد النتيجة
            </button>
            {showSettleMenu && (
              <div className="absolute top-full mt-1 right-0 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-10 min-w-[140px] overflow-hidden">
                <button
                  onClick={() => handleSettle("won")}
                  className="w-full text-right px-4 py-2.5 text-sm text-green-400 hover:bg-zinc-700/50 transition-colors cursor-pointer"
                >
                  🟢 ربح
                </button>
                <button
                  onClick={() => handleSettle("lost")}
                  className="w-full text-right px-4 py-2.5 text-sm text-red-400 hover:bg-zinc-700/50 transition-colors cursor-pointer"
                >
                  🔴 خسارة
                </button>
                <button
                  onClick={() => handleSettle("void")}
                  className="w-full text-right px-4 py-2.5 text-sm text-zinc-400 hover:bg-zinc-700/50 transition-colors cursor-pointer"
                >
                  ⚪ لا نتيجة
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer: likes + comments + share */}
        <div className="flex items-center gap-4 pt-1 border-t border-zinc-800/50 relative">
          <button
            onClick={handleLike}
            disabled={isPending || !userId}
            className={`flex items-center gap-1.5 transition-colors text-xs cursor-pointer disabled:cursor-default min-h-[44px] min-w-[44px] justify-center ${
              liked ? "text-red-400" : "text-zinc-500 hover:text-red-400"
            }`}
          >
            <svg
              className="w-5 h-5"
              fill={liked ? "currentColor" : "none"}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
              />
            </svg>
            <span>{likesCount}</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-zinc-500 hover:text-emerald-400 text-xs transition-colors cursor-pointer min-h-[44px] min-w-[44px] justify-center"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z"
              />
            </svg>
            <span>{commentsCount}</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-zinc-500 hover:text-emerald-400 text-xs transition-colors cursor-pointer min-h-[44px] min-w-[44px] justify-center mr-auto"
            aria-label="مشاركة"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.935-2.186 2.25 2.25 0 0 0-3.935 2.186Z"
              />
            </svg>
          </button>
          {shareToast && (
            <div className="absolute left-2 bottom-full mb-2 bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
              تم نسخ الرابط
            </div>
          )}
        </div>

        {/* Comments */}
        <CommentsSection
          postId={post.id}
          userId={userId}
          forceOpen={showComments}
          onCommentsCountChange={(count) => setCommentsCount(count)}
        />
      </div>
    </article>
  );
}
