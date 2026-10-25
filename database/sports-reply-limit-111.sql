-- The TwitterAPI importer and public feed accept up to 111 genuine replies.
ALTER TABLE public.x_sports_settings
  DROP CONSTRAINT x_sports_settings_max_replies_per_post_check;
ALTER TABLE public.x_sports_settings
  ADD CONSTRAINT x_sports_settings_max_replies_per_post_check
  CHECK (max_replies_per_post BETWEEN 0 AND 111);
