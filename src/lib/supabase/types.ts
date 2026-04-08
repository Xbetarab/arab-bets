export type Profile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
};

export type Post = {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  media_urls: string[] | null;
  sport: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profiles: Profile;
};

export const SPORTS = [
  { value: "football", label: "كرة قدم" },
  { value: "basketball", label: "سلة" },
  { value: "tennis", label: "تنس" },
  { value: "boxing", label: "ملاكمة" },
  { value: "mma", label: "فنون قتالية" },
  { value: "esports", label: "رياضات إلكترونية" },
  { value: "other", label: "أخرى" },
] as const;

export type Sport = (typeof SPORTS)[number]["value"];
