import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createTwitterApiClient } from '../src/lib/x-sports/twitterapi-client.mjs';
import { allocateReplyTargets, runTwitterApiSportsImport, validateGroups } from '../scripts/sync-twitterapi-sports.mjs';
import { classifyTwitterApiTweet } from '../src/lib/x-sports/twitterapi-curation.mjs';

const NOW=new Date('2026-10-21T16:00:00Z');
const ok=value=>({ok:true,json:async()=>value});
const temporary=()=>fs.mkdtemp(path.join(os.tmpdir(),'arabtips-twitterapi-test-'));
function memoryDb(initial=[]) {
  const usage=[...initial];const events=[];let failSettlement=false;
  const allowances={daily:0,monthly:0};
  return {usage,events,allowances,set failSettlement(value){failSettlement=value;},
    from(name) {assert.equal(name,'twitterapi_sports_usage');return {select(){return this;},async gte(){return {data:usage};}};},
    async rpc(name,args) {
      events.push(name);
      const daily=usage.filter(r=>r.ran_at>='2026-10-21T00:00:00.000Z').reduce((s,r)=>s+r.credits,0);
      const monthly=usage.reduce((s,r)=>s+r.credits,0);
      if(name==='get_twitterapi_sports_budget')return {data:{day:'2026-10-21',dailyCredits:11300+allowances.daily,rolling30Credits:339000+allowances.monthly,dailyUsedCredits:daily,rolling30UsedCredits:monthly,remainingCredits:Math.max(0,Math.min(11300+allowances.daily-daily,339000+allowances.monthly-monthly))}};
      if(name==='reserve_twitterapi_sports_usage') {
        if(daily+args.p_credits>11300+allowances.daily || monthly+args.p_credits>339000+allowances.monthly)return {error:{message:'TWITTERAPI_BUDGET_EXHAUSTED'}};
        usage.push({id:usage.length+1,credits:args.p_credits,reserved_credits:args.p_credits,ran_at:NOW.toISOString(),status:'reserved'});
        return {data:usage.length};
      }
      if(failSettlement)return {error:{message:'temporary database failure'}};
      const row=usage.find(r=>r.id===args.p_id);assert.ok(args.p_credits<=row.reserved_credits);
      row.credits=args.p_credits;row.status='completed';return {data:null};
    }};
}
function rawRoot(n=1,count=100) {return {id:String(1000+n),conversationId:String(1000+n),text:`برشلونة يحقق الفوز في مباراة الدوري بعد أداء مميز من اللاعبين رقم ${n}`,createdAt:'2026-10-21T14:00:00Z',lang:'ar',replyCount:count,isReply:false,author:{id:String(5000+n),userName:`sports${n}`,name:`أخبار الرياضة ${n}`,profilePicture:'https://pbs.twimg.com/face.jpg'}};}
function rawReply(root,n=1) {return {id:`${root.id}${String(n).padStart(4,'0')}`,conversationId:root.id,inReplyToId:root.id,isReply:true,text:`@${root.author.userName} أداء ممتاز من اللاعبين في هذه المباراة ورقم التعليق ${n}`,createdAt:'2026-10-21T15:00:00Z',lang:'ar',replyCount:0,author:{id:`7${n}`,userName:`fan${n}`,name:`مشجع ${n}`,profilePicture:'https://pbs.twimg.com/fan.jpg'}};}

