import { hasSourceBrand, isArabicPost } from './sync-core.mjs';

// This module classifies only the isolated imported feed. Native site posts,
// members and moderator permissions are intentionally outside its scope.
export const NEWS_SOURCES = [
  'beINSPORTSNews', 'beINSPORTS', 'kooora', 'ariyadhiah', 'filgoal',
  'Yallakoranow', 'GoalAR', 'SPORT360AR', 'AlkassTVSports', 'ADSportsTV',
  'ssc_sports', 'SaudiNT', 'saudiFF', 'FCBarcelona_ar', 'realmadridarab',
  'Alhilal_FC', 'ittihad', 'AlNassrFC', 'ALAHLI_FC', 'Forca_Fcb',
];
const TRUSTED_SOURCES = new Set(NEWS_SOURCES.map(name => name.toLowerCase()));
const ID = /^\d{1,25}$/;
const USERNAME = /^[A-Za-z0-9_]{1,15}$/;
const URL_IN_TEXT = /(?:https?:\/\/|www\.|(?:^|\s)[\w-]+\.(?:com|net|org|io|bet|me)\b)/iu;
const SPORTS = /كرة|مبارا|دوري|بطول|منتخب|لاعب|مدرب|هدف|اهداف|موسم|برشلون|ريال مدريد|مانشستر|ليفربول|الهلال|النصر|الاتحاد|الاهلي|باريس|تشيلسي|ارسنال|يوفنتوس|ميلان|بايرن|تنس|فورمولا|السله|اولمبي|رونالدو|ميسي|فليك|بيرنال|ارنولد/iu;
const EVENT = /نهايه المباراه|نتيجه|يفوز|فوز|فاز|حسم|ينتصر|انتصار|يتاهل|تاهل|تتاهل|توج|يتوج|تتويج|فاز|خسار|هزيمه|تعادل|استقبل|يسجل|سجل|تسجيل|يضيف الهدف|احرز|تقدم|يرفع رصيده|يتصدر|ترتيب|الجوله|تشكيل|قائمه|قرعه|مواجه|صافره|انطلاق|تنطلق|موعد|توقيت|تقام|ستقام|تستانف|تستضيف|انتقال|تعاقد|يوقع|توقيع|تجديد|يجدد|اعلن|اعلان|رسمي|اصاب|يغيب|غياب|تعافي|يعود|عوده|تدريب|مران|استدعاء|اقاله|استقال|اعتزال|ايقاف|عقوبه|غرامه|رقم قياسي|ارقام|احصائي|استبدال|استبداله|تبديل|اداء|تنظيم|سيطر|تكتيك|مؤتمر صحفي/iu;
const FAN_BAIT = /وش تشجع|ويش تشجع|مين تشجع|من تشجع|توافق|بتوافق|برايك|رايكم|توقعاتكم|تتوقع|اتحدي|تحدي التوقع|سؤال للجمهور|جاوب|اختار|اختر|مع او ضد|هل انت مع|ليش .*مكروه|لماذا .*مكروه|الوعد جدام|اخذ ثار|ناخذ ثار|ثاركم|كرامتنا المسلوبه|تصقع|يتصقع|صقع|يخضع|لوبي|طاقيه|زعول|يحرق|يحترق|كيف النوم|مساء الخير|صباح الخير|مساكم|صباحكم|ناموا|نامو|لو يحكم|لا يمكن يفوز بطريقه صحيحه|اكذب واهبد|يجيكم|جيتكم|بخليج/iu;
const PROMOTION = /#اعلان(?=$|[^\p{L}\p{N}])|(?:^|\n)\s*اعلان\s*[:：]|(?:^|\s|#)(?:ad|sponsored)(?=$|\s|[#:])/iu;
const PROMOTION_PHRASES = /كود خصم|كوبون|خصم خاص|تخفيض|احجز.{0,20}تذاكر|اشتر.{0,15}تذاكر|رابط الحجز|اربح|اربحوا|وتربح|للفوز.{0,25}(?:جائزه|تذكره)|سحب|السحب|مسابقه|شروط المسابق|جائزه|جوائز|هدايا|هديه|تذكره ذهبيه|تذاكر مجانيه|تطبق الشروط|الرسائل الخاصه|لايك.{0,35}(?:ريبوست|اعاده نشر|منشن)|تابع.{0,25}(?:واربح|للدخول|السحب)|(?:\d|[٠-٩]).{0,10}(?:ريال|دولار).{0,25}(?:تستاهل|مبروك)|تستاهل.{0,30}(?:ريال|دولار)|سجل الان|رابط الاحاله|بونص|رهان مجاني|بث مباشر|مشاهده.{0,15}(?:المباراه|مباشر)|رابط البث|رابط.{0,20}(?:البايو|تليجرام|تلغرام)|\b(?:giveaway|promo|discount|coupon|whatsapp|telegram|iptv|free\s*stream)\b/iu;

