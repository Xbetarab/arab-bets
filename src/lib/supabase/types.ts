export type Profile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
};

export type Post = {
  id: string;
  author_id: string;
  content: string;
  media_urls: string[] | null;
  sport: string | null;
  likes_count: number;
  comments_count: number;
  is_approved: boolean;
  created_at: string;
  profiles: Profile;
};

export type Comment = {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  likes_count: number;
  is_approved: boolean;
  created_at: string;
  profiles: Pick<Profile, "username" | "display_name" | "avatar_url">;
  children?: Comment[];
  user_has_liked?: boolean;
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
