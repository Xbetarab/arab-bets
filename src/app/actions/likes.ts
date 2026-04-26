"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function togglePostLike(postId: string) {
  const userClient = await createClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const adminClient = createAdminClient();

  // Check if already liked
  const { data: existing } = await adminClient
    .from("likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("target_id", postId)
    .eq("target_type", "post")
    .maybeSingle();

  if (existing) {
    // Unlike — decrement but never below 0
    await adminClient.from("likes").delete().eq("id", existing.id);
    await adminClient.rpc("decrement_post_likes", { p_post_id: postId });
    revalidatePath("/");
    return { liked: false };
  } else {
    // Like — increment
    await adminClient.from("likes").insert({
      user_id: user.id,
      target_id: postId,
      target_type: "post",
    });
    await adminClient.rpc("increment_post_likes", { p_post_id: postId });
    revalidatePath("/");
    return { liked: true };
  }
}

export async function toggleCommentLike(commentId: string) {
  const userClient = await createClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const adminClient = createAdminClient();

  const { data: existing } = await adminClient
    .from("comment_likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("comment_id", commentId)
    .maybeSingle();

  if (existing) {
    // Unlike — decrement but never below 0
    await adminClient.from("comment_likes").delete().eq("id", existing.id);
    await adminClient.rpc("decrement_comment_likes", { p_comment_id: commentId });
    revalidatePath("/");
    return { liked: false };
  } else {
    // Like — increment
    await adminClient.from("comment_likes").insert({
      user_id: user.id,
      comment_id: commentId,
    });
    await adminClient.rpc("increment_comment_likes", { p_comment_id: commentId });
    revalidatePath("/");
    return { liked: true };
  }
}
