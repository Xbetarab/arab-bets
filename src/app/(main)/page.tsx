import { createClient } from "@/lib/supabase/server";
import Feed from "@/components/feed";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin = user?.email === "uomankotd@gmail.com";

  return <Feed userId={user?.id ?? null} isAdmin={isAdmin} />;
}