export function normalizeArabicForModeration(value) {
  return String(value ?? '').normalize('NFKC')
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640\u200B-\u200F\u202A-\u202E\u2060-\u206F]/gu, '')
    .replace(/[أإآٱ]/gu, 'ا').replace(/ى/gu, 'ي').replace(/ة/gu, 'ه').toLowerCase();
}

function hasImportedSourceBrand(value) {
  const text = String(value ?? '');
  // NFKC handles mathematical/fullwidth X, but not the squared logo glyph.
  return /🆇/u.test(text) || hasSourceBrand(text.normalize('NFKC'));
}

export function hasProfanityOrInsult(value) {
  const text = normalizeArabicForModeration(value).replace(/\s+/gu, ' ');
  // Match whole Arabic tokens: كأس، نقاط، تخطيط and similar sports words
  // must not be confused with short obscenities embedded inside a word.
  const tokens = text.match(/[\p{L}\p{N}]+/gu) ?? [];
  const abusive = /^(?:و|ف)?(?:يا)?(?:ال)?(?:كلب|كلاب|حمار|حمير|حماره|جحش|جحوش|قذر|قذره|قذرين|وصخ|وسخ|وسخين|زباله|زبالات|زق|خرا|خراء|شرموط|شرموطه|شراميط|منيوك|منيوكه|عرص|معرص|عرصه|قحبه|قحاب|شرمطه|كسم|كسمك|كسمه|كسامك|كساختك|كسختك|كس|زبي|زب|طيز|طيزك|قواد|قوادين|خنيث|خنيثه|نصاب|نصابين|كذاب|كذابين|كذابه|غبي|اغبياء|غباء|احمق|حمقي|سفيه|سفهاء|حقير|حقيره|حقيرين|تافه|تافهه|تافهين|متخلف|متخلفين|معتوه|معتوهين|ابله|اهبل|هبل|مخنث|عبيد|حيوان|حيوانات|جرذ|جرذان|نذل|انذال|حثاله|شرذمه|انذل|ينبح|نباح|انبح|اهبد|يطقطق|يلعن|لعنه|يلعنهم|تفوو|تفووو|تف)(?:ك|كم|ه|ها|هم)?$/u;
  if (tokens.some(token => abusive.test(token))) return true;
  if (tokens.some(token => /^(?:و|ف)?(?:يا)?(?:ال)?(?:بهيم|بهيمه|بهايم|بهائم|بقر|بقره|بقرديه|خنزير|خنازير|جرذي|جرذيه|ديوث|ديايث|خسيس|خسيسه|منحط|منحطه|متناك|متناكه|يخسي|يخسون)(?:ك|كم|ه|ها|هم)?$/u.test(token))) return true;
  if (tokens.some(token => /^(?:و|ف)?(?:يا)?(?:ال)?(?:دلخ|دلخه|دلوخ|امحق)(?:ك|كم|ه|ها|هم)?$/u.test(token))) return true;
  if (tokens.some(token => /^(?:و|ف)?(?:لل|بال|هال|ال|يا)?(?:عاهه|عاهات|هطف|هطوف|وضيع|وضيعه|وضعاء|عهر|معفن|معفنه|طز|تخسي|تخسون|تخسوا|تفو+|جحشلونه|جحشلونا|كيلاب)(?:ك|كم|ه|ها|هم)?$/u.test(token))) return true;
  if (tokens.some(token => /^(?:و|ف)?غب(?:اء|ائ|اؤ)(?:ه|ها|هم|ك|كم)?$/u.test(token))) return true;
  // These are directed insults/curse phrases, not negative sports analysis.
  // Keep ordinary criticism such as مهزلة، كارثة، دفاع ضعيف and تطبيل.
  if (/(?:^|[^\p{L}\p{N}])(?:يا\s*روح\s*امك|يا\s*(?:اعلام|صحافه)\s+الغفله|ابو\s+الكذب|يخرب\s*(?:بيت|يت)|(?:يا|انت|انتي|هذا|هذي)\s+(?:اعور|عوراء|زرافه))(?=$|[^\p{L}\p{N}])/u.test(text)) return true;
  if (/(?:صحافه|اعلام|صحفي|اعلامي)\s+(?:الزفت|القرف)(?=$|[^\p{L}\p{N}])/u.test(text)) return true;
  // A short named subject followed by this euphemism is a personal put-down;
  // do not reject the courtesy phrase when it occurs within ordinary prose.
  if (/^\s*(?:[\p{L}\p{N}]+\s+){1,4}و?انتم\s+بكرامه\s*[.!،…]*\s*$/u.test(text)) return true;
  if (/(?:لازم|يتعمل|اعملوا|سووا|نعمل|نسوي).{0,25}حمله\s+(?:ع|علي)\s+(?:الواد|اللاعب|الشخص)(?=$|[^\p{L}\p{N}])/u.test(text)) return true;
  if (/(?:^|[^\p{L}\p{N}])(?:هالقواطي|عقليه\s+خضير|عجوز\s+التسلل|جسم\s+البغال|بقاره\s+اللاعبين|(?:المدرب|مدربنا|مدربهم|فليك)\s+سباك|(?:زقت|رقت)\s+علي\s+جو\s+المباراه)(?=$|[^\p{L}\p{N}])/u.test(text)) return true;
  if (/الوضاعه.{0,30}عروقكم|(?:ينزل|تنزل|يخلع|تخلع)\s+(?:ال)?سروال(?:ه|ها|ك)?(?=$|[^\p{L}\p{N}])|(?:اهين|اهانه)\s+كل\s+لاعب/u.test(text)) return true;
  if (/(?:تجي|تاتي|تتكلم|تحكي)\s+بكل\s+وقاحه|الله\s+لا\s*يوفق|جعل.{0,60}تحرم\s+عليه\s+الراحه|(?:ذا|هذا)\s+الطعميه.{0,30}(?:انبطاح|خايف|خائف)|عيش\s+يا\s+كدين+|(?:صرمايه|حذاء).{0,30}اشرف\s+من/u.test(text)) return true;
  // Match explicit dehumanization/sexual sectarian abuse, not nationalities,
  // religions, political organizations, or ordinary criticism of them.
  if (/(?:اقذر|اكره)\s+الشعوب|محور\s+(?:المتعه|المماتعه)|دوره\s+تمتع\s+بكربلاء|امتطاء\s+ايران\s+لهم|حفره\s+(?:ال)?مجاري.{0,45}للتبرك/u.test(text)) return true;
  if (/(?:العقول|عقلك|عقولهم)\s+المريضه|مريض\s+(?:انت|انتي|انتم)|(?:انت|انتي)\s+مريض|قليل\s+الادب|عديم\s+الاخلاق|بلا\s+شرف/u.test(text)) return true;
  if (/(?:يلعن|لعنه|لعن|تفل|ابصق|بصق|نيك|انيك|انكح|نعل).{0,20}(?:امك|امه|اختك|ابوك|ابوه|ابو|اهلك|شرف|وجهك|والدي|ربك|دينك)|ابن.{0,8}(?:الحرام|زنا)|كس[\s._*-]*(?:ام|اخت)|ك[\s._*-]*س[\s._*-]*ا?[\s._*-]*م[\s._*-]*ك/u.test(text)) return true;
  return /\b(?:fuck\w*|shit\w*|bitch\w*|asshole\w*|cunt\w*|motherfucker\w*|idiot\w*|moron\w*|retard\w*)\b/iu.test(text);
}

