"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { readAutoApprove, requireText, requireUuid } from "@/lib/input-validation";

export async function deleteComment(commentId: string) {
  commentId = requireUuid(commentId, "معرّف التعليق");
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Not authenticated");

  // Verify ownership using the caller's RLS-bound client.
  const { data: comment, error: commentError } = await supabase
    .from("comments")
    .select("author_id")
    .eq("id", commentId)
    .single();

  if (commentError || !comment || comment.author_id !== user.id) {
    throw new Error("غير مصرح بحذف هذا التعليق");
  }

  // Replies and likes cascade. The existing count triggers need a privileged
  // client, created only after the authenticated ownership check above.
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("author_id", user.id)
    .select("id")
    .single();

  if (error) {
    console.error("deleteComment failed:", error);
    throw new Error("فشل حذف التعليق");
  }

  revalidatePath("/");
  return { success: true };
}

export async function createComment(
  postId: string,
  content: string,
  parentId: string | null
) {
  postId = requireUuid(postId, "معرّف المنشور");
  content = requireText(content, 2000, "محتوى التعليق");
  parentId = parentId == null ? null : requireUuid(parentId, "معرّف التعليق الأصلي");
  // Verify user is authenticated via their session
  const userClient = await createClient();
  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser();
  if (authError || !user) throw new Error("Not authenticated");

  // Service-role inserts bypass RLS, so establish visibility with the session
  // client first. Match the UI: approved content or the caller's own pending row.
  const { data: post, error: postError } = await userClient
    .from("posts")
    .select("id, author_id, is_approved")
    .eq("id", postId)
    .maybeSingle();
  if (postError || !post || post.id !== postId || (post.is_approved !== true && post.author_id !== user.id)) {
    throw new Error("المنشور غير متاح للتعليق");
  }

  if (parentId) {
    const { data: parent, error: parentError } = await userClient
      .from("comments")
      .select("id, post_id, author_id, is_approved")
      .eq("id", parentId)
      .eq("post_id", postId)
      .maybeSingle();
    if (parentError || !parent || parent.post_id !== postId || (parent.is_approved !== true && parent.author_id !== user.id)) {
      throw new Error("التعليق الأصلي غير متاح في هذا المنشور");
    }
  }

  // Use admin client for insert + settings read (bypasses RLS issues)
  const adminClient = createAdminClient();

  // Check auto-approve setting for comments
  const { data: settingsRow, error: settingsError } = await adminClient
    .from("app_settings")
    .select("value")
    .eq("key", "moderation")
    .maybeSingle();

  if (settingsError) throw new Error("تعذر التحقق من إعدادات المراجعة، حاول لاحقاً");
  const autoApprove = readAutoApprove(settingsRow?.value, "auto_approve_comments");

  const { error } = await adminClient.from("comments").insert({
    post_id: postId,
    author_id: user.id,
    content,
    parent_id: parentId,
    is_approved: autoApprove,
  });

  if (error) {
    console.error("createComment failed:", error);
    throw new Error("فشل نشر التعليق");
  }
  // The existing database INSERT trigger maintains the counter once.

  revalidatePath("/");
  return { success: true };
}
