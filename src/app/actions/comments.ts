"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteComment(commentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify the user is the author and get post_id for count update
  const { data: comment } = await supabase
    .from("comments")
    .select("author_id, post_id")
    .eq("id", commentId)
    .single();

  if (!comment || comment.author_id !== user.id) {
    throw new Error("غير مصرح بحذف هذا التعليق");
  }

  // Delete child comments first (replies to this comment)
  const { data: childIds } = await supabase
    .from("comments")
    .select("id")
    .eq("parent_id", commentId);

  if (childIds && childIds.length > 0) {
    const ids = childIds.map((c: { id: string }) => c.id);
    await supabase.from("comment_likes").delete().in("comment_id", ids);
    await supabase.from("comments").delete().in("id", ids);
  }

  // Delete likes on this comment
  await supabase.from("comment_likes").delete().eq("comment_id", commentId);

  // Delete the comment
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (error) {
    console.error("deleteComment failed:", error);
    throw new Error("فشل حذف التعليق: " + error.message);
  }

  // Decrement comments_count on the post
  const deletedCount = 1 + (childIds?.length ?? 0);
  // Use direct update: subtract deleted count, never go below 0
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

  revalidatePath("/");
  return { success: true };
}

export async function createComment(
  postId: string,
  content: string,
  parentId: string | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Check auto-approve setting for comments
  const { data: settingsRow } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "moderation")
    .maybeSingle();

  const autoApprove =
    (settingsRow?.value as { auto_approve_comments?: boolean } | null)
      ?.auto_approve_comments ?? true;

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    author_id: user.id,
    content,
    parent_id: parentId,
    is_approved: autoApprove,
  });

  if (error) {
    console.error("createComment failed:", error);
    throw error;
  }

  // Increment comments_count on the post (never recounts, preserves admin-inflated values)
  await supabase.rpc("increment_post_comments", { p_post_id: postId });

  revalidatePath("/");
  return { success: true };
}
