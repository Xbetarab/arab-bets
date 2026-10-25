import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

export const TWITTERAPI_LIMITS = Object.freeze({ dailyCredits: 11300, rolling30Credits: 339000, pricePerItem: 15, searchPage: 20, replyPage: 100 });
const BASE = 'https://api.twitterapi.io';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
export const hashRequest = value => createHash('sha256').update(value).digest('hex');
export function utcDay(now = new Date()) { return now.toISOString().slice(0, 10); }

export async function writePrivateJson(filename, data) {
  await fs.mkdir(path.dirname(filename), { recursive: true, mode: 0o700 });
  const tmp = `${filename}.${process.pid}.tmp`;
  await fs.writeFile(tmp, `${JSON.stringify(data)}\n`, { mode: 0o600 });
  await fs.rename(tmp, filename);
}

// Preserve public content and media evidence needed by the display filter.
// No cookies, account credentials, author bios, locations or nested quoted posts.
export function cacheTweet(t) {
  const author = t?.author ?? {};
  const result = {};
  for (const key of ['id','text','fullText','full_text','createdAt','lang','isReply','inReplyToId','conversationId','replyCount','likeCount','retweetCount','possiblySensitive','possibly_sensitive','unavailable','withheld','withheldInCountries','entities','extendedEntities','extended_entities','media','displayTextRange','noteTweet','note_tweet']) {
    if (t?.[key] !== undefined) result[key] = t[key];
  }
  result.isRetweet = !!(t?.retweeted_tweet || t?.retweetedTweet || t?.isRetweet || /^RT @/.test(t?.text ?? ''));
  if (t?.sensitive === true) result.possiblySensitive = true;
  result.author = {};
  for (const key of ['id','name','userName','profilePicture','protected','unavailable','possiblySensitive','withheld','withheldInCountries']) if (author[key] !== undefined) result.author[key] = author[key];
  return result;
}

function dbValue(result, purpose) {
  if (result?.error) {
    if (/TWITTERAPI_BUDGET_EXHAUSTED/.test(result.error.message ?? '')) throw new Error('TWITTERAPI_BUDGET_EXHAUSTED');
    throw new Error(`Database failed during ${purpose}`);
  }
  return result?.data;
}

