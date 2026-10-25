"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function setImportedPostLike(
  postId: string,
  liked: boolean
): Promise<{ liked: boolean; likesCount: number }> {
  if (typeof postId !== "string" || !/^[0-9]{1,25}$/.test(postId) || typeof liked !== "boolean") {
    throw new Error("طلب الإعجاب غير صالح");
  }
  const userClient = await createClient();
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) throw new Error("يجب تسجيل الدخول للإعجاب بالمنشور");

  // Identity always comes from the verified session. The atomic RPC rechecks
  // root visibility/expiry and applies the requested state idempotently.
  const adminClient = createAdminClient();
  const { data, error } = await adminClient.rpc("set_x_sports_post_like", {
    p_post_id: postId,
    p_user_id: user.id,
    p_liked: liked,
  });
  if (error) {
    if (error.message?.includes("X_SPORTS_POST_UNAVAILABLE")) throw new Error("المنشور غير متاح");
    throw new Error("تعذر تحديث الإعجاب، حاول مرة أخرى");
  }
  if (!data || typeof data.liked !== "boolean" || !Number.isSafeInteger(data.likesCount) || data.likesCount < 124) {
    throw new Error("تعذر التحقق من حالة الإعجاب");
  }
  revalidatePath("/");
  return { liked: data.liked, likesCount: data.likesCount };
}
