"use server";

import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/supabase/types";

const PAGE_SIZE = 20;

export async function fetchFeedPage(
  cursor?: string,
  limit: number = PAGE_SIZE
): Promise<{ posts: Post[]; nextCursor: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("posts")
    .select("*, profiles:author_id(*)")
    .order("created_at", { ascending: false })
    .limit(limit + 1); // fetch one extra to check if there's a next page

  if (user) {
    query = query.or(`is_approved.eq.true,author_id.eq.${user.id}`);
  } else {
    query = query.eq("is_approved", true);
  }

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;

  if (error || !data) {
    return { posts: [], nextCursor: null };
  }

  const posts = data as unknown as Post[];
  const hasMore = posts.length > limit;
  const page = hasMore ? posts.slice(0, limit) : posts;
  const nextCursor = hasMore ? page[page.length - 1].created_at : null;

  return { posts: page, nextCursor };
}
