"use client";

import { useState, useTransition, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Comment } from "@/lib/supabase/types";
import { formatRelativeTime } from "@/lib/format-time";
import { toggleCommentLike } from "@/app/actions/likes";
import { createComment } from "@/app/actions/comments";

function buildCommentTree(comments: Comment[]): Comment[] {
  const map = new Map<string, Comment>();
  const roots: Comment[] = [];

  comments.forEach((c) => map.set(c.id, { ...c, children: [] }));
  comments.forEach((c) => {
    const node = map.get(c.id)!;
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function CommentNode({
  comment,
  depth = 0,
  userId,
  onReply,
}: {
  comment: Comment;
  depth?: number;
  userId: string | null;
  onReply: (parentId: string) => void;
}) {
  const [liked, setLiked] = useState(comment.user_has_liked ?? false);
  const [likesCount, setLikesCount] = useState(comment.likes_count);
  const [isPending, startTransition] = useTransition();

  function handleLike() {
    if (!userId) return;
    // Optimistic update
    setLiked((prev) => !prev);
    setLikesCount((prev) => Math.max(0, prev + (liked ? -1 : 1)));
    startTransition(async () => {
      const result = await toggleCommentLike(comment.id);
      setLiked(result.liked);
    });
  }

  return (
    <div className={depth > 0 ? "comment-thread" : ""}>
      <div className="flex gap-3 py-3">
        {comment.profiles?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={comment.profiles.avatar_url}
            alt={comment.profiles.display_name}
            className="w-8 h-8 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-emerald-600/20 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
            {comment.profiles?.display_name?.charAt(0) || "?"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-white font-medium">
              {comment.profiles?.display_name}
            </span>
            <span className="text-zinc-500">
              @{comment.profiles?.username}
            </span>
            <span className="text-zinc-600">
              &middot; {formatRelativeTime(comment.created_at)}
            </span>
          </div>
          <p className="text-zinc-300 text-sm mt-1">{comment.content}</p>
          <div className="flex gap-4 mt-2 text-zinc-500 text-xs">
            <button
              onClick={handleLike}
              disabled={isPending || !userId}
              className={`flex items-center gap-1 hover:text-red-400 transition-colors cursor-pointer disabled:cursor-default min-h-[44px] min-w-[44px] justify-center ${
                liked ? "text-red-400" : ""
              }`}
            >
              <svg
                className="w-4 h-4"
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
            {userId && (
              <button
                onClick={() => onReply(comment.id)}
                className="hover:text-emerald-400 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                رد
              </button>
            )}
          </div>
        </div>
      </div>
      {comment.children?.map((child) => (
        <CommentNode
          key={child.id}
          comment={child}
          depth={depth + 1}
          userId={userId}
          onReply={onReply}
        />
      ))}
    </div>
  );
}

export default function CommentsSection({
  postId,
  userId,
  forceOpen,
  onCommentsCountChange,
}: {
  postId: string;
  userId: string | null;
  forceOpen?: boolean;
  onCommentsCountChange?: (count: number) => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Respond to forceOpen prop from parent (comment icon click)
  useEffect(() => {
    if (forceOpen && !loaded && !loading) {
      loadComments();
    } else if (forceOpen === false && loaded) {
      setLoaded(false);
      setComments([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceOpen]);

  async function loadComments() {
    setLoading(true);
    const supabase = createClient();

    // Fetch comments sorted by likes_count DESC, then created_at ASC
    // Shadow moderation: show approved comments + current user's own unapproved comments
    let query = supabase
      .from("comments")
      .select(
        "*, profiles:author_id(username, display_name, avatar_url)"
      )
      .eq("post_id", postId)
      .order("likes_count", { ascending: false })
      .order("created_at", { ascending: true });

    if (userId) {
      query = query.or(`is_approved.eq.true,author_id.eq.${userId}`);
    } else {
      query = query.eq("is_approved", true);
    }

    const { data } = await query;

    const rawComments = (data as unknown as Comment[]) ?? [];

    // Check which comments the current user has liked
    if (userId && rawComments.length > 0) {
      const commentIds = rawComments.map((c) => c.id);
      const { data: likedData } = await supabase
        .from("comment_likes")
        .select("comment_id")
        .eq("user_id", userId)
        .in("comment_id", commentIds);

      const likedSet = new Set((likedData ?? []).map((l: { comment_id: string }) => l.comment_id));
      rawComments.forEach((c) => {
        c.user_has_liked = likedSet.has(c.id);
      });
    }

    // Update comment count as fallback
    onCommentsCountChange?.(rawComments.length);

    const tree = buildCommentTree(rawComments);
    setComments(tree);
    setLoaded(true);
    setLoading(false);
  }

  function handleToggle() {
    if (!loaded) {
      loadComments();
    } else {
      setLoaded(false);
      setComments([]);
    }
  }

  async function handleSubmitComment() {
    if (!userId || !newComment.trim()) return;
    setSubmitting(true);
    try {
      await createComment(postId, newComment.trim(), replyTo || null);
      setNewComment("");
      setReplyTo(null);
      await loadComments();
    } catch (err) {
      console.error("Failed to submit comment:", err);
    }
    setSubmitting(false);
  }

  function handleReply(parentId: string) {
    setReplyTo(parentId);
  }

  return (
    <div>
      <button
        onClick={handleToggle}
        className="text-xs text-zinc-500 hover:text-emerald-400 transition-colors cursor-pointer"
      >
        {loading ? "جاري التحميل..." : loaded ? "إخفاء التعليقات" : "عرض التعليقات"}
      </button>

      {loaded && (
        <div className="mt-3 space-y-1">
          {comments.length === 0 ? (
            <p className="text-zinc-600 text-xs">لا توجد تعليقات</p>
          ) : (
            comments.map((c) => (
              <CommentNode
                key={c.id}
                comment={c}
                userId={userId}
                onReply={handleReply}
              />
            ))
          )}

          {/* New comment form */}
          {userId && (
            <div className="pt-3 border-t border-zinc-800/50 space-y-2">
              {replyTo && (
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span>رد على تعليق</span>
                  <button
                    onClick={() => setReplyTo(null)}
                    className="text-red-400 hover:text-red-300 cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              )}
              <div className="flex gap-2 w-full">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="أضف تعليقاً..."
                  className="flex-1 min-w-0 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitComment();
                    }
                  }}
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={submitting || !newComment.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white text-xs px-3 py-2 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed min-h-[44px] shrink-0"
                >
                  {submitting ? "..." : "إرسال"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
