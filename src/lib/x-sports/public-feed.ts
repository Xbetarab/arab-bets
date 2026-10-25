import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { cleanReplyText, isCleanArabicSportsRow } from "@/lib/x-sports/twitterapi-curation.mjs";

const FIELDS = "x_id,conversation_id,in_reply_to_x_id,author_username,author_name,author_avatar_url,body,language,posted_at,media_json,links_json";
const MINIMUM_REPLIES = 20;
const MAXIMUM_REPLIES = 111;
const REPLY_PAGE_SIZE = 150;
const MAX_REPLY_PAGES = 3;

export async function sportsFeedEnabled() {
  if (process.env.X_IMPORT_ENABLED !== "true") return false;
  const { data, error } = await createAdminClient()
    .from("x_sports_settings").select("enabled").eq("id", 1).single();
  if (error) throw error;
  return data?.enabled === true;
}

// Keep two daily batches available for the existing 48-hour retention period.
// Reply queries are independently bounded per conversation: a busy thread must
// not consume a global result limit and hide the comments on later posts.
export async function getSportsFeed(rootLimit = 20, userId: string | null = null) {
  const limit = Number.isFinite(rootLimit) ? Math.min(20, Math.max(0, Math.floor(rootLimit))) : 0;
  if (!limit) return { roots: [], replies: [] };
  const now = new Date().toISOString();
  const db = createAdminClient();
  const { data, error } = await db
    .from("x_sports_posts")
    .select(FIELDS)
    .eq("is_visible", true)
    .is("deleted_at", null)
    .gt("expires_at", now)
    .eq("language", "ar")
    .is("in_reply_to_x_id", null)
    .order("posted_at", { ascending: false })
    .limit(limit * 3);
  if (error) throw error;
  const seenRoots = new Set<string>();
  const candidates = (data ?? []).filter((root) => {
    if (seenRoots.has(root.x_id) || root.conversation_id !== root.x_id ||
        !isCleanArabicSportsRow(root, { requireNews: true })) return false;
    seenRoots.add(root.x_id);
    return true;
  });
  const conversations = [];
  for (let offset = 0; offset < candidates.length && conversations.length < limit; offset += 5) {
    const batch = await Promise.all(candidates.slice(offset, offset + 5).map(async (root) => {
      const seen = new Set<string>();
      const replies: NonNullable<typeof data> = [];
      for (let page = 0; page < MAX_REPLY_PAGES && replies.length < MAXIMUM_REPLIES; page++) {
        const { data: rows, error: replyError } = await db.from("x_sports_posts")
          .select(FIELDS)
          .eq("is_visible", true)
          .is("deleted_at", null)
          .gt("expires_at", now)
          .eq("language", "ar")
          .eq("in_reply_to_x_id", root.x_id)
          .order("posted_at", { ascending: true })
          .order("x_id", { ascending: true })
          .range(page * REPLY_PAGE_SIZE, (page + 1) * REPLY_PAGE_SIZE - 1);
        if (replyError) throw replyError;
        for (const reply of rows ?? []) {
          const displayReply = { ...reply, body: cleanReplyText(reply.body) };
          if (reply.in_reply_to_x_id !== root.x_id || reply.conversation_id !== root.x_id ||
              seen.has(reply.x_id) || !isCleanArabicSportsRow(displayReply)) continue;
          seen.add(reply.x_id);
          replies.push(displayReply);
          if (replies.length === MAXIMUM_REPLIES) break;
        }
        if ((rows?.length ?? 0) < REPLY_PAGE_SIZE) break;
      }
      // A root is visible only with its complete, filtered conversation. This
      // also hides old five-reply imports without modifying any native posts.
      return replies.length >= MINIMUM_REPLIES ? { root, replies } : null;
    }));
    for (const conversation of batch) {
      if (conversation && conversations.length < limit) conversations.push(conversation);
    }
  }
  if (!conversations.length) return { roots: [], replies: [] };
  // Read only the public counts and the current viewer's state in one batch.
  // The underlying per-user likes remain private to the server.
  const { data: likes, error: likesError } = await db.rpc("get_x_sports_post_likes", {
    p_post_ids: conversations.map(({ root }) => root.x_id),
    p_user_id: userId,
  });
  if (likesError) throw likesError;
  const likesById = new Map<string, { likes_count: number; is_liked: boolean }>(
    (likes ?? []).map((row: { post_id: string; likes_count: number; is_liked: boolean }) => [row.post_id, row]),
  );
  return {
    roots: conversations.map(({ root }) => {
      const state = likesById.get(root.x_id);
      if (!state || !Number.isSafeInteger(state.likes_count) || state.likes_count < 124 ||
          typeof state.is_liked !== "boolean") throw new Error("Sports like counts unavailable");
      return { ...root, likes_count: state.likes_count, is_liked: state.is_liked };
    }),
    replies: conversations.flatMap(({ replies }) => replies),
  };
}
