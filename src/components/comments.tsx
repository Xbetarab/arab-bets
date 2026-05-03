"use client";

import { useState, useTransition, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Comment } from "@/lib/supabase/types";
import { formatRelativeTime } from "@/lib/format-time";
import { toggleCommentLike } from "@/app/actions/likes";
import { createComment, deleteComment } from "@/app/actions/comments";
import { adminEditComment, adminDeleteComment } from "@/app/admin/actions";
import Link from "next/link";

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
  onDelete,
  isAdmin = false,
}: {
  comment: Comment;
  depth?: number;
  userId: string | null;
  onReply: (parentId: string) => void;
  onDelete: () => void;
  isAdmin?: boolean;
}) {
  const [liked, setLiked] = useState(comment.user_has_liked ?? false);
  const [likesCount, setLikesCount] = useState(comment.likes_count);
  const [isPending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [displayContent, setDisplayContent] = useState(comment.content);
  const [saving, setSaving] = useState(false);
  const isAuthor = userId === comment.author_id;
  const canDelete = isAuthor || isAdmin;
  const canEdit = isAdmin;

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
        <Link href={`/profile/${comment.profiles?.username}`}>
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
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <Link href={`/profile/${comment.profiles?.username}`} className="text-white font-medium hover:text-emerald-400 transition-colors">
              {comment.profiles?.display_name}
            </Link>
            <Link href={`/profile/${comment.profiles?.username}`} className="text-zinc-500 hover:text-emerald-400 transition-colors">
              @{comment.profiles?.username}
            </Link>
            <span className="text-zinc-600">
              &middot; {formatRelativeTime(comment.created_at)}
            </span>
          </div>
          {editing ? (
            <div className="mt-1 space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 min-h-[60px] resize-y"
                dir="rtl"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setEditing(false)}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  onClick={async () => {
                    if (!editContent.trim()) return;
                    setSaving(true);
                    try {
                      await adminEditComment(comment.id, editContent.trim());
                      setDisplayContent(editContent.trim());
                      setEditing(false);
                    } catch (err) {
                      console.error(err);
                    }
                    setSaving(false);
                  }}
                  disabled={saving || !editContent.trim()}
                  className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "..." : "حفظ"}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-zinc-300 text-sm mt-1">{displayContent}</p>
          )}
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
            {canEdit && (
              <button
                onClick={() => {
                  setEditContent(displayContent);
                  setEditing(true);
                }}
                className="text-emerald-400/60 hover:text-emerald-400 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                تعديل
              </button>
            )}
            {canDelete && (
              <button
                onClick={async () => {
                  if (!confirm("هل أنت متأكد من حذف هذا التعليق؟")) return;
                  setDeleting(true);
                  try {
                    if (isAdmin) {
                      await adminDeleteComment(comment.id);
                    } else {
                      await deleteComment(comment.id);
                    }
                    onDelete();
                  } catch (err) {
                    console.error(err);
                    setDeleting(false);
                  }
                }}
                disabled={deleting}
                className="text-red-400/60 hover:text-red-400 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50"
              >
                {deleting ? "..." : "حذف"}
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
          onDelete={onDelete}
          isAdmin={isAdmin}
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
  isAdmin = false,
}: {
  postId: string;
  userId: string | null;
  forceOpen?: boolean;
  onCommentsCountChange?: (count: number) => void;
  isAdmin?: boolean;
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
        className="text-xs font-medium text-emerald-400/80 hover:text-emerald-300 bg-zinc-800/60 hover:bg-zinc-700/60 px-3 py-1.5 rounded-lg transition-colors cursor-pointer min-h-[44px]"
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
                onDelete={loadComments}
                isAdmin={isAdmin}
              />
            ))
          )}

          {/* New comment form or sign-up prompt */}
          {userId ? (
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
          ) : (
            <div className="pt-3 border-t border-zinc-800/50">
              <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-4 text-center space-y-3">
                <p className="text-zinc-300 text-sm">
                  عندك رأي؟ سجل دخولك أو أنشئ حساب وشاركنا!
                </p>
                <div className="flex gap-2 justify-center">
                  <a
                    href="/auth/signup"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors min-h-[44px] flex items-center"
                  >
                    إنشاء حساب
                  </a>
                  <a
                    href="/auth/login"
                    className="bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm font-medium px-5 py-2.5 rounded-lg transition-colors min-h-[44px] flex items-center"
                  >
                    تسجيل الدخول
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
