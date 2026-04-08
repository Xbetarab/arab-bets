import { createClient } from "@/lib/supabase/server";
import Feed from "@/components/feed";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return <Feed userId={user.id} />;
}
