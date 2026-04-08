"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// ---------- Types ----------
export type SignUpState = {
  error?: string;
  fieldErrors?: {
    username?: string;
    email?: string;
    password?: string;
    display_name?: string;
  };
  success?: boolean;
};

export type LoginState = {
  error?: string;
  fieldErrors?: {
    email?: string;
    password?: string;
  };
};

// ---------- Username validation ----------
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export async function checkUsername(
  username: string
): Promise<{ available: boolean; error?: string }> {
  if (!USERNAME_REGEX.test(username)) {
    return {
      available: false,
      error: "اسم المستخدم يجب أن يكون 3-20 حرف (أحرف إنجليزية، أرقام، _)",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username.toLowerCase())
    .maybeSingle();

  if (error) {
    return { available: false, error: "حدث خطأ أثناء التحقق" };
  }

  return {
    available: data === null,
    error: data ? "اسم المستخدم مستخدم بالفعل" : undefined,
  };
}

// ---------- Sign Up ----------
export async function signUp(
  _prevState: SignUpState,
  formData: FormData
): Promise<SignUpState> {
  const username = (formData.get("username") as string)?.trim().toLowerCase();
  const displayName = (formData.get("display_name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  // ---- Validation ----
  const fieldErrors: SignUpState["fieldErrors"] = {};

  if (!username || !USERNAME_REGEX.test(username)) {
    fieldErrors.username =
      "اسم المستخدم يجب أن يكون 3-20 حرف (أحرف إنجليزية، أرقام، _)";
  }
  if (!displayName || displayName.length < 2) {
    fieldErrors.display_name = "الاسم المعروض مطلوب (حرفين على الأقل)";
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "البريد الإلكتروني غير صالح";
  }
  if (!password || password.length < 8) {
    fieldErrors.password = "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  // ---- Check username uniqueness (server-side double check) ----
  const { available } = await checkUsername(username);
  if (!available) {
    return { fieldErrors: { username: "اسم المستخدم مستخدم بالفعل" } };
  }

  // ---- Supabase Auth sign up ----
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        display_name: displayName,
      },
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { fieldErrors: { email: "البريد الإلكتروني مسجل بالفعل" } };
    }
    return { error: error.message };
  }

  // The trigger `on_auth_user_created` will auto-create the profile row
  // with the username and display_name from raw_user_meta_data

  redirect("/auth/verify-email");
}

// ---------- Login ----------
export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  const fieldErrors: LoginState["fieldErrors"] = {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "البريد الإلكتروني غير صالح";
  }
  if (!password) {
    fieldErrors.password = "كلمة المرور مطلوبة";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
  }

  redirect("/");
}

// ---------- Logout ----------
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
