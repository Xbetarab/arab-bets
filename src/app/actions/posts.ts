"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function deletePost(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify the user is the author
  const { data: post } = await supabase
    .from("posts")
    .select("author_id")
    .eq("id", postId)
    .single();

  if (!post || post.author_id !== user.id) {
    throw new Error("غير مصرح بحذف هذا المنشور");
  }

  // Delete related data first (likes, comment_likes, comments)
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

  // Delete the post itself
  const { error } = await supabase.from("posts").delete().eq("id", postId);

  if (error) {
    console.error("deletePost failed:", error);
    throw new Error("فشل حذف المنشور: " + error.message);
  }

  revalidatePath("/");
  return { success: true };
}

export async function createPost(
  content: string,
  sport: string | null,
  mediaUrls: string[] | null,
  tipData?: {
    match_home: string;
    match_away: string;
    league: string;
    match_date: string;
    prediction: string;
    prediction_type: string;
    odds: number;
    confidence: number;
  } | null
) {
  // Verify user is authenticated via their session
  const userClient = await createClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Use admin client for insert + settings read (bypasses RLS issues)
  const adminClient = createAdminClient();

  // Check auto-approve setting
  const { data: settingsRow } = await adminClient
    .from("app_settings")
    .select("value")
    .eq("key", "moderation")
    .maybeSingle();

  const autoApprove =
    (settingsRow?.value as { auto_approve_posts?: boolean } | null)
      ?.auto_approve_posts ?? true;

  const insertData: Record<string, unknown> = {
    author_id: user.id,
    content,
    media_urls: mediaUrls,
    sport: sport || null,
    is_approved: autoApprove,
  };

  if (tipData) {
    insertData.tip_data = {
      ...tipData,
      result: "pending",
      settled_at: null,
    };
  }

  const { data, error } = await adminClient
    .from("posts")
    .insert(insertData)
    .select("id")
    .single();

  if (error) {
    console.error("createPost failed:", error);
    throw new Error("فشل نشر المنشور: " + error.message);
  }

  revalidatePath("/");
  return { id: data.id, is_approved: autoApprove };
}

export async function settleTip(
  postId: string,
  result: "won" | "lost" | "void"
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify the user is the author
  const { data: post } = await supabase
    .from("posts")
    .select("author_id, tip_data")
    .eq("id", postId)
    .single();

  if (!post || post.author_id !== user.id) {
    throw new Error("غير مصرح بتعديل هذا التوقع");
  }

  if (!post.tip_data) {
    throw new Error("هذا المنشور ليس توقعاً");
  }

  const tipData = post.tip_data as Record<string, unknown>;
  tipData.result = result;
  tipData.settled_at = new Date().toISOString();

  const { error } = await supabase
    .from("posts")
    .update({ tip_data: tipData })
    .eq("id", postId);

  if (error) {
    console.error("settleTip failed:", error);
    throw new Error("فشل تحديد نتيجة التوقع: " + error.message);
  }

  revalidatePath("/");
  revalidatePath(`/post/${postId}`);
  return { success: true };
}
