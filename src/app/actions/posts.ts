"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
