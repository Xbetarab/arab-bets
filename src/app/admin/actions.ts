"use server";

import { createClient } from "@/lib/supabase/server";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email !== "uomankotd@gmail.com") {
    throw new Error("Unauthorized");
  }
  return supabase;
}

export async function approvePost(postId: string) {
  const supabase = await assertAdmin();
  await supabase.from("posts").update({ is_approved: true }).eq("id", postId);
}

export async function rejectPost(postId: string) {
  const supabase = await assertAdmin();
  await supabase.from("posts").delete().eq("id", postId);
}

export async function approveComment(commentId: string) {
  const supabase = await assertAdmin();
  await supabase
    .from("comments")
    .update({ is_approved: true })
    .eq("id", commentId);
}

export async function rejectComment(commentId: string) {
  const supabase = await assertAdmin();
  await supabase.from("comments").delete().eq("id", commentId);
}

export async function updateAutoApprove(
  postsAuto: boolean,
  commentsAuto: boolean
) {
  const supabase = await assertAdmin();
  await supabase
    .from("app_settings")
    .update({
      value: {
        auto_approve_posts: postsAuto,
        auto_approve_comments: commentsAuto,
      },
    })
    .eq("key", "moderation");
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

export async function createGhostComment(
  ghostProfileId: string,
  postId: string,
  content: string,
  parentId?: string
) {
  const supabase = await assertAdmin();
  const { data, error } = await supabase.rpc("admin_ghost_comment", {
    p_ghost_profile_id: ghostProfileId,
    p_post_id: postId,
    p_content: content,
    p_parent_id: parentId || null,
  });
  if (error) throw error;
  return data;
}
