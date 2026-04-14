"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
