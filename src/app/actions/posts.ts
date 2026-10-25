"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { readAutoApprove, requireRecord, requireTipResult, requireUuid, validatePostInput } from "@/lib/input-validation";

export async function deletePost(postId: string) {
  postId = requireUuid(postId, "معرّف المنشور");
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Not authenticated");

  // Verify the user is the author
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("author_id")
    .eq("id", postId)
    .single();

  if (postError || !post || post.author_id !== user.id) {
    throw new Error("غير مصرح بحذف هذا المنشور");
  }

  // Ownership is verified before creating the privileged client. Existing
  // cascade triggers need permission to update protected counters/statistics.
  const adminClient = createAdminClient();
  const { error: likesError } = await adminClient
    .from("likes")
    .delete()
    .eq("target_id", postId)
    .eq("target_type", "post");
  if (likesError) throw new Error("فشل حذف المنشور");

  // Comments, replies, comment likes and bookmarks are removed by FK cascades.
  const { error } = await adminClient.from("posts").delete()
    .eq("id", postId).eq("author_id", user.id).select("id").single();

  if (error) {
    console.error("deletePost failed:", error);
    throw new Error("فشل حذف المنشور");
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
  const validated = validatePostInput(content, sport, mediaUrls, tipData);
  // Verify user is authenticated via their session
  const userClient = await createClient();
  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser();
  if (authError || !user) throw new Error("Not authenticated");

  // Use admin client for insert + settings read (bypasses RLS issues)
  const adminClient = createAdminClient();

  // Check auto-approve setting
  const { data: settingsRow, error: settingsError } = await adminClient
    .from("app_settings")
    .select("value")
    .eq("key", "moderation")
    .maybeSingle();

  if (settingsError) throw new Error("تعذر التحقق من إعدادات المراجعة، حاول لاحقاً");
  const autoApprove = readAutoApprove(settingsRow?.value, "auto_approve_posts");

  const insertData: Record<string, unknown> = {
    author_id: user.id,
    content: validated.content,
    media_urls: validated.media_urls,
    sport: validated.sport,
    is_approved: autoApprove,
  };

  if (validated.tip_data) insertData.tip_data = validated.tip_data;

  const { data, error } = await adminClient
    .from("posts")
    .insert(insertData)
    .select("id")
    .single();

  if (error) {
    console.error("createPost failed:", error);
    throw new Error("فشل نشر المنشور");
  }

  revalidatePath("/");
  return { id: data.id, is_approved: autoApprove };
}

export async function settleTip(
  postId: string,
  result: "won" | "lost" | "void"
) {
  postId = requireUuid(postId, "معرّف المنشور");
  result = requireTipResult(result);
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Not authenticated");

  // Verify the user is the author
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("author_id, tip_data")
    .eq("id", postId)
    .single();

  if (postError || !post || post.author_id !== user.id) {
    throw new Error("غير مصرح بتعديل هذا التوقع");
  }

  if (!post.tip_data) {
    throw new Error("هذا المنشور ليس توقعاً");
  }

  const tipData = {
    ...requireRecord(post.tip_data, "بيانات التوقع"),
    result,
    settled_at: new Date().toISOString(),
  };

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("posts")
    .update({ tip_data: tipData })
    .eq("id", postId)
    .eq("author_id", user.id)
    .select("id")
    .single();

  if (error) {
    console.error("settleTip failed:", error);
    throw new Error("فشل تحديد نتيجة التوقع");
  }

  revalidatePath("/");
  revalidatePath(`/post/${postId}`);
  return { success: true };
}
