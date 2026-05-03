"use client";

import { useEffect } from "react";
import { trackPageView } from "@/app/actions/clicks";

export default function PageViewTracker() {
  useEffect(() => {
    const key = "__arabtips_pv";
    if (typeof window === "undefined") return;

    // Track once per browser session (sessionStorage resets on tab close)
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    const params = new URLSearchParams(window.location.search);

    trackPageView({
      page_url: window.location.pathname,
      referrer: document.referrer || undefined,
      user_agent: navigator.userAgent,
      utm_source: params.get("utm_source") || undefined,
      utm_medium: params.get("utm_medium") || undefined,
      utm_campaign: params.get("utm_campaign") || undefined,
    }).catch(() => {
      // Silently fail — analytics should never break UX
    });
  }, []);

  return null;
}
