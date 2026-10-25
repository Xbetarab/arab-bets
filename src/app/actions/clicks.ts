"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateLinkClickInput, validatePageViewInput } from "@/lib/input-validation";

export async function trackLinkClick(data: {
  target_url: string;
  link_type?: string;
  source_page?: string;
  user_agent?: string;
  referrer?: string;
}) {
  const validated = validateLinkClickInput(data);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Generate a simple session identifier from timestamp for anonymous users
  const sessionId = user ? null : `anon-${Date.now()}`;

  await supabase.from("link_clicks").insert({
    target_url: validated.target_url,
    link_type: validated.link_type,
    source_page: validated.source_page,
    user_id: user?.id || null,
    session_id: sessionId,
    user_agent: validated.user_agent,
    referrer: validated.referrer,
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
  const validated = validatePageViewInput(data);
  const userClient = await createClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();

  const sessionId = user ? null : `anon-${Date.now()}`;

  // Use admin client to bypass RLS — anonymous visitors can't insert via regular client
  const admin = createAdminClient();
  await admin.from("link_clicks").insert({
    target_url: validated.page_url,
    link_type: "page_view",
    source_page: validated.referrer,
    user_id: user?.id || null,
    session_id: sessionId,
    user_agent: validated.user_agent,
    referrer: [validated.utm_source, validated.utm_medium, validated.utm_campaign]
      .filter(Boolean)
      .join(" | ") || validated.referrer,
  });
}
