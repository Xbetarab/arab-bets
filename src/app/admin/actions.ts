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

  // Get the post_id before approving so we can increment comments_count
  const { data: comment } = await supabase
    .from("comments")
    .select("post_id")
    .eq("id", commentId)
    .single();

  await supabase
    .from("comments")
    .update({ is_approved: true })
    .eq("id", commentId);

  // Increment the post's visible comment count now that it's approved
  if (comment?.post_id) {
    await supabase.rpc("increment_post_comments", { p_post_id: comment.post_id });
  }

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

  // Humanize: set random creation date (2024-2025) and follower/following counts
  if (data) {
    const id = typeof data === "string" ? data : String(data);
    const startDate = new Date("2024-01-15T00:00:00Z").getTime();
    const endDate = new Date("2025-12-20T23:59:59Z").getTime();
    const randomDate = new Date(startDate + Math.random() * (endDate - startDate)).toISOString();

    await supabase
      .from("profiles")
      .update({
        created_at: randomDate,
        followers_count: Math.floor(Math.random() * 33),
        following_count: 15 + Math.floor(Math.random() * 39),
      })
      .eq("id", id);
  }

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

export async function adminEditPost(postId: string, content: string) {
  const supabase = await assertAdmin();
  const { error } = await supabase
    .from("posts")
    .update({ content })
    .eq("id", postId);
  if (error) {
    console.error("adminEditPost failed:", error);
    throw new Error("فشل تعديل المنشور: " + error.message);
  }
  revalidatePath("/");
  return { success: true };
}

export async function adminDeletePost(postId: string) {
  const supabase = await assertAdmin();

  // Delete related data first
  const { data: commentIds } = await supabase
    .from("comments")
    .select("id")
    .eq("post_id", postId);

  if (commentIds && commentIds.length > 0) {
    const ids = commentIds.map((c: { id: string }) => c.id);
    await supabase.from("comment_likes").delete().in("comment_id", ids);
  }

  await supabase.from("comments").delete().eq("post_id", postId);
  await supabase
    .from("likes")
    .delete()
    .eq("target_id", postId)
    .eq("target_type", "post");

  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) {
    console.error("adminDeletePost failed:", error);
    throw new Error("فشل حذف المنشور: " + error.message);
  }

  revalidatePath("/");
  return { success: true };
}

export async function adminEditComment(commentId: string, content: string) {
  const supabase = await assertAdmin();
  const { error } = await supabase
    .from("comments")
    .update({ content })
    .eq("id", commentId);
  if (error) {
    console.error("adminEditComment failed:", error);
    throw new Error("فشل تعديل التعليق: " + error.message);
  }
  revalidatePath("/");
  return { success: true };
}

export async function adminDeleteComment(commentId: string) {
  const supabase = await assertAdmin();

  // Get post_id for count update
  const { data: comment } = await supabase
    .from("comments")
    .select("post_id")
    .eq("id", commentId)
    .single();

  // Delete child comments first
  const { data: childIds } = await supabase
    .from("comments")
    .select("id")
    .eq("parent_id", commentId);

  if (childIds && childIds.length > 0) {
    const ids = childIds.map((c: { id: string }) => c.id);
    await supabase.from("comment_likes").delete().in("comment_id", ids);
    await supabase.from("comments").delete().in("id", ids);
  }

  await supabase.from("comment_likes").delete().eq("comment_id", commentId);
  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) {
    console.error("adminDeleteComment failed:", error);
    throw new Error("فشل حذف التعليق: " + error.message);
  }

  // Decrement comments_count
  if (comment) {
    const deletedCount = 1 + (childIds?.length ?? 0);
    const { data: currentPost } = await supabase
      .from("posts")
      .select("comments_count")
      .eq("id", comment.post_id)
      .single();
    if (currentPost) {
      const newCount = Math.max(0, (currentPost.comments_count ?? 0) - deletedCount);
      await supabase
        .from("posts")
        .update({ comments_count: newCount })
        .eq("id", comment.post_id);
    }
  }

  revalidatePath("/");
  return { success: true };
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
