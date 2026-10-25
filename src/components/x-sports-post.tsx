"use client";

import { useEffect, useRef, useState } from "react";
import { formatRelativeTime } from "@/lib/format-time";
import { setImportedPostLike } from "@/app/actions/imported-likes";

export type XSportsPost = {
  x_id: string;
  conversation_id: string;
  in_reply_to_x_id: string | null;
  author_username: string;
  author_name: string;
  has_avatar: boolean;
  body: string;
  posted_at: string;
  media_count: number;
  likes_count?: number;
  is_liked?: boolean;
};

type ReplyNode = { post: XSportsPost; children: ReplyNode[] };

function replyTree(rootId: string, replies: XSportsPost[]): ReplyNode[] {
  const nodes = new Map<string, ReplyNode>();
  for (const reply of replies) {
    if (reply.x_id !== rootId && !nodes.has(reply.x_id)) {
      nodes.set(reply.x_id, { post: reply, children: [] });
    }
  }

  const roots: ReplyNode[] = [];
  for (const node of nodes.values()) {
    const parentId = node.post.in_reply_to_x_id;
    const parent = parentId ? nodes.get(parentId) : null;
    // Malformed parent chains must never recurse forever or hide a reply.
    let cursor = parentId;
    const seen = new Set<string>();
    while (cursor && nodes.has(cursor) && !seen.has(cursor)) {
      if (cursor === node.post.x_id) break;
      seen.add(cursor);
      cursor = nodes.get(cursor)?.post.in_reply_to_x_id ?? null;
    }
    if (parent && cursor !== node.post.x_id && !(cursor && seen.has(cursor))) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortTree = (nodesToSort: ReplyNode[]) => {
    nodesToSort.sort((a, b) => Date.parse(a.post.posted_at) - Date.parse(b.post.posted_at));
    for (const node of nodesToSort) sortTree(node.children);
  };
  sortTree(roots);
  return roots;
}

function Avatar({ post, small = false }: { post: XSportsPost; small?: boolean }) {
  const imagePath = `/api/sports-image/${post.x_id}/avatar`;
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const size = small ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  return post.has_avatar && failedImage !== imagePath ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imagePath}
      alt={post.author_name}
      className={`${size} shrink-0 rounded-full object-cover`}
      loading="lazy"
      onError={() => setFailedImage(imagePath)}
    />
  ) : (
    <div className={`${size} shrink-0 rounded-full bg-emerald-600/20 flex items-center justify-center text-emerald-400 font-bold`} aria-hidden="true">
      {post.author_name?.charAt(0) || "?"}
    </div>
  );
}

function Reply({ node, depth = 0 }: { node: ReplyNode; depth?: number }) {
  const { post } = node;
  return (
    <div className={depth > 0 ? "comment-thread" : ""}>
      <div className="flex gap-3 py-3">
        <Avatar post={post} small />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 text-sm">
            <span className="font-medium text-white">{post.author_name}</span>
            <span className="text-zinc-500" dir="ltr">@{post.author_username}</span>
            <time dateTime={post.posted_at} className="text-zinc-600">· {formatRelativeTime(post.posted_at)}</time>
          </div>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-300" dir="auto">{post.body}</p>
        </div>
      </div>
      {node.children.map((child) => <Reply key={child.post.x_id} node={child} depth={depth + 1} />)}
    </div>
  );
}

