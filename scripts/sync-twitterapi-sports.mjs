import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import { createTwitterApiClient, hashRequest, utcDay, writePrivateJson, cacheTweet } from '../src/lib/x-sports/twitterapi-client.mjs';
import { buildNewsQueries, classifyTwitterApiTweet, isCleanArabicSportsRow, scoreNewsCandidate } from '../src/lib/x-sports/twitterapi-curation.mjs';

export const SPORTS_TARGET = Object.freeze({ roots: 10, minimumReplies: 20, maximumReplies: 111, preferredTotalReplies: 350 });
const id = value => /^\d{1,25}$/.test(String(value ?? ''));
const dbValue = (result, purpose) => { if (result?.error) throw new Error(`Database failed during ${purpose}`); return result?.data; };
const marker = query => `twitterapi:news:${query}`.slice(0, 500);
const countReplies = groups => groups.reduce((n,g) => n + g.replies.length, 0);
const timestamp = value => {const n=Date.parse(value);return Number.isFinite(n)?n:null;};

export async function prunePrivateCache(stateDir, now = new Date()) {
  let entries;
  try {entries=await fs.readdir(stateDir,{withFileTypes:true});} catch(error) {if(error.code==='ENOENT')return;throw error;}
  const cutoff=Date.parse(`${utcDay(now)}T00:00:00Z`)-3*86400000;
  for(const entry of entries) {
    if(!entry.isDirectory() || !/^\d{4}-\d{2}-\d{2}$/.test(entry.name) || Date.parse(`${entry.name}T00:00:00Z`)>=cutoff) continue;
    const directory=path.join(stateDir,entry.name);
    // Only importer-owned date folders with their matching manifest qualify.
    let window;try {window=JSON.parse(await fs.readFile(path.join(directory,'window.json'),'utf8'));}catch {continue;}
    if(window.day===entry.name && Array.isArray(window.queries)) await fs.rm(directory,{recursive:true,force:true});
  }
}

// Allocate real comments, not a displayed engagement count. High-response
// stories get more of the remaining allowance, up to111; every published story
// must first have20 clean replies. The actual returned count can be smaller.
export function allocateReplyTargets(groups, preferred = SPORTS_TARGET.preferredTotalReplies) {
  const targets = groups.map(() => SPORTS_TARGET.minimumReplies);
  let extra = Math.max(0, Math.min(preferred, groups.length * SPORTS_TARGET.maximumReplies) - targets.reduce((a,b) => a+b,0));
  const weights = groups.map(g => Math.sqrt(Math.max(1, Number(g.sourceReplyCount ?? 1))));
  while (extra > 0 && targets.some(n => n < SPORTS_TARGET.maximumReplies)) {
    let chosen = -1; let score = -Infinity;
    for (let i=0;i<targets.length;i++) {
      if (targets[i] >= SPORTS_TARGET.maximumReplies) continue;
      const priority = weights[i] / (targets[i] - SPORTS_TARGET.minimumReplies + 1);
      if (priority > score) { score=priority; chosen=i; }
    }
    if (chosen < 0) break;
    targets[chosen]++; extra--;
  }
  return targets;
}

export function validateGroups(groups, now = new Date()) {
  const seen = new Set();
  if (!Array.isArray(groups) || groups.length > SPORTS_TARGET.roots) throw new Error('Invalid cached batch');
  for (const group of groups) {
    const root = group.root;
    if (!root || !id(root.x_id) || root.in_reply_to_x_id || root.conversation_id !== root.x_id || timestamp(root.posted_at)===null || timestamp(root.expires_at)===null || !isCleanArabicSportsRow(root, { requireNews: true }) ||
      Date.parse(root.posted_at) < now.getTime()-24*3600000 || Date.parse(root.posted_at) > now.getTime()+300000 || Date.parse(root.expires_at) <= now.getTime()) throw new Error('Cached news post no longer qualifies');
    if (seen.has(root.x_id)) throw new Error('Duplicate cached post');
    seen.add(root.x_id);
    if (!Array.isArray(group.replies) || group.replies.length < SPORTS_TARGET.minimumReplies || group.replies.length > SPORTS_TARGET.maximumReplies) throw new Error('Invalid actual comment count');
    for (const row of group.replies) {
      if (!id(row.x_id) || seen.has(row.x_id) || row.in_reply_to_x_id !== root.x_id || row.conversation_id !== root.x_id || timestamp(row.posted_at)===null || timestamp(row.expires_at)===null || Date.parse(row.posted_at)<Date.parse(root.posted_at) || Date.parse(row.posted_at)>now.getTime()+300000 || Date.parse(row.expires_at)<=now.getTime() || !isCleanArabicSportsRow(row, { requireNews: false })) throw new Error('Cached reply no longer qualifies');
      seen.add(row.x_id);
    }
  }
  return groups;
}