export async function createTwitterApiClient({ db, key, stateDir, day = utcDay(), fetchImpl = fetch, waitImpl = sleep, intervalMs = 5500, now = () => new Date(), offline = false }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error('Invalid cache day');
  if (!path.isAbsolute(stateDir)) throw new Error('Private cache directory must be absolute');
  if (!offline && (!key || /[\r\n]/.test(key))) throw new Error('TwitterAPI credential is unavailable');
  const cacheDir = path.join(stateDir, day, 'cache');
  await fs.mkdir(cacheDir, { recursive: true, mode: 0o700 });
  let lastRequestAt = 0;
  let availableBalance = null;
  let budget = {dailyCredits:TWITTERAPI_LIMITS.dailyCredits,rolling30Credits:TWITTERAPI_LIMITS.rolling30Credits};
  const stats = { apiCalls: 0, cacheHits: 0, credits: 0, returnedItems: 0 };

  async function pacedFetch(url) {
    await waitImpl(Math.max(0, intervalMs - (Date.now() - lastRequestAt)));
    lastRequestAt = Date.now();
    let response;
    try { response = await fetchImpl(url, { headers: { 'X-API-Key': key, Accept: 'application/json' }, redirect: 'error', signal: AbortSignal.timeout(45000) }); }
    catch { throw new Error('TWITTERAPI_REQUEST_FAILED'); }
    if (!response.ok) throw new Error(`TWITTERAPI_HTTP_${response.status}`);
    let value;
    try { value = await response.json(); } catch { throw new Error('TWITTERAPI_INVALID_RESPONSE'); }
    if (value?.status === 'error' || value?.error) throw new Error('TWITTERAPI_PROVIDER_ERROR');
    return value;
  }

  async function balance() {
    if (offline) return null;
    const data = await pacedFetch(new URL('/oapi/my/info', BASE));
    if (!Number.isFinite(data?.recharge_credits) || !Number.isFinite(data?.total_bonus_credits) || data.recharge_credits < 0 || data.total_bonus_credits < 0) throw new Error('TWITTERAPI_BALANCE_UNAVAILABLE');
    availableBalance = data.recharge_credits + data.total_bonus_credits;
    return { rechargeCredits: data.recharge_credits, bonusCredits: data.total_bonus_credits, totalCredits: availableBalance };
  }

  async function remainingCredits() {
    // Read the database's full ledger and date-bound allowances. The process
    // cannot reset this budget or grant itself extra spending through env vars.
    const data=dbValue(await db.rpc('get_twitterapi_sports_budget'),'reading credit allowance');
    if(data?.day!==utcDay(now())) throw new Error('TWITTERAPI_UTC_DAY_CHANGED');
    for(const key of ['dailyCredits','rolling30Credits','dailyUsedCredits','rolling30UsedCredits','remainingCredits']) {
      if(!Number.isSafeInteger(data?.[key]) || data[key]<0) throw new Error('Invalid usage allowance');
    }
    budget={...data};
    return data.remainingCredits;
  }

  async function request(endpoint, params = {}) {
    if (!['/twitter/tweet/advanced_search','/twitter/tweet/replies/v2','/twitter/tweets'].includes(endpoint)) throw new Error('Unsupported provider endpoint');
    const url = new URL(endpoint, BASE);
    for (const [name,value] of Object.entries(params)) if (value !== '' && value !== undefined && value !== null) url.searchParams.set(name, String(value));
    const requestHash = hashRequest(url.href);
    const filename = path.join(cacheDir, `${requestHash}.json`);
    try {
      const cached = JSON.parse(await fs.readFile(filename, 'utf8'));
      if (cached.requestHash !== requestHash || !Array.isArray(cached.payload?.tweets)) throw new Error('Private cache record is invalid');
      stats.cacheHits++;
      return cached.payload;
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (offline) throw new Error('TWITTERAPI_OFFLINE_CACHE_MISS');
    if (utcDay(now()) !== day) throw new Error('TWITTERAPI_UTC_DAY_CHANGED');
    const maxItems = endpoint === '/twitter/tweet/replies/v2' ? TWITTERAPI_LIMITS.replyPage : TWITTERAPI_LIMITS.searchPage;
    const reservation = maxItems * TWITTERAPI_LIMITS.pricePerItem + TWITTERAPI_LIMITS.pricePerItem;
    // Fast check avoids unnecessary account calls; SQL is the atomic authority.
    if (await remainingCredits() < reservation) throw new Error('TWITTERAPI_BUDGET_EXHAUSTED');
    if (availableBalance === null) await balance();
    if (availableBalance < reservation) throw new Error('TWITTERAPI_INSUFFICIENT_BALANCE');
    const usageId = dbValue(await db.rpc('reserve_twitterapi_sports_usage', { p_endpoint: endpoint, p_request_hash: requestHash, p_credits: reservation }), 'reserving provider credits');
    if (!usageId) throw new Error('Missing usage reservation');
    // Every exception after reservation intentionally keeps the full amount.
    const data = await pacedFetch(url);
    if (!Array.isArray(data?.tweets)) throw new Error('TWITTERAPI_INVALID_COLLECTION');
    if (data.tweets.length > maxItems) throw new Error('TWITTERAPI_PAGE_EXCEEDED_RESERVATION');
    const credits = Math.max(1, data.tweets.length) * TWITTERAPI_LIMITS.pricePerItem;
    const payload = { tweets: data.tweets.map(cacheTweet), has_next_page: !!data.has_next_page, next_cursor: typeof data.next_cursor === 'string' ? data.next_cursor : '' };
    // Cache first. A crash/settlement failure cannot cause another paid read of
    // the same response; its unreleased reservation remains conservative.
    await writePrivateJson(filename, { requestHash, receivedAt: now().toISOString(), usageId, payload });
    dbValue(await db.rpc('settle_twitterapi_sports_usage', { p_id: usageId, p_credits: credits, p_returned_items: data.tweets.length }), 'settling provider credits');
    availableBalance -= credits;
    stats.apiCalls++; stats.credits += credits; stats.returnedItems += data.tweets.length;
    return payload;
  }

  return { request, balance, remainingCredits, stats, cacheDir, get budget(){return {...budget};} };
}
