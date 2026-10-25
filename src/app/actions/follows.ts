"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { requireUuid } from "@/lib/input-validation";

export async function toggleFollow(
  targetUserId: string
): Promise<{ following: boolean }> {
  targetUserId = requireUuid(targetUserId, "معرف المستخدم");
  const userClient = await createClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  if (user.id === targetUserId) throw new Error("Cannot follow yourself");

  const { data: target, error: targetError } = await userClient
    .from("profiles").select("id").eq("id", targetUserId).maybeSingle();
  if (targetError || !target) throw new Error("المستخدم غير متاح");

  const adminClient = createAdminClient();

  // Check if already following
  const { data: existing, error: lookupError } = await adminClient
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId)
    .maybeSingle();
  if (lookupError) throw new Error("تعذر التحقق من المتابعة");

  if (existing) {
    // Unfollow
    const { data: deleted, error } = await adminClient.from("follows").delete().eq("id", existing.id).select("id");
    if (error) throw new Error("تعذر إلغاء المتابعة");
    if (deleted?.length) await adminClient.rpc("decrement_follow_counts", {
      p_follower_id: user.id,
      p_following_id: targetUserId,
    });
    revalidatePath("/");
    return { following: false };
  } else {
    // Follow
    const { error } = await adminClient.from("follows").insert({
      follower_id: user.id,
      following_id: targetUserId,
    });
    if (error) throw new Error("تعذر إضافة المتابعة");
    await adminClient.rpc("increment_follow_counts", {
      p_follower_id: user.id,
      p_following_id: targetUserId,
    });
    revalidatePath("/");
    return { following: true };
  }
}
