"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

export async function trackPageView(data: {
  page_url: string;
  referrer?: string;
  user_agent?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}) {
  const userClient = await createClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();

  const sessionId = user ? null : `anon-${Date.now()}`;

  // Use admin client to bypass RLS — anonymous visitors can't insert via regular client
  const admin = createAdminClient();
  await admin.from("link_clicks").insert({
    target_url: data.page_url,
    link_type: "page_view",
    source_page: data.referrer || null,
    user_id: user?.id || null,
    session_id: sessionId,
    user_agent: data.user_agent || null,
    referrer: [data.utm_source, data.utm_medium, data.utm_campaign]
      .filter(Boolean)
      .join(" | ") || data.referrer || null,
  });
}
