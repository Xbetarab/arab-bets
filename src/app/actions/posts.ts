"use server";

import { createClient } from "@/lib/supabase/server";
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
  mediaUrls: string[] | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Check auto-approve setting
  const { data: settingsRow } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "moderation")
    .maybeSingle();

  const autoApprove =
    (settingsRow?.value as { auto_approve_posts?: boolean } | null)
      ?.auto_approve_posts ?? true;

  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      content,
      media_urls: mediaUrls,
      sport: sport || null,
      is_approved: autoApprove,
    })
    .select("id")
    .single();

  if (error) {
    console.error("createPost failed:", error);
    throw new Error("فشل نشر المنشور: " + error.message);
  }

  revalidatePath("/");
  return { id: data.id, is_approved: autoApprove };
}