export function isPromotional(value) {
  const text = normalizeArabicForModeration(value);
  return PROMOTION.test(text) || PROMOTION_PHRASES.test(text.replace(/\s+/gu, ' ')) || /🎁|💸/u.test(text);
}

function hasPromotionalAuthorLabel(value) {
  const name = normalizeArabicForModeration(value).replace(/\s+/gu, ' ');
  // These labels advertise services even when the reply itself just says
  // congratulations. Keep this check out of prose about student athletes.
  return /(?:^|[^\p{L}\p{N}])متجر.{0,50}اشتراك(?:ات)?(?=$|[^\p{L}\p{N}])/u.test(name) ||
    /(?:^|[^\p{L}\p{N}])(?:ال)?خدمات\s+(?:[\p{L}]{1,20}\s+){0,2}(?:طلابيه|الطلابيه|طلاب|الطلاب|للطلاب)(?=$|[^\p{L}\p{N}])/u.test(name);
}

function proseForLanguage(value) {
  return String(value ?? '').replace(/https?:\/\/\S+/gu, '').replace(/@[A-Za-z0-9_]+/gu, '');
}

// The site owner requested removal of the API's leading reply addressees.
// Preserve meaningful mentions later in the sentence and email addresses.
export function cleanReplyText(value) {
  const original = String(value ?? '');
  let text = original;
  let removed = false;
  for (;;) {
    const match = text.match(/^\s*@[A-Za-z0-9_]{1,15}(?=$|[\s:：،,])[\s:：،,]*/u);
    if (!match) break;
    text = text.slice(match[0].length);
    removed = true;
  }
  return removed ? text.trimStart() : original;
}