export default function ImportedPostCard({ post, replies = [], userId = null }: { post: XSportsPost; replies?: XSportsPost[]; userId?: string | null }) {
  const [showComments, setShowComments] = useState(false);
  const [liked, setLiked] = useState(Boolean(userId && post.is_liked));
  const [likesCount, setLikesCount] = useState(Math.max(0, post.likes_count ?? 0));
  const [likePending, setLikePending] = useState(false);
  const [likeError, setLikeError] = useState<string | null>(null);
  const likeInFlight = useRef(false);

  useEffect(() => {
    // Server refreshes can update counts without overwriting a pending click.
    if (likeInFlight.current) return;
    setLiked(Boolean(userId && post.is_liked));
    setLikesCount(Math.max(0, post.likes_count ?? 0));
    setLikeError(null);
  }, [post.x_id, post.is_liked, post.likes_count, userId]);

  async function handleLike() {
    if (!userId || likeInFlight.current) return;
    const previousLiked = liked;
    const previousCount = likesCount;
    const desiredLiked = !liked;
    likeInFlight.current = true;
    setLikePending(true);
    setLikeError(null);
    setLiked(desiredLiked);
    setLikesCount(Math.max(0, previousCount + (desiredLiked ? 1 : -1)));
    try {
      const result = await setImportedPostLike(post.x_id, desiredLiked);
      setLiked(result.liked);
      setLikesCount(Math.max(0, result.likesCount));
    } catch {
      setLiked(previousLiked);
      setLikesCount(previousCount);
      setLikeError("تعذّر تحديث الإعجاب. حاول مرة أخرى.");
    } finally {
      likeInFlight.current = false;
      setLikePending(false);
    }
  }

  const mediaCount = Math.min(Math.max(post.media_count, 0), 4);
  const visibleReplies = replies.filter((reply) => reply.conversation_id === post.x_id);
  const replyNodes = showComments ? replyTree(post.x_id, visibleReplies) : [];
  const commentsId = `sports-comments-${post.x_id}`;

  return (
    <article dir="rtl" className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Avatar post={post} />
        <div className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-white">{post.author_name}</span>
          <p className="text-xs text-zinc-500">
            <span dir="ltr">@{post.author_username}</span> &middot; <time dateTime={post.posted_at}>{formatRelativeTime(post.posted_at)}</time>
          </p>
        </div>
      </div>

      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-200" dir="auto">{post.body}</p>

      {mediaCount > 0 && (
        <div className={mediaCount > 1 ? "grid grid-cols-2 gap-2" : ""}>
          {Array.from({ length: mediaCount }, (_, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${post.x_id}-media-${index}`}
              src={`/api/sports-image/${post.x_id}/media-${index}`}
              alt="صورة المنشور"
              className="w-full rounded-lg max-h-96 object-cover"
              loading="lazy"
            />
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 border-t border-zinc-800/50 pt-3">
        <button
          type="button"
          onClick={handleLike}
          disabled={likePending || !userId}
          aria-label={liked ? "إلغاء الإعجاب" : "إعجاب"}
          aria-pressed={liked}
          aria-busy={likePending}
          title={!userId ? "سجّل الدخول للإعجاب بالمنشور" : undefined}
          className={`flex items-center gap-1.5 text-xs transition-colors cursor-pointer disabled:cursor-default min-h-[44px] min-w-[44px] justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg px-2 ${liked ? "text-red-400" : "text-zinc-500 hover:text-red-400"}`}
        >
          <svg className="w-5 h-5" fill={liked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
          </svg>
          <span>{likesCount}</span>
        </button>
        <button
          type="button"
          onClick={() => setShowComments((open) => !open)}
          aria-expanded={showComments}
          aria-controls={commentsId}
          className="flex items-center gap-1.5 text-zinc-500 hover:text-emerald-400 text-xs transition-colors cursor-pointer min-h-[44px] min-w-[44px] justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg px-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
          </svg>
          <span>{showComments ? "إخفاء التعليقات" : "عرض التعليقات"}</span>
          <span>({visibleReplies.length})</span>
        </button>
      </div>
      {likeError && <p role="alert" className="text-xs text-red-400">{likeError}</p>}
      {showComments && (
        <div id={commentsId} className="border-t border-zinc-800/50" aria-label="التعليقات">
          {replyNodes.map((node) => <Reply key={node.post.x_id} node={node} />)}
        </div>
      )}
    </article>
  );
}
