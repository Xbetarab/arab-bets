-- Run against a disposable development database after x-sports-api.sql.
-- Imported data is server-only; browser roles must not read raw source IDs,
-- author/media URLs or links through the Supabase Data API.
begin;

do $$
declare
  table_name text;
  browser_role text;
  operation text;
begin
  foreach table_name in array array['x_sports_settings', 'x_sports_posts', 'x_sports_runs'] loop
    if not (select relrowsecurity from pg_class where oid = ('public.' || table_name)::regclass) then
      raise exception 'RLS is disabled on %', table_name;
    end if;
    foreach browser_role in array array['anon', 'authenticated'] loop
      foreach operation in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE'] loop
        if has_table_privilege(browser_role, 'public.' || table_name, operation) then
          raise exception '% has unsafe % on %', browser_role, operation, table_name;
        end if;
      end loop;
    end loop;
    if not has_table_privilege('service_role', 'public.' || table_name, 'SELECT') then
      raise exception 'Service worker cannot read %', table_name;
    end if;
  end loop;
  if (select enabled from public.x_sports_settings where id = 1) then
    raise exception 'Import should be disabled by default';
  end if;
end
$$;

rollback;