test('provider reserves before data reads, strips private profile metadata and reuses cache',async()=>{
  const stateDir=await temporary();const db=memoryDb();let calls=0;
  const root=rawRoot();root.author.location='Private unnecessary field';root.author.description='Unused bio';
  const client=await createTwitterApiClient({db,key:'test-secret',stateDir,day:'2026-10-21',now:()=>NOW,intervalMs:0,waitImpl:async()=>{},fetchImpl:async url=>{
    calls++;if(url.pathname==='/oapi/my/info')return ok({recharge_credits:0,total_bonus_credits:100000});
    assert.equal(db.usage.at(-1).status,'reserved');return ok({tweets:[root],has_next_page:false});
  }});
  const a=await client.request('/twitter/tweet/advanced_search',{query:'news'});
  const b=await client.request('/twitter/tweet/advanced_search',{query:'news'});
  assert.deepEqual(a,b);assert.equal(calls,2);assert.equal(db.usage[0].credits,15);assert.equal(client.stats.cacheHits,1);
  assert.equal(a.tweets[0].author.location,undefined);
  for(const filename of await fs.readdir(client.cacheDir))assert.ok(!(await fs.readFile(path.join(client.cacheDir,filename),'utf8')).includes('test-secret'));
  await fs.rm(stateDir,{recursive:true});
});

test('the external trial expense blocks another paid call today',async()=>{
  const stateDir=await temporary();const db=memoryDb([{credits:11295,ran_at:NOW.toISOString()}]);let calls=0;
  const client=await createTwitterApiClient({db,key:'test-secret',stateDir,day:'2026-10-21',now:()=>NOW,intervalMs:0,fetchImpl:async()=>{calls++;throw Error('should not happen');}});
  await assert.rejects(client.request('/twitter/tweet/advanced_search',{query:'news'}),/BUDGET_EXHAUSTED/);
  assert.equal(calls,0);assert.equal(db.usage.length,1);
  await fs.rm(stateDir,{recursive:true});
});

test('failed settlement preserves the reservation and cached paid response',async()=>{
  const stateDir=await temporary();const db=memoryDb();db.failSettlement=true;let calls=0;
  const client=await createTwitterApiClient({db,key:'test-secret',stateDir,day:'2026-10-21',now:()=>NOW,intervalMs:0,waitImpl:async()=>{},fetchImpl:async url=>{calls++;return url.pathname==='/oapi/my/info'?ok({recharge_credits:0,total_bonus_credits:100000}):ok({tweets:[rawReply(rawRoot())]});}});
  await assert.rejects(client.request('/twitter/tweet/replies/v2',{tweetId:'1001'}),/settling/);
  assert.equal(db.usage[0].credits,1515);assert.equal(db.usage[0].status,'reserved');
  const cached=await client.request('/twitter/tweet/replies/v2',{tweetId:'1001'});
  assert.equal(cached.tweets.length,1);assert.equal(calls,2);
  await fs.rm(stateDir,{recursive:true});
});

test('an explicit database allowance permits extra work while preserving the seeded trial ledger',async()=>{
  const stateDir=await temporary();const db=memoryDb([{credits:11295,ran_at:NOW.toISOString(),status:'external_trial'}]);
  db.allowances.daily=100000;db.allowances.monthly=100000;
  const client=await createTwitterApiClient({db,key:'test-secret',stateDir,day:'2026-10-21',now:()=>NOW,intervalMs:0,waitImpl:async()=>{},fetchImpl:async url=>url.pathname==='/oapi/my/info'?ok({recharge_credits:1000000,total_bonus_credits:88705}):ok({tweets:[rawRoot()],has_next_page:false})});
  assert.equal(await client.remainingCredits(),100005);
  await client.request('/twitter/tweets',{tweet_ids:'1001'});
  assert.equal(db.usage[0].credits,11295);assert.equal(db.usage[0].status,'external_trial');
  assert.equal(client.budget.dailyCredits,111300);assert.equal(db.usage[1].credits,15);
  const restarted=await createTwitterApiClient({db,key:'test-secret',stateDir:await temporary(),day:'2026-10-21',now:()=>NOW});
  assert.equal(await restarted.remainingCredits(),99990);
  await fs.rm(path.dirname(restarted.cacheDir),{recursive:true});await fs.rm(stateDir,{recursive:true});
});

