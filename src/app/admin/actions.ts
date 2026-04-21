"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

/**
 * Verify the caller is the admin, then return the service-role client
 * that bypasses RLS. This is the ONLY way admin operations should run.
 */
async function assertAdmin() {
  const userClient = await createClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user || user.email !== "uomankotd@gmail.com") {
    throw new Error("Unauthorized");
  }
  return createAdminClient();
}

export async function approvePost(postId: string) {
  const supabase = await assertAdmin();
  await supabase.from("posts").update({ is_approved: true }).eq("id", postId);
  revalidatePath("/");
}

export async function rejectPost(postId: string) {
  const supabase = await assertAdmin();
  await supabase.from("posts").delete().eq("id", postId);
  revalidatePath("/");
}

export async function approveComment(commentId: string) {
  const supabase = await assertAdmin();
  await supabase
    .from("comments")
    .update({ is_approved: true })
    .eq("id", commentId);
  revalidatePath("/");
}

export async function rejectComment(commentId: string) {
  const supabase = await assertAdmin();
  await supabase.from("comments").delete().eq("id", commentId);
  revalidatePath("/");
}

export async function updateAutoApprove(
  postsAuto: boolean,
  commentsAuto: boolean
) {
  const supabase = await assertAdmin();
  const { error } = await supabase
    .from("app_settings")
    .update({
      value: {
        auto_approve_posts: postsAuto,
        auto_approve_comments: commentsAuto,
      },
    })
    .eq("key", "moderation");

  if (error) console.error("settings update failed:", error);

  // Re-fetch and confirm
  const { data: confirm } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "moderation")
    .maybeSingle();

  revalidatePath("/admin");
  return confirm?.value as { auto_approve_posts: boolean; auto_approve_comments: boolean } | null;
}

/* ------------------------------------------------------------------ */
/*  Moderation queue — fetches ALL pending content (bypasses RLS)      */
/* ------------------------------------------------------------------ */

export type PendingPost = {
  id: string;
  content: string;
  created_at: string;
  media_urls: string[] | null;
  sport: string | null;
  profiles: { username: string; display_name: string; avatar_url: string | null };
};

export type PendingComment = {
  id: string;
  content: string;
  created_at: string;
  post_id: string;
  parent_id: string | null;
  profiles: { username: string; display_name: string; avatar_url: string | null };
  post: { content: string } | null;
};

export async function fetchPendingContent() {
  const supabase = await assertAdmin();

  const [postsRes, commentsRes, settingsRes] = await Promise.all([
    supabase
      .from("posts")
      .select(
        "id, content, created_at, media_urls, sport, profiles:author_id(username, display_name, avatar_url)"
      )
      .eq("is_approved", false)
      .order("created_at", { ascending: false }),
    supabase
      .from("comments")
      .select(
        "id, content, created_at, post_id, parent_id, profiles:author_id(username, display_name, avatar_url), post:post_id(content)"
      )
      .eq("is_approved", false)
      .order("created_at", { ascending: false }),
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "moderation")
      .maybeSingle(),
  ]);

  if (postsRes.error) console.error("fetchPendingPosts error:", postsRes.error);
  if (commentsRes.error) console.error("fetchPendingComments error:", commentsRes.error);

  const settings = settingsRes.data?.value as {
    auto_approve_posts: boolean;
    auto_approve_comments: boolean;
  } | null;

  return {
    posts: (postsRes.data ?? []) as unknown as PendingPost[],
    comments: (commentsRes.data ?? []) as unknown as PendingComment[],
    settings: settings ?? { auto_approve_posts: true, auto_approve_comments: true },
  };
}

export async function createGhostProfile(
  username: string,
  displayName: string,
  avatarUrl?: string
) {
  const supabase = await assertAdmin();
  const { data, error } = await supabase.rpc("admin_create_ghost_profile", {
    p_username: username,
    p_display_name: displayName,
    p_avatar_url: avatarUrl || null,
  });
  if (error) throw error;
  return data;
}

export async function adminSetPostCounts(
  postId: string,
  likesCount: number,
  commentsCount: number
) {
  const supabase = await assertAdmin();
  const { error } = await supabase
    .from("posts")
    .update({ likes_count: likesCount, comments_count: commentsCount })
    .eq("id", postId);
  if (error) {
    console.error("adminSetPostCounts failed:", error);
    throw error;
  }
  revalidatePath("/");
}

export async function adminSetCommentLikes(
  commentId: string,
  likesCount: number
) {
  const supabase = await assertAdmin();
  const { error } = await supabase
    .from("comments")
    .update({ likes_count: likesCount })
    .eq("id", commentId);
  if (error) {
    console.error("adminSetCommentLikes failed:", error);
    throw error;
  }
  revalidatePath("/");
}

export async function createGhostComment(
  ghostProfileId: string,
  postId: string,
  content: string,
  parentId?: string,
  customTimestamp?: string
) {
  const supabase = await assertAdmin();
  const { data, error } = await supabase.rpc("admin_ghost_comment", {
    p_ghost_profile_id: ghostProfileId,
    p_post_id: postId,
    p_content: content,
    p_parent_id: parentId || null,
  });
  if (error) throw error;

  // If custom timestamp provided, update the comment's created_at
  if (customTimestamp && data) {
    const commentId = typeof data === "string" ? data : (data as { id?: string })?.id;
    if (commentId) {
      await supabase
        .from("comments")
        .update({ created_at: customTimestamp })
        .eq("id", commentId);
    }
  }

  revalidatePath("/");
  return data;
}

export async function adminSetFollowersCount(
  profileId: string,
  followersCount: number
) {
  const supabase = await assertAdmin();
  const { error } = await supabase
    .from("profiles")
    .update({ followers_count: followersCount })
    .eq("id", profileId);
  if (error) {
    console.error("adminSetFollowersCount failed:", error);
    throw error;
  }
  revalidatePath("/");
}

export async function adminCreatePost(
  content: string,
  sport: string | null,
  authorId: string,
  customTimestamp?: string
) {
  const supabase = await assertAdmin();
  const insertData: Record<string, unknown> = {
    content,
    sport: sport || null,
    author_id: authorId,
    is_approved: true,
  };
  if (customTimestamp) {
    insertData.created_at = customTimestamp;
  }
  const { data, error } = await supabase
    .from("posts")
    .insert(insertData)
    .select("id")
    .single();
  if (error) throw error;
  revalidatePath("/");
  return data;
}
