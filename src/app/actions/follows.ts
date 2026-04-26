"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function toggleFollow(
  targetUserId: string
): Promise<{ following: boolean }> {
  const userClient = await createClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  if (user.id === targetUserId) throw new Error("Cannot follow yourself");

  const adminClient = createAdminClient();

  // Check if already following
  const { data: existing } = await adminClient
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId)
    .maybeSingle();

  if (existing) {
    // Unfollow
    await adminClient.from("follows").delete().eq("id", existing.id);
    await adminClient.rpc("decrement_follow_counts", {
      p_follower_id: user.id,
      p_following_id: targetUserId,
    });
    revalidatePath("/");
    return { following: false };
  } else {
    // Follow
    await adminClient.from("follows").insert({
      follower_id: user.id,
      following_id: targetUserId,
    });
    await adminClient.rpc("increment_follow_counts", {
      p_follower_id: user.id,
      p_following_id: targetUserId,
    });
    revalidatePath("/");
    return { following: true };
  }
}