export async function seedTrialCache({ trialDir, stateDir, day = utcDay() }) {
  const trial = JSON.parse(await fs.readFile(path.join(trialDir,'ledger.json'),'utf8'));
  const queries = [];
  let copied=0;
  for (const call of trial.calls ?? []) {
    if (!['/twitter/tweet/advanced_search','/twitter/tweet/replies/v2'].includes(call.endpoint) || call.status !== 'completed') continue;
    const url = new URL(call.endpoint, 'https://api.twitterapi.io');
    for (const [key,value] of Object.entries(call.params ?? {})) if(value !== '' && value !== null && value !== undefined) url.searchParams.set(key,String(value));
    const requestHash = hashRequest(url.href);
    const oldFile = path.join(trialDir,'cache',`${requestHash.slice(0,20)}.json`);
    let payload;
    try { payload=JSON.parse(await fs.readFile(oldFile,'utf8')); } catch(e) { if(e.code==='ENOENT') continue; throw e; }
    if (!Array.isArray(payload.tweets)) continue;
    // Missing trial media evidence stays missing: never fabricate it to pass
    // attribution/link filtering. Those records simply fail normal curation.
    payload.tweets = payload.tweets.map(cacheTweet);
    const filename = path.join(stateDir,day,'cache',`${requestHash}.json`);
    try { await fs.access(filename); } catch { await writePrivateJson(filename,{requestHash,receivedAt:call.at,seededFromTrial:true,payload}); copied++; }
    if(call.endpoint.endsWith('advanced_search') && !queries.includes(call.params.query)) queries.push(call.params.query);
  }
  const window = { since:trial.config.since, until:trial.config.until, queries, day };
  await writePrivateJson(path.join(stateDir,day,'window.json'),window);
  return { copied,queries:queries.length };
}