export function isSportsNewsText(value, username = '') {
  const text = normalizeArabicForModeration(proseForLanguage(value)).replace(/\s+/gu, ' ');
  if (text.replace(/[^\p{L}\p{N}]/gu, '').length < 24 || FAN_BAIT.test(text) || /[?؟]/u.test(text)) return false;
  if (!EVENT.test(text)) return false;
  return SPORTS.test(text) || TRUSTED_SOURCES.has(String(username).toLowerCase());
}

function mediaUrl(value, avatar = false) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash || url.href.length > 2048) return null;
    if (url.hostname === 'pbs.twimg.com') return url.href;
    if (!avatar && url.hostname === 'video.twimg.com') return url.href;
    if (avatar && url.hostname === 'abs.twimg.com' && url.pathname === '/sticky/default_profile_images/default_profile_normal.png' && !url.search) return url.href;
  } catch { /* Invalid provider media is omitted, never fetched. */ }
  return null;
}

// Accept media only when the provider supplies an actual safe asset and an
// attachment URL for this exact post. A quoted post's URL is never stripped.
function ownMediaLink(entity, postId) {
  try {
    const short = new URL(entity?.url);
    const expanded = new URL(entity?.expanded_url ?? entity?.expandedUrl);
    if (short.protocol !== 'https:' || short.hostname !== 't.co' || short.username || short.password || short.port || short.hash) return null;
    if (expanded.protocol !== 'https:' || !/^(?:www\.)?(?:x|twitter)\.com$/u.test(expanded.hostname) || expanded.username || expanded.password || expanded.port || expanded.hash) return null;
    const match = expanded.pathname.match(/^\/[A-Za-z0-9_]{1,15}\/status\/(\d{1,25})\/(?:photo|video)\/[1-9]\d*\/?$/u);
    return match?.[1] === String(postId) ? short.href : null;
  } catch { return null; }
}