test('rolling 30-day allowance and transport failures fail closed',async()=>{
  const stateDir=await temporary();const db=memoryDb([{credits:338995,ran_at:'2026-10-20T16:00:00.000Z'}]);let calls=0;
  const client=await createTwitterApiClient({db,key:'test-secret',stateDir,day:'2026-10-21',now:()=>NOW,intervalMs:0,fetchImpl:async()=>{calls++;throw Error('should not happen');}});
  await assert.rejects(client.request('/twitter/tweet/advanced_search',{query:'news'}),/BUDGET_EXHAUSTED/);assert.equal(calls,0);
  db.usage.length=0;
  const second=await createTwitterApiClient({db,key:'test-secret',stateDir,day:'2026-10-21',now:()=>NOW,intervalMs:0,waitImpl:async()=>{},fetchImpl:async url=>{if(url.pathname==='/oapi/my/info')return ok({recharge_credits:100000,total_bonus_credits:0});throw Error('timeout test-secret');}});
  await assert.rejects(second.request('/twitter/tweet/advanced_search',{query:'news'}),/TWITTERAPI_REQUEST_FAILED/);
  assert.equal(db.usage[0].credits,315);assert.equal(db.usage[0].status,'reserved');
  await fs.rm(stateDir,{recursive:true});
});

test('engagement allocation is variable and bounded 20–111',()=>{
  const counts=[4000,1000,500,400,300,200,150,100,70,50];
  const targets=allocateReplyTargets(counts.map(sourceReplyCount=>({sourceReplyCount})));
  assert.equal(targets.reduce((a,b)=>a+b,0),350);assert.ok(targets.every(n=>n>=20&&n<=111));
  assert.ok(new Set(targets).size>1);assert.ok(targets[0]>targets.at(-1));
  assert.deepEqual(allocateReplyTargets([{sourceReplyCount:10000}]),[111]);
});

test('ten clean news stories receive a 20-reply base before engagement-weighted enrichment',async()=>{
  const stateDir=await temporary();const roots=Array.from({length:10},(_,i)=>rawRoot(i+1,[4000,1000,500,400,300,200,150,100,70,50][i]));
  const repliesCalled=[];
  const client={stats:{apiCalls:0,credits:0,cacheHits:0},async request(endpoint,params){
    if(endpoint.endsWith('advanced_search'))return {tweets:roots,has_next_page:false,next_cursor:''};
    repliesCalled.push(params.tweetId);
    const root=roots.find(r=>r.id===params.tweetId);const start=params.cursor?21:1;
    const real=Array.from({length:params.cursor?80:20},(_,i)=>rawReply(root,start+i));
    const abusive={...rawReply(root,999),text:'انت غبي يا حمار ولا تعرف كرة القدم'};
    const wrong={...rawReply(root,998),inReplyToId:'999999'};
    return {tweets:[...real,abusive,wrong,real[0]],has_next_page:!params.cursor,next_cursor:params.cursor?'':'next'};
  }};
  const result=await runTwitterApiSportsImport({client,stateDir,now:NOW,preview:true,settingsOverride:{enabled:true,retention_hours:48}});
  assert.equal(result.roots,10);assert.equal(result.replies,350);assert.equal(new Set(repliesCalled.slice(0,10)).size,10);
  assert.ok(new Set(result.replyCounts.map(r=>r.count)).size>1);
  const saved=JSON.parse(await fs.readFile(path.join(stateDir,'2026-10-21','batch.json'),'utf8'));
  assert.equal(new Set(saved.groups.flatMap(g=>g.replies.map(r=>r.x_id))).size,350);
  assert.ok(saved.groups.every(g=>g.replies.every(r=>!r.body.startsWith('@'))));
  assert.ok(!JSON.stringify(saved.groups).includes('حمار'));
  await fs.rm(stateDir,{recursive:true});
});