export async function runTwitterApiSportsImport({ db, client, stateDir, now = new Date(), preview = false, publishCache = false, allowSameDayRetry = false, refreshNewsSearch = false, seedCandidateIds = [], settingsOverride, maxSearchPages = 8, maxReplyPages = 6 }) {
  if(!Number.isSafeInteger(maxSearchPages)||maxSearchPages<1||maxSearchPages>60||!Number.isSafeInteger(maxReplyPages)||maxReplyPages<1||maxReplyPages>12) throw new Error('Invalid bounded pagination limits');
  if(refreshNewsSearch && (!allowSameDayRetry || publishCache)) throw new Error('Fresh search requires an explicit same-day retry');
  if(!Array.isArray(seedCandidateIds)||seedCandidateIds.length>20||seedCandidateIds.some(value=>!id(value))) throw new Error('Invalid bounded candidate IDs');
  const day=utcDay(now);
  const directory=path.join(stateDir,day);
  const manifestPath=path.join(directory,'batch.json');
  const settings = settingsOverride ?? (db ? dbValue(await db.from('x_sports_settings').select('enabled,retention_hours').eq('id',1).single(),'loading import settings') : {enabled:true,retention_hours:48});
  if(!settings?.enabled) return {status:'disabled',roots:0,replies:0};
  const retentionHours=Math.min(48,Math.max(24,Number(settings.retention_hours)||48));
  const priorBatch=db ? dbValue(await db.from('twitterapi_sports_batches').select('day,status,root_ids,roots,replies').eq('day',day).maybeSingle(),'reading daily batch') : null;
  if(!preview && priorBatch?.status==='completed') return {status:'already_run_today',roots:priorBatch.roots,replies:priorBatch.replies};
  if(!preview && priorBatch && priorBatch.status!=='preview' && !allowSameDayRetry && !publishCache) return {status:'already_run_today',roots:priorBatch.roots,replies:priorBatch.replies};
  let groups=[]; let reason=null; let candidatesCount=0;
  const rejected={};
  const reject=why=>{rejected[why]=(rejected[why]??0)+1;};
  if (priorBatch?.roots) {
    // The database remains the day-level count authority even if a release or
    // process restarts. Never replace the manifest and accidentally publish
    // another ten roots on top of an earlier partial batch.
    const previous=JSON.parse(await fs.readFile(manifestPath,'utf8'));
    const publishedIds=new Set(priorBatch.root_ids);
    groups=validateGroups(previous.groups.filter(group=>publishedIds.has(group.root.x_id)),now)
      .map(group=>({...group,previouslyPublished:true,done:true,pages:0}));
    if(groups.length!==priorBatch.roots) throw new Error('Previous published batch cache is incomplete');
  }
  if(publishCache) {
    const manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
    if(manifest.day!==day) throw new Error('Cached preview is from a different UTC day');
    groups=validateGroups(manifest.groups,now);
    if((priorBatch?.root_ids??[]).some(value=>!groups.some(group=>group.root.x_id===value))) throw new Error('Preview omits already published daily roots');
    reason=manifest.reason; candidatesCount=manifest.candidates;
  } else {
    let window;
    if(refreshNewsSearch) {
      // Keep today's manifest/published root IDs and paid caches. Only the
      // discovery window changes, so generic trial queries cannot trap retry.
      const until=Math.floor(now.getTime()/1000);
      window={day,since:until-86400,until,queries:buildNewsQueries({since:until-86400,until})};
      await writePrivateJson(path.join(directory,'window.json'),window);
    }
    try { window=JSON.parse(await fs.readFile(path.join(directory,'window.json'),'utf8')); }
    catch(error) { if(error.code!=='ENOENT') throw error; const until=Math.floor(now.getTime()/1000); window={day,since:until-86400,until,queries:buildNewsQueries({since:until-86400,until})}; await writePrivateJson(path.join(directory,'window.json'),window); }
    if(window.day!==day || !Array.isArray(window.queries)) throw new Error('Invalid news search window');
    const currentIds=new Set(priorBatch?.root_ids??[]);
    const existing=db ? dbValue(await db.from('x_sports_posts').select('x_id').is('in_reply_to_x_id',null).gt('expires_at',now.toISOString()),'reading recent imported roots') ?? [] : [];
    const previousIds=new Set(existing.map(row=>row.x_id).filter(value=>!currentIds.has(value)));
    const candidates=new Map();
    const searchStates=window.queries.slice(0,6).map(query=>({query,cursor:'',cursors:new Set(),done:false,pages:0}));
    const pagesPerQuery=Math.max(1,Math.ceil(maxSearchPages/Math.max(1,searchStates.length)));
    let searches=0;
    const options=(query,rootId=null)=>({matchedQuery:marker(query),now,retentionHours,rootId,minSourceReplies:50});
    function collectCandidates(tweets,query) {
      for(const raw of tweets) {
        const result=classifyTwitterApiTweet(raw,options(query));
        if(!result?.row) {reject(result?.reason??'not_eligible_news');continue;}
        const row=result.row;
        if(Date.parse(row.posted_at)<now.getTime()-86400000 || previousIds.has(row.x_id)) {reject('not_new_daily_post');continue;}
        if(!candidates.has(row.x_id)) candidates.set(row.x_id,{root:row,sourceReplyCount:Number(raw.replyCount)||0,score:scoreNewsCandidate(raw),query,replies:[],seen:new Set(),cursor:'',cursors:new Set(),pages:0,done:false});
      }
    }
    async function searchMore() {
      const search=searchStates.filter(item=>!item.done && item.pages<pagesPerQuery).sort((a,b)=>a.pages-b.pages)[0];
      if(!search || searches>=maxSearchPages) return false;
      let response;
      try { response=await client.request('/twitter/tweet/advanced_search',{query:search.query,queryType:'Top',cursor:search.cursor}); }
      catch(error) { if(error.message==='TWITTERAPI_OFFLINE_CACHE_MISS') {search.done=true;return true;} throw error; }
      searches++; search.pages++;
      collectCandidates(response.tweets,search.query);
      const next=response.next_cursor;
      search.done=!response.has_next_page || !next || search.cursors.has(next);
      if(next) {search.cursors.add(next);search.cursor=next;}
      return true;
    }
    async function getMoreReplies(group) {
      if(group.done || group.pages>=maxReplyPages) return false;
      let response;
      try { response=await client.request('/twitter/tweet/replies/v2',{tweetId:group.root.x_id,queryType:'Relevance',cursor:group.cursor}); }
      catch(error) { if(error.message==='TWITTERAPI_OFFLINE_CACHE_MISS') {group.done=true;return false;} throw error; }
      group.pages++;
      for(const raw of response.tweets) {
        if(group.seen.has(String(raw.id))) {reject('duplicate_reply');continue;}
        group.seen.add(String(raw.id));
        const result=classifyTwitterApiTweet(raw,options(group.query,group.root.x_id));
        if(!result?.row) {reject(result?.reason??'not_eligible_reply');continue;}
        const row=result.row;
        if(row.in_reply_to_x_id!==group.root.x_id || row.conversation_id!==group.root.x_id || Date.parse(row.posted_at)<Date.parse(group.root.posted_at)) {reject('wrong_parent');continue;}
        group.replies.push(row);
      }
      const next=response.next_cursor;
      group.done=!response.has_next_page || !next || group.cursors.has(next);
      if(next) {group.cursors.add(next);group.cursor=next;}
      return true;
    }
    try {
      if(seedCandidateIds.length) {
        const response=await client.request('/twitter/tweets',{tweet_ids:[...new Set(seedCandidateIds)].join(',')});
        collectCandidates(response.tweets,'hydrated sports news');
      }
      const attempted=new Set(groups.map(group=>group.root.x_id));
      // Fill the ten-post base first. An unpopular conversation cannot consume
      // the entire allowance before other stories receive their first page.
      while(groups.length<SPORTS_TARGET.roots) {
        let pool=[...candidates.values()].filter(g=>!attempted.has(g.root.x_id));
        if(!pool.length) {if(await searchMore())continue;break;}
        const authorCounts=new Map();
        for(const g of groups) authorCounts.set(g.root.author_x_id,(authorCounts.get(g.root.author_x_id)??0)+1);
        if(pool.every(g=>(authorCounts.get(g.root.author_x_id)??0)>=2) && await searchMore()) continue;
        pool.sort((a,b)=>Number((authorCounts.get(a.root.author_x_id)??0)>=2)-Number((authorCounts.get(b.root.author_x_id)??0)>=2) || b.score-a.score || b.sourceReplyCount-a.sourceReplyCount);
        const group=pool[0];attempted.add(group.root.x_id);
        while(group.replies.length<SPORTS_TARGET.minimumReplies && !group.done && group.pages<3) {if(!await getMoreReplies(group))break;}
        if(group.replies.length>=SPORTS_TARGET.minimumReplies) groups.push(group);
      }
      const targets=allocateReplyTargets(groups);
      for(let i=0;i<groups.length;i++) groups[i].target=targets[i];
      // Enrich only after the minimum base. Already-returned valid comments are
      // free to retain; extra pagination still goes through the credit ledger.
      let progress=true;
      while(progress && groups.some(g=>!g.done && g.pages<maxReplyPages && g.replies.length<g.target)) {
        progress=false;
        for(const group of [...groups].sort((a,b)=>b.sourceReplyCount-a.sourceReplyCount)) {
          if(group.replies.length>=group.target || group.done)continue;
          progress=(await getMoreReplies(group))||progress;
        }
      }
    } catch(error) {
      if(!/^TWITTERAPI_(?:BUDGET_EXHAUSTED|INSUFFICIENT_BALANCE|OFFLINE_CACHE_MISS|UTC_DAY_CHANGED)$/.test(error.message)) throw error;
      reason=error.message;
    }
    candidatesCount=candidates.size;
    // If a budget exit occurred before enrichment, still allocate varied real
    // comments from the pages already paid for.
    const targets=allocateReplyTargets(groups);
    groups=groups.map((group,index)=>({root:group.root,sourceReplyCount:group.sourceReplyCount,replies:group.previouslyPublished?group.replies:group.replies.slice(0,Math.min(SPORTS_TARGET.maximumReplies,targets[index]))}));
    validateGroups(groups,now);
    await writePrivateJson(manifestPath,{day,generatedAt:now.toISOString(),groups,reason,candidates:candidatesCount,rejected});
  }
  const roots=groups.length;const replies=countReplies(groups);
  const status=roots===SPORTS_TARGET.roots?'completed':reason==='TWITTERAPI_BUDGET_EXHAUSTED'?'budget_exhausted':roots?'partial':'insufficient_content';
  if(!preview) {
    if(!db) throw new Error('Publishing requires database access');
    const rows=groups.flatMap(group=>[group.root,...group.replies]);
    // The transaction publishes content and records its day-level allowance
    // together. A lost response can be retried without an unrecorded batch.
    dbValue(await db.rpc('publish_twitterapi_sports_batch',{p_day:day,p_rows:rows,p_status:status}),'publishing sports batch atomically');
  }
  const report={day,status,reason,preview,roots,replies,replyCounts:groups.map(g=>({id:g.root.x_id,count:g.replies.length})),candidates:candidatesCount,rejected,usage:{...client.stats},limits:client.budget??{dailyCredits:11300,rolling30Credits:339000},nativeDataChanged:false};
  await writePrivateJson(path.join(directory,'report.json'),report);
  return report;
}

