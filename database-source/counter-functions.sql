-- Read-only definition export from owner project on 2026-10-17. No data rows.
CREATE OR REPLACE FUNCTION public.decrement_comment_likes(p_comment_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
      BEGIN
        UPDATE comments SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = p_comment_id;
        END;
        $function$

CREATE OR REPLACE FUNCTION public.decrement_post_likes(p_post_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
  BEGIN
    UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = p_post_id;
    END;
    $function$

CREATE OR REPLACE FUNCTION public.handle_comment_like()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
                                                            begin
                                                              if tg_op = 'INSERT' then
                                                                  update public.comments set likes_count = likes_count + 1
                                                                        where id = new.comment_id;
                                                                          elsif tg_op = 'DELETE' then
                                                                              update public.comments set likes_count = greatest(likes_count - 1, 0)
                                                                                    where id = old.comment_id;
                                                                                      end if;
                                                                                        return coalesce(new, old);
                                                                                        end;
                                                                                        $function$

CREATE OR REPLACE FUNCTION public.handle_follow_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
                                                                                                                                                                                      begin
                                                                                                                                                                                        if tg_op = 'INSERT' then
                                                                                                                                                                                            update public.profiles
                                                                                                                                                                                                  set stats = jsonb_set(jsonb_set(stats, '{followers}',
                                                                                                                                                                                                          to_jsonb((stats->>'followers')::int + 1)), '{following}',
                                                                                                                                                                                                                  to_jsonb((stats->>'following')::int + 1))
                                                                                                                                                                                                                        where id = new.following_id;
                                                                                                                                                                                                                            update public.profiles
                                                                                                                                                                                                                                  set stats = jsonb_set(stats, '{following}',
                                                                                                                                                                                                                                          to_jsonb((stats->>'following')::int + 1))
                                                                                                                                                                                                                                                where id = new.follower_id;
                                                                                                                                                                                                                                                  elsif tg_op = 'DELETE' then
                                                                                                                                                                                                                                                      update public.profiles
                                                                                                                                                                                                                                                            set stats = jsonb_set(stats, '{followers}',
                                                                                                                                                                                                                                                                    to_jsonb(greatest((stats->>'followers')::int - 1, 0)))
                                                                                                                                                                                                                                                                          where id = old.following_id;
                                                                                                                                                                                                                                                                              update public.profiles
                                                                                                                                                                                                                                                                                    set stats = jsonb_set(stats, '{following}',
                                                                                                                                                                                                                                                                                            to_jsonb(greatest((stats->>'following')::int - 1, 0)))
                                                                                                                                                                                                                                                                                                  where id = old.follower_id;
                                                                                                                                                                                                                                                                                                    end if;
                                                                                                                                                                                                                                                                                                      return coalesce(new, old);
                                                                                                                                                                                                                                                                                                      end;
                                                                                                                                                                                                                                                                                                      $function$

CREATE OR REPLACE FUNCTION public.handle_post_like()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
                                                                                                                                              begin
                                                                                                                                                if tg_op = 'INSERT' and new.target_type = 'post' then
                                                                                                                                                    update public.posts set likes_count = likes_count + 1 where id = new.target_id;
                                                                                                                                                      elsif tg_op = 'DELETE' and old.target_type = 'post' then
                                                                                                                                                          update public.posts set likes_count = greatest(likes_count - 1, 0) where id = old.target_id;
                                                                                                                                                            end if;
                                                                                                                                                              return coalesce(new, old);
                                                                                                                                                              end;
                                                                                                                                                              $function$

CREATE OR REPLACE FUNCTION public.increment_comment_likes(p_comment_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
    BEGIN
      UPDATE comments SET likes_count = likes_count + 1 WHERE id = p_comment_id;
      END;
      $function$

CREATE OR REPLACE FUNCTION public.increment_post_likes(p_post_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE posts SET likes_count = likes_count + 1 WHERE id = p_post_id;
  END;
  $function$