test('insufficient genuine replies never become a published count',async()=>{
  const stateDir=await temporary();const root=rawRoot();
  const client={stats:{},async request(endpoint){return endpoint.endsWith('advanced_search')?{tweets:[root],has_next_page:false}:{tweets:Array.from({length:19},(_,i)=>rawReply(root,i+1)),has_next_page:false};}};
  const result=await runTwitterApiSportsImport({client,stateDir,now:NOW,preview:true,settingsOverride:{enabled:true,retention_hours:48}});
  assert.equal(result.roots,0);assert.equal(result.replies,0);assert.equal(result.status,'insufficient_content');
  await fs.rm(stateDir,{recursive:true});
});

test('cached batch validation rejects invalid times, wrong parents and count inflation',()=>{
  const raw=rawRoot();const root=classifyTwitterApiTweet(raw,{now:NOW}).row;
  const replies=Array.from({length:20},(_,i)=>classifyTwitterApiTweet(rawReply(raw,i+1),{now:NOW,rootId:raw.id}).row);
  assert.equal(validateGroups([{root,replies}],NOW).length,1);
  assert.throws(()=>validateGroups([{root:{...root,expires_at:'not-a-date'},replies}],NOW),/qualifies/);
  assert.throws(()=>validateGroups([{root,replies:replies.slice(0,19)}],NOW),/count/);
  assert.throws(()=>validateGroups([{root,replies:[{...replies[0],in_reply_to_x_id:'999'},...replies.slice(1)]}],NOW),/qualifies/);
  assert.throws(()=>validateGroups([{root,replies:[{...replies[0],posted_at:'invalid'},...replies.slice(1)]}],NOW),/qualifies/);
});

test('cached publication uses one atomic RPC, no provider calls, and safely retries a failed commit',async()=>{
  const stateDir=await temporary();const raw=rawRoot();
  const options={now:NOW,matchedQuery:'twitterapi:news:test'};
  const groups=[{root:classifyTwitterApiTweet(raw,options).row,replies:Array.from({length:20},(_,i)=>classifyTwitterApiTweet(rawReply(raw,i+1),{...options,rootId:raw.id}).row)}];
  const directory=path.join(stateDir,'2026-10-21');await fs.mkdir(directory,{recursive:true});
  await fs.writeFile(path.join(directory,'batch.json'),JSON.stringify({day:'2026-10-21',groups,candidates:1,reason:null}));
  let fail=true;let published=null;let rpcCalls=0;let apiCalls=0;
  const db={
    from(name){assert.equal(name,'twitterapi_sports_batches');return {select(){return this;},eq(){return this;},async maybeSingle(){return {data:published};}};},
    async rpc(name,args){
      rpcCalls++;assert.equal(name,'publish_twitterapi_sports_batch');assert.equal(args.p_day,'2026-10-21');assert.equal(args.p_rows.length,21);
      if(fail)return {error:{message:'transaction failed'}};
      published={day:args.p_day,status:args.p_status,roots:1,replies:20,root_ids:[raw.id]};return {data:published};
    },
  };
  const client={stats:{},async request(){apiCalls++;throw Error('Unexpected paid request');},async balance(){apiCalls++;throw Error('Unexpected balance request');}};
  const args={db,client,stateDir,now:NOW,publishCache:true,settingsOverride:{enabled:true,retention_hours:48}};
  await assert.rejects(runTwitterApiSportsImport(args),/publishing sports batch atomically/);
  assert.equal(published,null);fail=false;
  const result=await runTwitterApiSportsImport(args);
  assert.equal(result.roots,1);assert.equal(result.replies,20);assert.equal(rpcCalls,2);assert.equal(apiCalls,0);
  await runTwitterApiSportsImport(args);assert.equal(rpcCalls,3);assert.equal(apiCalls,0);
  await fs.rm(stateDir,{recursive:true});
});

