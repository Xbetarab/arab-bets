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
  created_at: string;
  profiles: Profile;
};
