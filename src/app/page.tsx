import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/navbar";
import Feed from "@/components/feed";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar
        username={profile?.username ?? "user"}
        displayName={profile?.display_name ?? "مستخدم"}
      />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <Feed userId={user.id} />
      </main>
    </div>
  );
}
