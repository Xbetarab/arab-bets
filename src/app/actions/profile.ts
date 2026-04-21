"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(data: {
  display_name: string;
  bio: string;
  avatar_url: string | null;
  cover_url: string | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: data.display_name,
      bio: data.bio || null,
      avatar_url: data.avatar_url,
      cover_url: data.cover_url,
    })
    .eq("id", user.id);

  if (error) {
    console.error("updateProfile failed:", error);
    throw new Error("فشل تحديث الملف الشخصي: " + error.message);
  }

  // Get username to revalidate profile page
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  revalidatePath("/");
  if (profile?.username) {
    revalidatePath(`/profile/${profile.username}`);
  }
  revalidatePath("/profile/edit");

  return { success: true };
}