test('one-off retry refreshes discovery and hydrates candidates without losing the existing39 replies',async()=>{
  const stateDir=await temporary();const roots=Array.from({length:10},(_,i)=>rawRoot(i+1));
  const options={now:NOW,matchedQuery:'twitterapi:news:prior'};
  const previous={root:classifyTwitterApiTweet(roots[0],options).row,sourceReplyCount:100,replies:Array.from({length:39},(_,i)=>classifyTwitterApiTweet(rawReply(roots[0],i+1),{...options,rootId:roots[0].id}).row)};
  const directory=path.join(stateDir,'2026-10-21');await fs.mkdir(directory,{recursive:true});
  await fs.writeFile(path.join(directory,'batch.json'),JSON.stringify({day:'2026-10-21',groups:[previous]}));
  await fs.writeFile(path.join(directory,'window.json'),JSON.stringify({day:'2026-10-21',queries:['old generic fan bait']}));
  const db={from(name){return {select(){return this;},eq(){return this;},is(){return this;},async maybeSingle(){assert.equal(name,'twitterapi_sports_batches');return {data:{day:'2026-10-21',status:'partial',root_ids:[roots[0].id],roots:1,replies:39}};},async gt(){assert.equal(name,'x_sports_posts');return {data:[{x_id:roots[0].id}]};}};}};
  const calls=[];const client={stats:{},async request(endpoint,params){calls.push({endpoint,params});if(endpoint==='/twitter/tweets')return {tweets:[roots[1]],has_next_page:false};if(endpoint.endsWith('advanced_search'))return {tweets:roots.slice(2),has_next_page:false};const root=roots.find(r=>r.id===params.tweetId);return {tweets:Array.from({length:20},(_,i)=>rawReply(root,i+1)),has_next_page:false};}};
  const report=await runTwitterApiSportsImport({db,client,stateDir,now:NOW,preview:true,allowSameDayRetry:true,refreshNewsSearch:true,seedCandidateIds:[roots[1].id],maxSearchPages:16,maxReplyPages:6,settingsOverride:{enabled:true,retention_hours:48}});
  assert.equal(report.roots,10);assert.equal(report.replyCounts.find(r=>r.id===roots[0].id).count,39);
  const saved=JSON.parse(await fs.readFile(path.join(directory,'batch.json'),'utf8'));
  assert.deepEqual(saved.groups.find(g=>g.root.x_id===roots[0].id).replies,previous.replies);
  assert.equal(calls[0].endpoint,'/twitter/tweets');assert.equal(calls[0].params.tweet_ids,roots[1].id);
  assert.ok(calls.filter(c=>c.endpoint.endsWith('advanced_search')).every(c=>!c.params.query.includes('old generic')));
  assert.equal(JSON.parse(await fs.readFile(path.join(directory,'window.json'),'utf8')).queries.length,6);
  await fs.rm(stateDir,{recursive:true});
});

test('discovery looks for another author before a third story from the same author',async()=>{
  const stateDir=await temporary();const roots=Array.from({length:4},(_,i)=>rawRoot(i+1));
  for(const root of roots.slice(0,3))root.author.id='5001';
  const calls=[];let searches=0;
  const client={stats:{},async request(endpoint,params){
    if(endpoint.endsWith('advanced_search')){searches++;calls.push(`search${searches}`);return {tweets:searches===1?roots.slice(0,3):searches===2?[roots[3]]:[],has_next_page:false};}
    calls.push(`replies:${params.tweetId}`);const root=roots.find(r=>r.id===params.tweetId);return {tweets:Array.from({length:20},(_,i)=>rawReply(root,i+1)),has_next_page:false};
  }};
  await runTwitterApiSportsImport({client,stateDir,now:NOW,preview:true,settingsOverride:{enabled:true,retention_hours:48}});
  assert.ok(calls.indexOf('search2')<calls.indexOf(`replies:${roots[2].id}`));
  assert.ok(calls.indexOf(`replies:${roots[3].id}`)<calls.indexOf(`replies:${roots[2].id}`));
  await fs.rm(stateDir,{recursive:true});
});
