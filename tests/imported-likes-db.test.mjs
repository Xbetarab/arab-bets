import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const runtime=process.env.IMPORTED_LIKES_PGLITE_PATH??process.env.TWITTERAPI_PGLITE_PATH;
test('imported likes SQL preserves seeds, serializes idempotent reactions and isolates private data',{skip:!runtime},async()=>{
  const {PGlite}=await import(pathToFileURL(runtime).href);
  const db=new PGlite();
  const u1='11111111-1111-4111-8111-111111111111';
  const u2='22222222-2222-4222-8222-222222222222';
  try {
    await db.exec('create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key);');
    await db.query('insert into auth.users(id) values($1),($2)',[u1,u2]);
    await db.exec(await fs.readFile(new URL('../database/x-sports-api.sql',import.meta.url),'utf8'));
    const insert=async(id,{parent=null,visible=true,deleted=false,expired=false,conversation=id}={})=>db.query(
      `insert into public.x_sports_posts(x_id,conversation_id,in_reply_to_x_id,author_x_id,author_username,author_name,body,posted_at,expires_at,is_visible,deleted_at)
       values($1,$2,$3,'777','sports','أخبار الرياضة','فوز مهم في بطولة الدوري',now()-interval '2 days',now()+($4::integer*interval '1 hour'),$5,case when $6 then now() else null end)`,
      [id,conversation,parent,expired?-1:48,visible,deleted]);
    await insert('1001');await insert('1002',{visible:false});await insert('1003',{deleted:true});await insert('1004',{expired:true});
    await insert('1005',{parent:'1001',conversation:'1001'});await insert('1006',{conversation:'9999'});
    const migration=await fs.readFile(new URL('../database/x-sports-likes.sql',import.meta.url),'utf8');
    await db.exec(migration);
    const seeded=(await db.query('select x_id,seeded_likes_count from public.x_sports_posts order by x_id')).rows;
    assert.equal(seeded.find(r=>r.x_id==='1005').seeded_likes_count,null);
    assert.ok(seeded.filter(r=>r.x_id!=='1005').every(r=>r.seeded_likes_count>=124&&r.seeded_likes_count<=998));
    const seed=seeded.find(r=>r.x_id==='1001').seeded_likes_count;
    await db.exec(migration);
    assert.equal((await db.query("select seeded_likes_count n from public.x_sports_posts where x_id='1001'")).rows[0].n,seed);
    await db.exec("update public.x_sports_posts set seeded_likes_count=null,body='تحديث الخبر' where x_id='1001'; update public.x_sports_posts set seeded_likes_count=555 where x_id='1001'");
    assert.equal((await db.query("select seeded_likes_count n from public.x_sports_posts where x_id='1001'")).rows[0].n,seed);
    await insert('1007');const futureSeed=(await db.query("select seeded_likes_count n from public.x_sports_posts where x_id='1007'")).rows[0].n;
    assert.ok(futureSeed>=124&&futureSeed<=998);
    await db.exec("update public.x_sports_posts set seeded_likes_count=555 where x_id='1005'");
    assert.equal((await db.query("select seeded_likes_count n from public.x_sports_posts where x_id='1005'")).rows[0].n,null);
    const set=async(id,user,liked)=>(await db.query('select public.set_x_sports_post_like($1,$2::uuid,$3::boolean) r',[id,user,liked])).rows[0].r;
    const get=async(ids,user=null)=>(await db.query('select * from public.get_x_sports_post_likes($1::text[],$2::uuid)',[ids,user])).rows;
    await db.exec('set role service_role');
    assert.deepEqual(await set('1001',u1,true),{liked:true,likesCount:seed+1});
    assert.deepEqual(await set('1001',u1,true),{liked:true,likesCount:seed+1});
    await Promise.all([set('1001',u2,true),set('1001',u2,true)]);
    let counts=await get(['1001'],u1);assert.equal(Number(counts[0].likes_count),seed+2);assert.equal(counts[0].is_liked,true);
    assert.equal((await get(['1001']))[0].is_liked,false);
    assert.deepEqual(await set('1001',u1,false),{liked:false,likesCount:seed+1});
    assert.deepEqual(await set('1001',u1,false),{liked:false,likesCount:seed+1});
    assert.equal((await get(['1001'],u1))[0].is_liked,false);
    for(const invalid of ['1002','1003','1004','1005','1006','9999']) await assert.rejects(set(invalid,u1,true),/UNAVAILABLE/);
    assert.deepEqual(await get(['1002','1003','1004','1005','1006','9999']),[]);
    await assert.rejects(set('not-numeric',u1,true),/Invalid/);
    await assert.rejects(set('1001',null,true),/Invalid/);
    await assert.rejects(set('1001',u1,null),/Invalid/);
    await assert.rejects(get(Array(21).fill('1001')),/Invalid/);
    await assert.rejects(get(['1001',null]),/Invalid/);
    assert.deepEqual(await get([]),[]);
    await db.exec('reset role');
    const acls=(await db.query("select proname,prosecdef,has_function_privilege('anon',oid,'EXECUTE') anon,has_function_privilege('authenticated',oid,'EXECUTE') authenticated,has_function_privilege('service_role',oid,'EXECUTE') service from pg_proc where proname in ('set_x_sports_post_like','get_x_sports_post_likes')")).rows;
    assert.equal(acls.length,2);assert.ok(acls.every(a=>!a.prosecdef&&!a.anon&&!a.authenticated&&a.service));
    assert.equal((await db.query("select relrowsecurity from pg_class where oid='public.x_sports_post_likes'::regclass")).rows[0].relrowsecurity,true);
    for(const role of ['anon','authenticated']) {
      await db.exec(`set role ${role}`);
      await assert.rejects(db.query('select * from public.x_sports_post_likes'),/permission denied/);
      await assert.rejects(set('1001',u1,true),/permission denied/);
      await assert.rejects(get(['1001'],u1),/permission denied/);
      await db.exec('reset role');
    }
    await db.query('delete from auth.users where id=$1',[u2]);
    counts=await get(['1001']);assert.equal(Number(counts[0].likes_count),seed);
    await set('1001',u1,true);await db.exec("delete from public.x_sports_posts where x_id='1001'");
    assert.equal((await db.query('select count(*)::integer n from public.x_sports_post_likes')).rows[0].n,0);
  } finally {await db.close();}
});
