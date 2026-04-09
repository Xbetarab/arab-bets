"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { adminSetPostCounts, adminSetCommentLikes } from "../actions";

type PostPreview = {
  id: string;
  content: string;
  likes_count: number;
  comments_count: number;
};

type CommentPreview = {
  id: string;
  content: string;
  likes_count: number;
  post_id: string;
};

export default function CountersPage() {
  const [posts, setPosts] = useState<PostPreview[]>([]);
  const [comments, setComments] = useState<CommentPreview[]>([]);
  const [selectedPost, setSelectedPost] = useState<PostPreview | null>(null);
  const [selectedComment, setSelectedComment] = useState<CommentPreview | null>(null);
  const [postLikes, setPostLikes] = useState(0);
  const [postComments, setPostComments] = useState(0);
  const [commentLikes, setCommentLikes] = useState(0);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  async function loadPosts() {
    setLoadingPosts(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("posts")
      .select("id, content, likes_count, comments_count")
      .order("created_at", { ascending: false })
      .limit(50);
    setPosts((data as PostPreview[]) ?? []);
    setLoadingPosts(false);
  }

  async function loadComments(postId: string) {
    setLoadingComments(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("comments")
      .select("id, content, likes_count, post_id")
      .eq("post_id", postId)
      .order("created_at", { ascending: false });
    setComments((data as CommentPreview[]) ?? []);
    setLoadingComments(false);
  }

  function selectPost(post: PostPreview) {
    setSelectedPost(post);
    setPostLikes(post.likes_count);
    setPostComments(post.comments_count);
    setSelectedComment(null);
    setComments([]);
    loadComments(post.id);
  }

  function selectComment(comment: CommentPreview) {
    setSelectedComment(comment);
    setCommentLikes(comment.likes_count);
  }

  function handleSavePost() {
    if (!selectedPost) return;
    startTransition(async () => {
      try {
        await adminSetPostCounts(selectedPost.id, postLikes, postComments);
        setMessage({ type: "success", text: "تم تحديث العدادات بنجاح" });
        setSelectedPost({ ...selectedPost, likes_count: postLikes, comments_count: postComments });
        setPosts((prev) =>
          prev.map((p) =>
            p.id === selectedPost.id ? { ...p, likes_count: postLikes, comments_count: postComments } : p
          )
        );
      } catch {
        setMessage({ type: "error", text: "فشل تحديث العدادات" });
      }
    });
  }

  function handleSaveComment() {
    if (!selectedComment) return;
    startTransition(async () => {
      try {
        await adminSetCommentLikes(selectedComment.id, commentLikes);
        setMessage({ type: "success", text: "تم تحديث إعجابات التعليق" });
        setSelectedComment({ ...selectedComment, likes_count: commentLikes });
        setComments((prev) =>
          prev.map((c) =>
            c.id === selectedComment.id ? { ...c, likes_count: commentLikes } : c
          )
        );
      } catch {
        setMessage({ type: "error", text: "فشل تحديث إعجابات التعليق" });
      }
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold text-white">التحكم بالعدادات</h1>

      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-emerald-600/10 text-emerald-400 border border-emerald-600/20"
              : "bg-red-600/10 text-red-400 border border-red-600/20"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Load posts */}
      <div className="space-y-3">
        <button
          onClick={loadPosts}
          disabled={loadingPosts}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white text-sm px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed min-h-[44px]"
        >
          {loadingPosts ? "جاري التحميل..." : "تحميل المنشورات"}
        </button>

        {posts.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {posts.map((post) => (
              <button
                key={post.id}
                onClick={() => selectPost(post)}
                className={`w-full text-right p-3 rounded-lg text-sm transition-colors cursor-pointer ${
                  selectedPost?.id === post.id
                    ? "bg-emerald-600/20 border border-emerald-600/30"
                    : "bg-zinc-900 border border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <p className="text-zinc-200 line-clamp-1">{post.content || "(بدون محتوى)"}</p>
                <p className="text-zinc-500 text-xs mt-1">
                  ❤️ {post.likes_count} &middot; 💬 {post.comments_count}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Post counter editor */}
      {selectedPost && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
          <h2 className="text-sm font-medium text-zinc-300">تعديل عدادات المنشور</h2>
          <p className="text-zinc-400 text-xs line-clamp-2">{selectedPost.content}</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">عدد الإعجابات</label>
              <input
                type="number"
                min={0}
                value={postLikes}
                onChange={(e) => setPostLikes(Number(e.target.value))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">عدد التعليقات</label>
              <input
                type="number"
                min={0}
                value={postComments}
                onChange={(e) => setPostComments(Number(e.target.value))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>
          <button
            onClick={handleSavePost}
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white text-sm px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed min-h-[44px] w-full"
          >
            {isPending ? "جاري الحفظ..." : "حفظ عدادات المنشور"}
          </button>
        </div>
      )}

      {/* Comments for selected post */}
      {selectedPost && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-zinc-300">
            تعليقات المنشور ({comments.length})
          </h2>
          {loadingComments ? (
            <div className="flex justify-center py-4">
              <span className="block h-6 w-6 rounded-full border-2 border-zinc-600 border-t-emerald-400 animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-zinc-500 text-sm">لا توجد تعليقات</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {comments.map((comment) => (
                <button
                  key={comment.id}
                  onClick={() => selectComment(comment)}
                  className={`w-full text-right p-3 rounded-lg text-sm transition-colors cursor-pointer ${
                    selectedComment?.id === comment.id
                      ? "bg-emerald-600/20 border border-emerald-600/30"
                      : "bg-zinc-900 border border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <p className="text-zinc-200 line-clamp-1">{comment.content}</p>
                  <p className="text-zinc-500 text-xs mt-1">❤️ {comment.likes_count}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Comment like editor */}
      {selectedComment && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
          <h2 className="text-sm font-medium text-zinc-300">تعديل إعجابات التعليق</h2>
          <p className="text-zinc-400 text-xs line-clamp-2">{selectedComment.content}</p>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">عدد الإعجابات</label>
            <input
              type="number"
              min={0}
              value={commentLikes}
              onChange={(e) => setCommentLikes(Number(e.target.value))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          <button
            onClick={handleSaveComment}
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white text-sm px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed min-h-[44px] w-full"
          >
            {isPending ? "جاري الحفظ..." : "حفظ إعجابات التعليق"}
          </button>
        </div>
      )}
    </div>
  );
}