export function extractDisplayContent(tweet) {
  const note = tweet?.note_tweet ?? tweet?.noteTweet;
  let text = String(note?.text ?? tweet?.text ?? '');
  const entities = note?.entities ?? tweet?.entities ?? {};
  const rawMedia = [
    ...(tweet?.extendedEntities?.media ?? []), ...(tweet?.extended_entities?.media ?? []),
    ...(entities.media ?? []),
  ];
  const removedTokens = new Set();
  const media = [];
  const assets = new Set();
  for (const item of rawMedia) {
    const url = mediaUrl(item.media_url_https ?? item.mediaUrlHttps ?? item.preview_image_url ?? item.url);
    if (!url || !['photo', 'video', 'animated_gif'].includes(item.type)) continue;
    const token = ownMediaLink(item, tweet.id);
    if (!token) continue;
    removedTokens.add(token);
    if (!assets.has(url)) {
      assets.add(url);
      const alt = item.ext_alt_text ?? item.alt_text ?? null;
      media.push({ type: item.type, url, alt_text: typeof alt === 'string' && !hasImportedSourceBrand(alt) && !hasProfanityOrInsult(alt) ? alt.slice(0, 1000) : null });
    }
  }
  // An entities.urls copy may contain the short token while media has the
  // expanded attachment URL. Only accept an exact same own-media identity.
  for (const item of entities.urls ?? []) {
    const token = ownMediaLink(item, tweet.id);
    if (token && rawMedia.some(media => ownMediaLink(media, tweet.id) === token && mediaUrl(media.media_url_https ?? media.mediaUrlHttps ?? media.preview_image_url ?? media.url))) removedTokens.add(token);
  }
  for (const token of removedTokens) {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
    text = text.replace(new RegExp(`(^|\\s)${escaped}(?=\\s|$)`, 'gu'), '$1');
  }
  return { text: removedTokens.size ? text.trimEnd() : text, media };
}

export function isCleanArabicSportsRow(row, { requireNews = false } = {}) {
  if (!row || typeof row !== 'object') return false;
  const body = String(row.body ?? '');
  const name = String(row.author_name ?? '');
  const username = String(row.author_username ?? '');
  if (!name.trim() || !USERNAME.test(username) || !mediaUrl(row.author_avatar_url, true)) return false;
  if (row.language !== 'ar' || !isArabicPost({ text: proseForLanguage(body), lang: row.language })) return false;
  if (URL_IN_TEXT.test(body) || hasImportedSourceBrand(body) || hasImportedSourceBrand(name) || hasImportedSourceBrand(username)) return false;
  if (hasProfanityOrInsult(body) || hasProfanityOrInsult(name) || hasProfanityOrInsult(username) || isPromotional(body) || isPromotional(name) || hasPromotionalAuthorLabel(name)) return false;
  if (row.links_json != null && (!Array.isArray(row.links_json) || row.links_json.length)) return false;
  if (row.media_json != null && !Array.isArray(row.media_json)) return false;
  if ((row.media_json ?? []).some(media => media?.alt_text && (hasImportedSourceBrand(media.alt_text) || hasProfanityOrInsult(media.alt_text)))) return false;
  return !requireNews || isSportsNewsText(body, username);
}

