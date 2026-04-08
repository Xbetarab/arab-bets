import type { Post } from "@/lib/supabase/types";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return "الآن";
  if (diff < 3600) return `${Math.floor(diff / 60)} د`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} س`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ي`;
  return new Date(dateStr).toLocaleDateString("ar-SA");
}

export default function PostCard({ post }: { post: Post }) {
  const profile = post.profiles;

  return (
    <article
      dir="rtl"
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-600/20 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">
          {profile?.display_name?.charAt(0) || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">
            {profile?.display_name || "مجهول"}
          </p>
          <p className="text-zinc-500 text-xs">
            @{profile?.username || "unknown"} &middot; {timeAgo(post.created_at)}
          </p>
        </div>
      </div>

      {/* Content */}
      {post.content && (
        <p className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
      )}

      {/* Image */}
      {post.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.image_url}
          alt="Post image"
          className="w-full rounded-lg max-h-96 object-cover"
          loading="lazy"
        />
      )}
    </article>
  );
}
