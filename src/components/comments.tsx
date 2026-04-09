"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Comment } from "@/lib/supabase/types";
import { formatRelativeTime } from "@/lib/format-time";
import { toggleCommentLike } from "@/app/actions/likes";

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
  postId,
  onReply,
}: {
  comment: Comment;
  depth?: number;
  userId: string | null;
  postId: string;
  onReply: (parentId: string) => void;
}) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(comment.likes_count);
  const [isPending, startTransition] = useTransition();

  // suppress unused var warnings
  void postId;

  function handleLike() {
    if (!userId) return;
    startTransition(async () => {
      const result = await toggleCommentLike(comment.id);
      setLiked(result.liked);
      setLikesCount((prev) => prev + (result.liked ? 1 : -1));
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
              className={`hover:text-red-400 transition-colors cursor-pointer disabled:cursor-default ${
                liked ? "text-red-400" : ""
              }`}
            >
              {liked ? "❤️" : "🤍"} {likesCount}
            </button>
            {userId && (
              <button
                onClick={() => onReply(comment.id)}
                className="hover:text-emerald-400 transition-colors cursor-pointer"
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
          postId={postId}
          onReply={onReply}
        />
      ))}
    </div>
  );
}

export default function CommentsSection({
  postId,
  userId,
}: {
  postId: string;
  userId: string | null;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadComments() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("comments")
      .select(
        "*, profiles:author_id(username, display_name, avatar_url)"
      )
      .eq("post_id", postId)
      .order("likes_count", { ascending: false });

    const tree = buildCommentTree(
      (data as unknown as Comment[]) ?? []
    );
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
    const supabase = createClient();
    await supabase.from("comments").insert({
      post_id: postId,
      author_id: userId,
      content: newComment.trim(),
      parent_id: replyTo || null,
    });
    setNewComment("");
    setReplyTo(null);
    setSubmitting(false);
    loadComments();
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
                postId={postId}
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
              <div className="flex gap-2">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="أضف تعليقاً..."
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
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
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
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
