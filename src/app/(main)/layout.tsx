import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/navbar";
import { redirect } from "next/navigation";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar
        username={profile?.username ?? "user"}
        displayName={profile?.display_name ?? "مستخدم"}
        avatarUrl={profile?.avatar_url ?? null}
      />
      <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
