import { createAdminClient } from "@/lib/supabase/admin";
import { sportsFeedEnabled } from "@/lib/x-sports/public-feed";

export const dynamic = "force-dynamic";

const ALLOWED_IMAGE_HOSTS = new Set(["pbs.twimg.com", "video.twimg.com"]);
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_IMAGE_BYTES = 2_000_000;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; kind: string }> },
) {
  if (!await sportsFeedEnabled()) return new Response(null, { status: 404 });
  const { id, kind } = await params;
  if (!/^\d{1,20}$/.test(id) || !/^(avatar|media-[0-3])$/.test(kind)) {
    return new Response(null, { status: 404 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("x_sports_posts")
    .select("author_avatar_url,media_json")
    .eq("x_id", id)
    .eq("is_visible", true)
    .is("deleted_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();
  if (error || !data) return new Response(null, { status: 404 });

  const source = kind === "avatar"
    ? data.author_avatar_url
    : (Array.isArray(data.media_json) ? data.media_json[Number(kind.slice(6))]?.url : null);
  if (typeof source !== "string") return new Response(null, { status: 404 });

  let url: URL;
  try {
    url = new URL(source);
  } catch {
    return new Response(null, { status: 404 });
  }
  const isDefaultAvatar = kind === "avatar" && url.hostname === "abs.twimg.com" &&
    url.pathname === "/sticky/default_profile_images/default_profile_normal.png" &&
    !url.search && !url.hash;
  if (url.protocol !== "https:" || (!ALLOWED_IMAGE_HOSTS.has(url.hostname) && !isDefaultAvatar) || url.port || url.username || url.password) {
    return new Response(null, { status: 404 });
  }

  try {
    const upstream = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
    const type = upstream.headers.get("content-type")?.split(";")[0]?.toLowerCase();
    const length = Number(upstream.headers.get("content-length") ?? 0);
    if (!upstream.ok || !type || !ALLOWED_IMAGE_TYPES.has(type) || length > MAX_IMAGE_BYTES) {
      return new Response(null, { status: 404 });
    }
    if (!upstream.body) return new Response(null, { status: 404 });
    const reader = upstream.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_IMAGE_BYTES) {
        await reader.cancel();
        return new Response(null, { status: 404 });
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return new Response(bytes.buffer, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
