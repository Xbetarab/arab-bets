"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function togglePostLike(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Check if already liked
  const { data: existing } = await supabase
    .from("likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("target_id", postId)
    .eq("target_type", "post")
    .maybeSingle();

  if (existing) {
    await supabase.from("likes").delete().eq("id", existing.id);
  } else {
    await supabase.from("likes").insert({
      user_id: user.id,
      target_id: postId,
      target_type: "post",
    });
  }

  // Count actual likes and update the post's likes_count
  const { count } = await supabase
    .from("likes")
    .select("id", { count: "exact", head: true })
    .eq("target_id", postId)
    .eq("target_type", "post");

  await supabase
    .from("posts")
    .update({ likes_count: count ?? 0 })
    .eq("id", postId);

  revalidatePath("/");
  return { liked: !existing };
}

export async function toggleCommentLike(commentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: existing } = await supabase
    .from("comment_likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("comment_id", commentId)
    .maybeSingle();

  if (existing) {
    await supabase.from("comment_likes").delete().eq("id", existing.id);
  } else {
    await supabase.from("comment_likes").insert({
      user_id: user.id,
      comment_id: commentId,
    });
  }

  // Count actual likes and update the comment's likes_count
  const { count } = await supabase
    .from("comment_likes")
    .select("id", { count: "exact", head: true })
    .eq("comment_id", commentId);

  await supabase
    .from("comments")
    .update({ likes_count: count ?? 0 })
    .eq("id", commentId);

  revalidatePath("/");
  return { liked: !existing };
}
