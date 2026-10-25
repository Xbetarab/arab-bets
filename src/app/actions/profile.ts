"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { validateProfileInput } from "@/lib/input-validation";

export async function updateProfile(data: {
  display_name: string;
  avatar_url: string | null;
  cover_url: string | null;
}) {
  const validated = validateProfileInput(data);
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update(validated)
    .eq("id", user.id);

  if (error) {
    console.error("updateProfile failed:", error);
    throw new Error("فشل تحديث الملف الشخصي");
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
