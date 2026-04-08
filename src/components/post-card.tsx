import type { Post } from "@/lib/supabase/types";
import { SPORTS } from "@/lib/supabase/types";

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

function sportLabel(value: string | null): string | null {
  if (!value) return null;
  return SPORTS.find((s) => s.value === value)?.label ?? value;
}

export default function PostCard({ post }: { post: Post }) {
  const profile = post.profiles;
  const images = post.media_urls ?? [];

  return (
    <article
      dir="rtl"
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
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
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">
            {profile?.display_name || "مجهول"}
          </p>
          <p className="text-zinc-500 text-xs">
            @{profile?.username || "unknown"} &middot; {timeAgo(post.created_at)}
          </p>
        </div>
      </div>

      {/* Sport tag */}
      {post.sport && (
        <span className="inline-block bg-emerald-600/10 text-emerald-400 text-xs px-2.5 py-1 rounded-full border border-emerald-600/20">
          {sportLabel(post.sport)}
        </span>
      )}

      {/* Content */}
      {post.content && (
        <p className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
      )}

      {/* Media images */}
      {images.length > 0 && (
        <div className={images.length > 1 ? "grid grid-cols-2 gap-2" : ""}>
          {images.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt={`Post image ${i + 1}`}
              className="w-full rounded-lg max-h-96 object-cover"
              loading="lazy"
            />
          ))}
        </div>
      )}

      {/* Footer: likes + comments */}
      <div className="flex items-center gap-4 pt-1 border-t border-zinc-800/50">
        <button className="flex items-center gap-1.5 text-zinc-500 hover:text-red-400 transition-colors text-xs cursor-pointer">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
          </svg>
          <span>{post.likes_count ?? 0}</span>
        </button>
        <button className="flex items-center gap-1.5 text-zinc-500 hover:text-emerald-400 transition-colors text-xs cursor-pointer">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
          </svg>
          <span>{post.comments_count ?? 0}</span>
        </button>
      </div>
    </article>
  );
}
