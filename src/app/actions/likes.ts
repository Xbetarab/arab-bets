"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { requireUuid } from "@/lib/input-validation";

async function assertVisiblePost(client: Awaited<ReturnType<typeof createClient>>, postId: string) {
  const { data, error } = await client.from("posts").select("id").eq("id", postId).eq("is_approved", true).maybeSingle();
  if (error || !data) throw new Error("المنشور غير متاح");
}

export async function togglePostLike(postId: string) {
  postId = requireUuid(postId, "معرف المنشور");
  const userClient = await createClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await assertVisiblePost(userClient, postId);

  const adminClient = createAdminClient();

  // Check if already liked
  const { data: existing, error: lookupError } = await adminClient
    .from("likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("target_id", postId)
    .eq("target_type", "post")
    .maybeSingle();
  if (lookupError) throw new Error("تعذر التحقق من الإعجاب");

  if (existing) {
    // Unlike — decrement but never below 0
    const { data: deleted, error } = await adminClient.from("likes").delete().eq("id", existing.id).select("id");
    if (error) throw new Error("تعذر إزالة الإعجاب");
    if (deleted?.length) await adminClient.rpc("decrement_post_likes", { p_post_id: postId });
    revalidatePath("/");
    return { liked: false };
  } else {
    // Like — increment
    const { error } = await adminClient.from("likes").insert({
      user_id: user.id,
      target_id: postId,
      target_type: "post",
    });
    // A racing duplicate must not increment the counter after its insert fails.
    if (error) throw new Error("تعذر إضافة الإعجاب");
    await adminClient.rpc("increment_post_likes", { p_post_id: postId });
    revalidatePath("/");
    return { liked: true };
  }
}

export async function toggleCommentLike(commentId: string) {
  commentId = requireUuid(commentId, "معرف التعليق");
  const userClient = await createClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: comment, error: visibilityError } = await userClient
    .from("comments").select("id, post_id").eq("id", commentId).eq("is_approved", true).maybeSingle();
  if (visibilityError || !comment) throw new Error("التعليق غير متاح");
  await assertVisiblePost(userClient, comment.post_id);

  const adminClient = createAdminClient();

  const { data: existing, error: lookupError } = await adminClient
    .from("comment_likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("comment_id", commentId)
    .maybeSingle();
  if (lookupError) throw new Error("تعذر التحقق من الإعجاب");

  if (existing) {
    // Unlike — decrement but never below 0
    const { data: deleted, error } = await adminClient.from("comment_likes").delete().eq("id", existing.id).select("id");
    if (error) throw new Error("تعذر إزالة الإعجاب");
    if (deleted?.length) await adminClient.rpc("decrement_comment_likes", { p_comment_id: commentId });
    revalidatePath("/");
    return { liked: false };
  } else {
    // Like — increment
    const { error } = await adminClient.from("comment_likes").insert({
      user_id: user.id,
      comment_id: commentId,
    });
    if (error) throw new Error("تعذر إضافة الإعجاب");
    await adminClient.rpc("increment_comment_likes", { p_comment_id: commentId });
    revalidatePath("/");
    return { liked: true };
  }
}
