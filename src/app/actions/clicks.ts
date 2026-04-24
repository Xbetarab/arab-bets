"use server";

import { createClient } from "@/lib/supabase/server";

export async function trackLinkClick(data: {
  target_url: string;
  link_type?: string;
  source_page?: string;
  user_agent?: string;
  referrer?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Generate a simple session identifier from timestamp for anonymous users
  const sessionId = user ? null : `anon-${Date.now()}`;

  await supabase.from("link_clicks").insert({
    target_url: data.target_url,
    link_type: data.link_type || null,
    source_page: data.source_page || null,
    user_id: user?.id || null,
    session_id: sessionId,
    user_agent: data.user_agent || null,
    referrer: data.referrer || null,
  });
}
