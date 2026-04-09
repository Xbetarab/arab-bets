import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/navbar";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("username, display_name, avatar_url")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar
        username={profile?.username ?? null}
        displayName={profile?.display_name ?? null}
        avatarUrl={profile?.avatar_url ?? null}
        isLoggedIn={!!user}
      />
      <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
