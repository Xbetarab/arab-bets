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
    // Decrement likes_count on the post
    const { data: post } = await supabase
      .from("posts")
      .select("likes_count")
      .eq("id", postId)
      .single();
    const newCount = Math.max(0, (post?.likes_count ?? 1) - 1);
    await supabase.from("posts").update({ likes_count: newCount }).eq("id", postId);
    revalidatePath("/");
    return { liked: false };
  } else {
    await supabase.from("likes").insert({
      user_id: user.id,
      target_id: postId,
      target_type: "post",
    });
    // Increment likes_count on the post
    const { data: post } = await supabase
      .from("posts")
      .select("likes_count")
      .eq("id", postId)
      .single();
    const newCount = (post?.likes_count ?? 0) + 1;
    await supabase.from("posts").update({ likes_count: newCount }).eq("id", postId);
    revalidatePath("/");
    return { liked: true };
  }
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
    // Decrement likes_count on the comment
    const { data: comment } = await supabase
      .from("comments")
      .select("likes_count")
      .eq("id", commentId)
      .single();
    const newCount = Math.max(0, (comment?.likes_count ?? 1) - 1);
    await supabase.from("comments").update({ likes_count: newCount }).eq("id", commentId);
    revalidatePath("/");
    return { liked: false };
  } else {
    await supabase.from("comment_likes").insert({
      user_id: user.id,
      comment_id: commentId,
    });
    // Increment likes_count on the comment
    const { data: comment } = await supabase
      .from("comments")
      .select("likes_count")
      .eq("id", commentId)
      .single();
    const newCount = (comment?.likes_count ?? 0) + 1;
    await supabase.from("comments").update({ likes_count: newCount }).eq("id", commentId);
    revalidatePath("/");
    return { liked: true };
  }
}
