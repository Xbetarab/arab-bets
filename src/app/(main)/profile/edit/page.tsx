import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import EditProfileForm from "@/components/edit-profile-form";

export const metadata: Metadata = {
  title: "تعديل الملف الشخصي | arabtips",
};

export default async function EditProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/");

  // Fetch preset avatars
  const { data: presetAvatarFiles } = await supabase.storage
    .from("preset-avatars")
    .list("", { limit: 100, sortBy: { column: "name", order: "asc" } });

  const presetAvatars = (presetAvatarFiles ?? [])
    .filter((f) => f.name !== ".emptyFolderPlaceholder")
    .map((f) => {
      const { data } = supabase.storage
        .from("preset-avatars")
        .getPublicUrl(f.name);
      return data.publicUrl;
    });

  // Fetch preset covers
  const { data: presetCoverFiles } = await supabase.storage
    .from("preset-covers")
    .list("", { limit: 100, sortBy: { column: "name", order: "asc" } });

  const presetCovers = (presetCoverFiles ?? [])
    .filter((f) => f.name !== ".emptyFolderPlaceholder")
    .map((f) => {
      const { data } = supabase.storage
        .from("preset-covers")
        .getPublicUrl(f.name);
      return data.publicUrl;
    });

  return (
    <div dir="rtl" className="space-y-4">
      <h1 className="text-white text-lg font-bold">تعديل الملف الشخصي</h1>
      <EditProfileForm
        profile={{
          display_name: profile.display_name ?? "",
          avatar_url: profile.avatar_url ?? null,
          cover_url: profile.cover_url ?? null,
        }}
        presetAvatars={presetAvatars}
        presetCovers={presetCovers}
        userId={user.id}
      />
    </div>
  );
}