async function main() {
  const args=process.argv.slice(2);
  const preview=args.includes('--preview'); const offline=args.includes('--offline');
  if(args.some(arg=>!['--preview','--offline','--publish-cache','--retry-today','--refresh-news-search'].includes(arg) && !['--seed-trial=','--max-search-pages=','--max-reply-pages=','--candidate-ids='].some(prefix=>arg.startsWith(prefix)))) throw new Error('Unsupported importer option');
  if(offline && !preview) throw new Error('Offline mode is preview only');
  if(!preview && process.env.TWITTERAPI_IMPORT_ENABLED!=='true') {console.log(JSON.stringify({status:'disabled'}));return;}
  const stateDir=path.resolve(process.env.TWITTERAPI_STATE_DIR??'/var/lib/arabtips-twitterapi');
  const now=new Date();
  await prunePrivateCache(stateDir,now);
  const seed=args.find(arg=>arg.startsWith('--seed-trial='));
  if(seed) await seedTrialCache({trialDir:path.resolve(seed.slice('--seed-trial='.length)),stateDir,day:utcDay(now)});
  const needDb=!offline || !preview;
  const db=needDb?createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}}):null;
  const readOnlyCache=offline||args.includes('--publish-cache');
  const key=readOnlyCache?'':(process.env.TWITTERAPI_KEY_FILE?await fs.readFile(process.env.TWITTERAPI_KEY_FILE,'utf8'):process.env.TWITTERAPI_KEY??'').trim();
  const client=await createTwitterApiClient({db,key,stateDir,day:utcDay(now),offline:readOnlyCache});
  const maxSearchPages=Number(args.find(arg=>arg.startsWith('--max-search-pages='))?.split('=')[1]??8);
  const maxReplyPages=Number(args.find(arg=>arg.startsWith('--max-reply-pages='))?.split('=')[1]??6);
  const seedCandidateIds=(args.find(arg=>arg.startsWith('--candidate-ids='))?.split('=')[1]??'').split(',').filter(Boolean);
  const report=await runTwitterApiSportsImport({db,client,stateDir,now,preview,offline,publishCache:args.includes('--publish-cache'),allowSameDayRetry:args.includes('--retry-today'),refreshNewsSearch:args.includes('--refresh-news-search'),seedCandidateIds,maxSearchPages,maxReplyPages});
  console.log(JSON.stringify(report));
}

if(process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
  if(process.env.TWITTERAPI_SPORTS_LOCKED!=='1') {
    const lock=process.env.TWITTERAPI_LOCK_FILE??'/tmp/arabtips-twitterapi-sports.lock';
    if(!lock.startsWith('/tmp/') || lock.includes('..')) throw new Error('Invalid importer lock path');
    const child=spawnSync('flock',['-n',lock,process.execPath,path.resolve(process.argv[1]),...process.argv.slice(2)],{stdio:'inherit',env:{...process.env,TWITTERAPI_SPORTS_LOCKED:'1'}});
    if(child.error) throw child.error;
    process.exitCode=child.status??1;
  } else main().catch(error=>{console.error(`Sports importer stopped: ${error.message}`);process.exitCode=1;});
}
