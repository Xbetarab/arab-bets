import type { MetadataRoute } from "next";
import { GUIDES } from "@/lib/guides";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

async function approvedPosts(): Promise<MetadataRoute.Sitemap> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("your-supabase")) return [];

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(url, key);
    const { data, error } = await supabase
      .from("posts")
      .select("id, created_at")
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(5000);

    if (error || !data) return [];

    return data.flatMap((post) => {
      if (!post.id || !post.created_at) return [];
      return [
        {
          url: `${SITE_URL}/post/${post.id}`,
          lastModified: post.created_at,
          changeFrequency: "weekly" as const,
          priority: 0.5,
        },
      ];
    });
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const guides: MetadataRoute.Sitemap = Object.values(GUIDES).map((guide) => ({
    url: `${SITE_URL}${guide.path}`,
    lastModified: guide.modified,
    changeFrequency: guide.changeFrequency,
    priority: guide.priority,
  }));

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: "2026-10-25",
      changeFrequency: "daily",
      priority: 1,
    },
    ...guides,
    {
      url: `${SITE_URL}/about`,
      lastModified: "2026-07-06",
      changeFrequency: "monthly",
      priority: 0.4,
    },
    ...(await approvedPosts()),
  ];
}
