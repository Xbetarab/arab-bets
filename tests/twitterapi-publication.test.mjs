import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

// Optional local PostgreSQL/WASM runtime; this test never connects to a server.
// TWITTERAPI_PGLITE_PATH=/absolute/path/to/dist/index.js node --test ...
test('publication SQL is atomic, bounded, idempotent and private', {skip:!process.env.TWITTERAPI_PGLITE_PATH}, async()=>{
  const {PGlite}=await import(pathToFileURL(process.env.TWITTERAPI_PGLITE_PATH).href);
  const db=new PGlite();
  try {
    await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
    await db.exec(await fs.readFile(new URL('../database/x-sports-api.sql',import.meta.url),'utf8'));
    await db.exec(await fs.readFile(new URL('../database/twitterapi-sports.sql',import.meta.url),'utf8'));
    await db.exec(await fs.readFile(new URL('../database/twitterapi-sports-publication.sql',import.meta.url),'utf8'));
    await db.exec('update public.x_sports_settings set enabled=true where id=1');
    const now=Date.now();const day=new Date(now).toISOString().slice(0,10);
    const row=(rootId,number)=>({x_id:number?`${rootId}${String(number).padStart(4,'0')}`:rootId,conversation_id:rootId,in_reply_to_x_id:number?rootId:null,
      author_x_id:'777',author_username:'sports',author_name:'أخبار الرياضة',author_avatar_url:'https://pbs.twimg.com/a.jpg',
      body:'برشلونة يحقق الفوز في الدوري بعد أداء مميز',language:'ar',media_json:[],links_json:[],
      posted_at:new Date(now-(number?30:60)*60000).toISOString(),expires_at:new Date(now+48*3600000).toISOString(),
      is_visible:true,deleted_at:null,matched_query:'twitterapi:news:test'});
    const group=id=>[row(id,0),...Array.from({length:20},(_,i)=>row(id,i+1))];
    const rows=group('1001');
    const publish=(data,status='partial',date=day)=>db.query('select public.publish_twitterapi_sports_batch($1::date,$2::jsonb,$3::text) result',[date,JSON.stringify(data),status]);
    const count=async table=>Number((await db.query(`select count(*) n from public.${table}`)).rows[0].n);
    // Inject the exact former failure window: metadata write fails after the
    // content insertion. PostgreSQL must roll back both changes.
    await db.exec("create function public.reject_batch_test() returns trigger language plpgsql as $$ begin raise exception 'injected metadata failure'; end $$; create trigger reject_batch_test before insert or update on public.twitterapi_sports_batches for each row execute function public.reject_batch_test();");
    await assert.rejects(publish(rows),/injected metadata failure/);
    assert.equal(await count('x_sports_posts'),0);assert.equal(await count('twitterapi_sports_batches'),0);
    assert.equal((await db.query('select last_run_at from public.x_sports_settings')).rows[0].last_run_at,null);
    await db.exec('drop trigger reject_batch_test on public.twitterapi_sports_batches; drop function public.reject_batch_test()');
    const first=await publish(rows);assert.equal(first.rows[0].result.replies,20);assert.equal(await count('x_sports_posts'),21);
    const old=(await db.query('select imported_at,expires_at from public.x_sports_posts where x_id=$1',['1001'])).rows[0];
    await publish(rows.map(r=>({...r,expires_at:new Date(now+72*3600000).toISOString()})));
    assert.deepEqual((await db.query('select imported_at,expires_at from public.x_sports_posts where x_id=$1',['1001'])).rows[0],old);
    assert.equal(await count('x_sports_posts'),21);
    await assert.rejects(publish(group('1002')),/cannot replace previous daily roots/);
    await assert.rejects(publish(rows.slice(0,-1)),/actual comment count/);
    await assert.rejects(publish([...rows,rows[0]]),/unique daily roots/);
    await assert.rejects(publish(Array.from({length:11},(_,i)=>group(String(1001+i))).flat()),/unique daily roots/);
    await assert.rejects(publish(rows,'partial','2026-01-01'),/current UTC day/);
    const acl=(await db.query("select prosecdef,has_function_privilege('anon',oid,'EXECUTE') anon,has_function_privilege('authenticated',oid,'EXECUTE') authenticated,has_function_privilege('service_role',oid,'EXECUTE') service_role from pg_proc where proname='publish_twitterapi_sports_batch'")).rows[0];
    assert.deepEqual(acl,{prosecdef:false,anon:false,authenticated:false,service_role:true});
    await db.exec('set role service_role');await publish(rows);await db.exec('reset role');
    const ten=Array.from({length:10},(_,i)=>group(String(1001+i))).flat();
    await publish(ten,'completed');assert.equal(await count('x_sports_posts'),210);
    assert.equal((await db.query('select roots,replies from public.twitterapi_sports_batches')).rows[0].roots,10);
    await assert.rejects(publish(group('2001')),/cannot replace previous daily roots/);
    assert.equal(await count('x_sports_posts'),210);
    // Exercise the real reservation function too: filesystem/process restart
    // cannot discard today's externally seeded trial charge.
    await db.query("insert into public.twitterapi_sports_usage(endpoint,request_hash,reserved_credits,credits,status) values('trial',$1,11295,11295,'external_trial')",['a'.repeat(64)]);
    await assert.rejects(db.query("select public.reserve_twitterapi_sports_usage('/twitter/tweet/advanced_search',$1,315)",['b'.repeat(64)]),/BUDGET_EXHAUSTED/);
    assert.equal((await db.query('select sum(credits)::integer n from public.twitterapi_sports_usage')).rows[0].n,11295);
    // A failed/uncertain request remains reserved; the monthly cap sums every
    // row rather than trusting a client's pagination or its cache directory.
    await db.exec('delete from public.twitterapi_sports_usage');
    await db.exec("insert into public.twitterapi_sports_usage(ran_at,endpoint,request_hash,reserved_credits,credits) select now()-interval '1 day','test',repeat('c',64),11300,11300 from generate_series(1,30)");
    await assert.rejects(db.query("select public.reserve_twitterapi_sports_usage('/twitter/tweet/advanced_search',$1,315)",['d'.repeat(64)]),/BUDGET_EXHAUSTED/);
    await db.exec('delete from public.twitterapi_sports_usage');
    await db.query("insert into public.twitterapi_sports_usage(endpoint,request_hash,reserved_credits,credits,status) values('trial',$1,11295,11295,'external_trial')",['e'.repeat(64)]);
    await db.exec(await fs.readFile(new URL('../database/twitterapi-sports-allowance.sql',import.meta.url),'utf8'));
    // Local-test date normalization allows this regression to run after the
    // authorized production date; the migration itself always seedsOct21only.
    await db.query('update public.twitterapi_sports_allowances set day=$1::date',[day]);
    const budget=async()=>(await db.query('select public.get_twitterapi_sports_budget() b')).rows[0].b;
    assert.equal((await budget()).remainingCredits,100005);
    assert.equal((await budget()).dailyCredits,111300);assert.equal((await budget()).rolling30Credits,439000);
    await db.query("select public.reserve_twitterapi_sports_usage('/twitter/tweets',$1,315)",['f'.repeat(64)]);
    assert.equal((await budget()).remainingCredits,99690);
    assert.equal((await db.query("select credits from public.twitterapi_sports_usage where status='external_trial'")).rows[0].credits,11295);
    await db.exec('set role service_role');
    await assert.rejects(db.query('update public.twitterapi_sports_allowances set extra_credits=200000'),/permission denied/);
    assert.equal((await budget()).dailyCredits,111300);await db.exec('reset role');
    // Tomorrow: normal daily budget automatically returns, while one-off spend
    // and its corresponding allowance remain in the30-day aggregate together.
    await db.exec("update public.twitterapi_sports_allowances set day=day-1; update public.twitterapi_sports_usage set ran_at=ran_at-interval '1 day'");
    assert.equal((await budget()).dailyCredits,11300);assert.equal((await budget()).rolling30Credits,439000);
    assert.equal((await budget()).remainingCredits,11300);
    await db.exec('update public.twitterapi_sports_allowances set day=day-29');
    assert.equal((await budget()).rolling30Credits,339000);
  } finally {await db.close();}
});