export function classifyTwitterApiTweet(tweet, {
  matchedQuery = '', now = new Date(), retentionHours = 48, rootId = null,
  minSourceReplies = 35, since = Math.floor(now.getTime() / 1000) - 86400,
} = {}) {
  const reject = reason => ({ row: null, reason });
  const author = tweet?.author;
  if (!ID.test(String(tweet?.id ?? '')) || !ID.test(String(author?.id ?? '')) || !author) return reject('identity_missing');
  if (tweet.unavailable || author.unavailable || author.protected || tweet.withheld || author.withheld || (tweet.withheldInCountries?.length ?? 0) || (author.withheldInCountries?.length ?? 0)) return reject('unavailable');
  if (tweet.possiblySensitive || tweet.possibly_sensitive || tweet.sensitive || author.possiblySensitive) return reject('sensitive');
  if (tweet.isRetweet || tweet.retweeted_tweet || tweet.retweetedTweet || /^RT\s+@/u.test(tweet.text ?? '')) return reject('retweet');
  const parent = tweet.inReplyToId == null || tweet.inReplyToId === '' ? null : String(tweet.inReplyToId);
  const conversation = String(tweet.conversationId ?? tweet.id);
  if (rootId) {
    if (parent !== String(rootId) || conversation !== String(rootId)) return reject('not_direct_reply');
  } else {
    if (parent || tweet.isReply) return reject('reply_as_root');
    if (conversation !== String(tweet.id)) return reject('wrong_root_conversation');
    if (!Number.isFinite(Number(tweet.replyCount)) || Number(tweet.replyCount) < minSourceReplies) return reject('low_source_reply_count');
  }
  const posted = new Date(tweet.createdAt);
  if (!Number.isFinite(posted.getTime()) || posted.getTime() > now.getTime() + 300000) return reject('invalid_time');
  if (!rootId && posted.getTime() < Number(since) * 1000) return reject('outside_time_window');
  const content = extractDisplayContent(tweet);
  const row = {
    x_id: String(tweet.id), conversation_id: conversation, in_reply_to_x_id: parent,
    author_x_id: String(author.id), author_username: String(author.userName ?? ''),
    author_name: String(author.name ?? '').slice(0, 100), author_avatar_url: mediaUrl(author.profilePicture, true),
    body: rootId ? cleanReplyText(content.text) : content.text, posted_at: posted.toISOString(), language: tweet.lang ?? null,
    media_json: content.media, links_json: [], matched_query: String(matchedQuery).slice(0, 500),
    last_synced_at: now.toISOString(), expires_at: new Date(now.getTime() + Math.min(168, Math.max(1, retentionHours)) * 3600000).toISOString(),
    deleted_at: null, is_visible: true,
  };
  if (!isCleanArabicSportsRow(row)) return reject('language_identity_link_or_moderation');
  if (!rootId && !isSportsNewsText(row.body, row.author_username)) return reject('not_news_event');
  return { row, reason: null };
}

export function normalizeTwitterApiTweet(tweet, options) {
  return classifyTwitterApiTweet(tweet, options).row;
}

export function scoreNewsCandidate(tweet) {
  const { text } = extractDisplayContent(tweet);
  if (!isSportsNewsText(text, tweet?.author?.userName) || isPromotional(text) || hasProfanityOrInsult(text)) return -1;
  const authority = TRUSTED_SOURCES.has(String(tweet?.author?.userName ?? '').toLowerCase()) ? 200 : 0;
  return authority + Math.min(150, Number(tweet.replyCount) || 0) + Math.min(50, (Number(tweet.likeCount) || 0) / 50);
}

export function buildNewsQueries({ since, until }) {
  if (!Number.isSafeInteger(since) || !Number.isSafeInteger(until) || since >= until) throw new Error('A bounded news search window is required');
  const filters = `lang:ar min_replies:50 -filter:retweets -filter:replies since_time:${since} until_time:${until}`;
  const events = '(نتيجة OR رسمي OR رسميا OR أعلن OR إصابة OR انتقال OR تعاقد OR فوز OR تأهل OR قرعة OR تشكيل OR ترتيب OR هدف OR أهداف OR إيقاف OR أداء)';
  const sourceGroups = [
    ['beINSPORTS', 'beINSPORTSNews', 'AlkassTVSports', 'ADSportsTV'],
    ['kooora', 'filgoal', 'Yallakoranow', 'GoalAR', 'SPORT360AR'],
    ['ariyadhiah', 'ssc_sports', 'SaudiNT', 'saudiFF'],
    ['FCBarcelona_ar', 'realmadridarab', 'Forca_Fcb'],
    ['Alhilal_FC', 'ittihad', 'AlNassrFC', 'ALAHLI_FC'],
  ];
  // Separate pools keep one busy club or broadcaster from filling the entire
  // shortlist; even official accounts must supply substantive event content.
  return [
    ...sourceGroups.map(sources => `(${sources.map(name => `from:${name}`).join(' OR ')}) ${events} ${filters}`),
    `("كرة القدم" OR "كرة السلة" OR التنس OR فورمولا OR "دوري أبطال" OR منتخب OR الزمالك OR ليفربول OR آرسنال) ${events} ${filters}`,
  ];
}
