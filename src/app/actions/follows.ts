"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleFollow(
  targetUserId: string
): Promise<{ following: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  if (user.id === targetUserId) throw new Error("Cannot follow yourself");

  // Check if already following
  const { data: existing } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId)
    .maybeSingle();

  if (existing) {
    // Unfollow
    await supabase.from("follows").delete().eq("id", existing.id);
    await supabase.rpc("decrement_follow_counts", {
      p_follower_id: user.id,
      p_following_id: targetUserId,
    });
    revalidatePath("/");
    return { following: false };
  } else {
    // Follow
    await supabase.from("follows").insert({
      follower_id: user.id,
      following_id: targetUserId,
    });
    await supabase.rpc("increment_follow_counts", {
      p_follower_id: user.id,
      p_following_id: targetUserId,
    });
    revalidatePath("/");
    return { following: true };
  }
}
