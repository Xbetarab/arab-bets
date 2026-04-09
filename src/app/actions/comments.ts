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

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    author_id: user.id,
    content,
    parent_id: parentId,
    is_approved: true,
  });

  if (error) {
    console.error("createComment failed:", error);
    throw error;
  }

  // Increment comments_count on the post
  const { data: post } = await supabase
    .from("posts")
    .select("comments_count")
    .eq("id", postId)
    .single();
  const newCount = (post?.comments_count ?? 0) + 1;
  await supabase.from("posts").update({ comments_count: newCount }).eq("id", postId);

  revalidatePath("/");
  return { success: true };
}
