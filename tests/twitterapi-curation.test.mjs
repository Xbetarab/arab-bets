import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildNewsQueries, classifyTwitterApiTweet, cleanReplyText, extractDisplayContent,
  hasProfanityOrInsult, isCleanArabicSportsRow, isPromotional, isSportsNewsText,
} from '../src/lib/x-sports/twitterapi-curation.mjs';

const now = new Date('2026-10-21T18:00:00Z');
function tweet(text = 'نهاية المباراة: باريس سان جيرمان يفوز على برشلونة بأربعة أهداف مقابل هدفين', overrides = {}) {
  return {
    id: '2112649233316642991', text, createdAt: '2026-10-21T15:00:00Z', lang: 'ar',
    author: {id:'12345', name:'أخبار الملاعب', userName:'sportsnews', profilePicture:'https://pbs.twimg.com/profile_images/a.jpg'},
    conversationId:'2112649233316642991', inReplyToId:null, isReply:false, replyCount:80,
    ...overrides,
  };
}
const options = {now, retentionHours:48, minSourceReplies:35, matchedQuery:'twitterapi:news:result'};

test('news/event acceptance excludes the live-trial fan bait and promotional roots', () => {
  for (const text of [
    'نهاية المباراة: باريس سان جيرمان 4-2 برشلونة، التعثر الأول في الموسم',
    'أعلن برشلونة غياب لاعبه عن مباراة ريال مدريد بسبب الإصابة العضلية',
    'ترتيب الحضور الجماهيري في دوري روشن بعد الجولة العاشرة، الهلال يتصدر',
    'بعد خروج مارك بيرنال فقد برشلونة جزءا من تنظيمه واستقبل ثلاثة أهداف بعد استبداله',
    'إعلان قائمة منتخب السعودية الرسمية للمشاركة في بطولة كأس العالم',
  ]) assert.equal(isSportsNewsText(text), true, text);
  for (const text of [
    'متابعيني ويش تشجعون الهلال الاتحاد الأهلي النصر',
    'ليش النصر مكروه ؟',
    'لو ارنولد قرر يرجع ليفربول .. بتوافق؟',
    'تم اخذ ثار الهلال انتوا تتصقعون واحنا الي ناخذ ثاركم ياكثر جمايلك ياعالمي',
    'قدام الحكم انبرش على لاعب نيوم وجاب قلبه، لا يمكن يفوز بطريقة صحيحة',
    'مساء الخير لمشجعين برشلونة الحقيقيين فقط',
    'وصلنا إلى ملعب المباراة ونحن متحمسون جدا اليوم',
  ]) assert.equal(isSportsNewsText(text), false, text);
  for (const text of ['حل المعادلة واربح تذاكر مباراة الاتحاد، شروط المسابقة', 'احجزوا تذاكركم الحين لمباراة الأهلي والخليج', 'تستاهل يا اتحادي 500 ريال ألف مبروك', 'تستاهل يا اتحادي \n500 ريال\nالف مبروك', 'كود خصم لمتابعي أخبار برشلونة', '#إعلان عروض رياضية رائعة']) {
    assert.equal(isPromotional(text), true, text);
    assert.equal(classifyTwitterApiTweet(tweet(text),options).row,null);
  }
});

test('Arabic moderation rejects spelling variants and insults while keeping ordinary sports words', () => {
  for (const text of ['كس أمك', 'كـسـمـك', 'ك س ا م ك', 'ياكلب', 'كلاب الرشايده', 'يا غبي هذا اللاعب', 'يلعن أبو الإسبان', 'فليك بتفل على أبوه', 'هذا كذاب ونصاب', 'لكن تحبه البهايم', 'افهموا يا البقردية', 'صحيح انه جرذي', 'مريض انت', 'fuck you']) assert.equal(hasProfanityOrInsult(text),true,text);
  for (const text of ['كأس العالم بطولة قوية', 'النقاط تحتاج إلى تخطيط وتحليل', 'اكتسح الفريق منافسه بثلاثة أهداف', 'الخسارة مستحقة والأداء لم يكن جيدا', 'الفريق خارج التغطية والدفاع ضعيف']) assert.equal(hasProfanityOrInsult(text),false,text);
});

test('live-review insults and curse variants are rejected without suppressing match criticism', () => {
  for (const text of [
    'ميغيل انت دلخ', 'هذا أعور ميغيل', 'هذا أَعْـوَر ميغيل',
    'يا روح أمك اللاعب ليس جيدا', 'بعد خروج مين ياروح امك!!!!',
    'يا إعلام الغفلة', 'يا أعلام\nالغفلة', 'يا ابو الكذب', 'يا أبو\nالكذب',
    'أمحق من صحافة', 'امحق من صحافه', 'ميغيل سانز وأنتم بكرامة',
    'صحافة الزفت كاتلونيا يخرب بيت المجاملات والقرف',
    'صحافة الزفت', 'يخربيت البجاحة يا بشر', 'يخربيت الضحك', 'يخرب بيت الضحك',
    'لازم يتعمل حمله ع الواد دا زى تير شتيجن و يغور من النادى',
  ]) {
    assert.equal(hasProfanityOrInsult(text), true, text);
    assert.equal(classifyTwitterApiTweet(tweet(text, {isReply:true, inReplyToId:'2112649233316642991', id:'2112649233316642992'}), {...options, rootId:'2112649233316642991'}).row, null, text);
  }
  for (const text of [
    'حصانة الكتلونية صارت مهزلة برنال عشوائي و يتهرب من الكرة',
    'الخسارة كارثة والتغطية الدفاعية ضعيفة', 'لاعب منفوخ إعلاميا ويتحمل جزءا من الهدف',
    'بدينا تطبيل بعد مباراة ضعيفة', 'هذا القرار يخرب المشروع الرياضي',
    'إعلان حملة دعم اللاعب بعد الإصابة', 'أتحدث عن المباراة وأنتم بكرامة واحترام',
    'كأس العالم والنقاط تحتاج إلى تخطيط وتحليل',
  ]) assert.equal(hasProfanityOrInsult(text), false, text);
});

test('recurring moderation catches directed abuse without banning political labels or ordinary criticism', () => {
  for (const text of [
    'هذا درس للعاهات اللي يلعب فيهم', 'هطوف والله', 'تخسى تشم البطولة', 'تخسون تشمون البطولة',
    'تفو عليكم', 'تـفُوووو عليكم', 'وطز في الفريق', 'نادي وضيع', 'الوضاعة تمشي في عروقكم',
    'جحشلونه', 'هالقواطي مو راضين يفهمون', 'عقلية خضير', 'عجوز التسلل', 'جسم البغال وأحلام العصافير',
    'ينزل سرواله وتقولون الأفضل', 'يمال يخلع السروال', 'فليك رْقت على جو المباراة',
    'المدرب وغبائه في إدارة المباراة', 'مدريد معفن', 'يا فليك سباك', 'بسبب بقارة اللاعبين',
    'وتجي بكل وقاحة تحكي', 'الله لايوفق اللي كان السبب', 'جعل من حرم نادي النصر تحرم عليه الراحة',
    'ذا الطعمية فيه انبطاح للنصر', 'عُهر الموقف', 'عيش يا كدينننن', 'صرماية فلان أشرف من جمهوركم',
    'أقذر الشعوب كلها اجتمعت', 'تجمع أكره الشعوب', 'تجمعووو كىلاب',
    'منتخبات محور المتعة', 'بطولة محور المماتعة', 'ياخذ دورة تمتع بكربلاء',
    'لم يتوبوا من امتطاء إيران لهم', 'رحلة لحفرة المجاري للتبرك',
  ]) assert.equal(hasProfanityOrInsult(text), true, text);
  for (const text of [
    'الخسارة مهزلة والدفاع كارثي', 'التعثر الأقذر هذا الموسم', 'باريس دعس الفريق كرويا',
    'لاعب منفوخ إعلاميا', 'حسبي الله على من كان السبب', 'الله لا يسامح من وضع الرقابة',
    'خضير قدم تحليلا جيدا', 'أخبار نادي السيدة العجوز', 'سروال النادي الجديد',
    'رقت مشاعري عند تكريم اللاعب', 'سباك أصلح أنابيب الملعب', 'امتطاء الخيل رياضة جميلة',
    'انتقاد سياسة حكومة إيران', 'محور الممانعة', 'حزب الله وحماس', 'الشبيحة والفلول',
    'يجب أن يستقيل الوزير', 'الوزارة فاشلة', 'شعوب إيران ولبنان والعراق وفلسطين',
    'زيارة كربلاء والحسينية', 'الشيعة والسنة', 'تسمح الوزارة للشبيحة بالتواجد في الفضاء الرياضي',
    'النقاط تحتاج إلى تخطيط وتحليل وكأس العالم ينتظر',
  ]) assert.equal(hasProfanityOrInsult(text), false, text);
});

test('normalization keeps real author identity and a genuine clean direct reply', () => {
  const result = classifyTwitterApiTweet(tweet('@sportsnews التبديلات كانت جيدة لكن الفريق يحتاج إلى تنظيم دفاعي أفضل', {
    id:'2112649233316642992', isReply:true, inReplyToId:'2112649233316642991', replyCount:0,
  }), {...options,rootId:'2112649233316642991'});
  assert.equal(result.reason,null);
  assert.equal(result.row.author_name,'أخبار الملاعب');
  assert.equal(result.row.body,'التبديلات كانت جيدة لكن الفريق يحتاج إلى تنظيم دفاعي أفضل');
  assert.equal(result.row.in_reply_to_x_id,'2112649233316642991');
  assert.equal(result.row.expires_at,'2026-10-23T18:00:00.000Z');
  assert.ok(isCleanArabicSportsRow(result.row));
  const wrong = classifyTwitterApiTweet(tweet('التبديلات كانت جيدة ولكن الدفاع يحتاج إلى تركيز', {isReply:true,inReplyToId:'99'}), {...options,rootId:'88'});
  assert.equal(wrong.reason,'not_direct_reply');
});

test('only automatic leading reply mentions are removed; prose, emails and internal mentions remain', () => {
  assert.equal(cleanReplyText('@root @other: \nتحليل جميل للمباراة'), 'تحليل جميل للمباراة');
  assert.equal(cleanReplyText('\n@root:\n@other ، تحليل جميل للمباراة'), 'تحليل جميل للمباراة');
  assert.equal(cleanReplyText('تحليل جميل من @sports ومراسلة news@example.com'), 'تحليل جميل من @sports ومراسلة news@example.com');
  assert.equal(cleanReplyText('news@example.com رأي مفيد'), 'news@example.com رأي مفيد');
  assert.equal(cleanReplyText('  رأي مفيد دون منشن'), '  رأي مفيد دون منشن');
  assert.equal(cleanReplyText('@root @other'), '');
  assert.equal(classifyTwitterApiTweet(tweet('@root @other', {isReply:true,inReplyToId:'2112649233316642991',id:'2112649233316642992'}), {...options,rootId:'2112649233316642991'}).row,null);
});

test('only proven own attachment tokens are omitted; other text and URLs are never silently rewritten', () => {
  const prose='نهاية المباراة: باريس سان جيرمان يفوز على برشلونة بأربعة أهداف مقابل هدفين';
  const t=tweet(`${prose} https://t.co/abc`);
  t.extendedEntities={media:[{type:'photo',url:'https://t.co/abc',expanded_url:`https://x.com/sportsnews/status/${t.id}/photo/1`,media_url_https:'https://pbs.twimg.com/media/abc.jpg',ext_alt_text:'صورة المباراة'}]};
  t.entities={urls:[{url:'https://t.co/abc',expanded_url:`https://x.com/sportsnews/status/${t.id}/photo/1`}]};
  assert.equal(extractDisplayContent(t).text,prose);
  const result=classifyTwitterApiTweet(t,options);
  assert.equal(result.row.body,prose);
  assert.equal(result.row.media_json[0].url,'https://pbs.twimg.com/media/abc.jpg');
  assert.deepEqual(result.row.links_json,[]);
  t.extendedEntities.media[0].expanded_url='https://x.com/sportsnews/status/999/photo/1';
  assert.equal(classifyTwitterApiTweet(t,options).row,null,'quoted media must not count as own attachment');
  delete t.extendedEntities;
  assert.equal(classifyTwitterApiTweet(t,options).row,null,'unknown token remains and rejects the item');
  assert.equal(classifyTwitterApiTweet(tweet(`${prose} https://example.org/article`),options).row,null);
});

test('feed guard works with projected fields and rejects source links, profanity, malformed media, and non-Arabic text', () => {
  const {row}=classifyTwitterApiTweet(tweet(),options);
  const projection={body:row.body,language:row.language,author_name:row.author_name,author_username:row.author_username,author_avatar_url:row.author_avatar_url,media_json:row.media_json,links_json:row.links_json};
  assert.equal(isCleanArabicSportsRow(projection,{requireNews:true}),true);
  for(const patch of [{body:row.body+' تويتر'}, {body:row.body+' https://t.co/abc'}, {author_name:'Twitter sports'}, {body:'هذا المدرب غبي جدا ومعتوه'}, {language:'en'}, {author_avatar_url:'http://pbs.twimg.com/a.jpg'}, {media_json:{}}, {links_json:[{url:'https://x.com/a'}]}]) assert.equal(isCleanArabicSportsRow({...projection,...patch}),false);
  for (const logo of ['🆇', '𝕏', 'ⓧ', 'Ｘ']) {
    assert.equal(isCleanArabicSportsRow({...projection,author_name:`معلق ${logo}`}),false,logo);
    assert.equal(isCleanArabicSportsRow({...projection,body:`${row.body} ${logo}`}),false,logo);
  }
  assert.equal(isCleanArabicSportsRow({...projection,body:'نتيجة المباراة أربعة أهداف مقابل هدفين 4×2'}),true);
});

test('commercial author labels are filtered without suppressing student-athlete news', () => {
  const {row}=classifyTwitterApiTweet(tweet(),options);
  for (const name of ['نهضة الخدمات الطلابية', 'متجر رولس اشتراكات 4k', 'خدمات تعليمية للطلاب', 'نهضة الخـدمات الطُلابية']) {
    assert.equal(isCleanArabicSportsRow({...row,author_name:name,body:'ألف مبروك الفوز المستحق والقادم أجمل بإذن الله'}),false,name);
  }
  const news='فاز طلاب الجامعة ببطولة كرة السلة وأعلنت الجامعة خدمات جديدة للطلاب الرياضيين';
  assert.equal(isPromotional(news),false);
  assert.equal(isCleanArabicSportsRow({...row,author_name:'منتخب الجامعة الرياضي',body:news},{requireNews:true}),true);
  assert.equal(isCleanArabicSportsRow({...row,author_name:'أخبار الرياضة الجامعية',body:'فريق الجامعة لكرة السلة يحقق الفوز بدعم مركز الخدمات الطلابية'},{requireNews:true}),true);
});

test('query windows are bounded, diverse, Arabic, and target substantial conversations', () => {
  const queries=buildNewsQueries({since:1000,until:87400});
  assert.equal(queries.length,6);
  assert.match(queries[0],/from:beINSPORTS/);
  assert.match(queries[1],/from:filgoal/);
  assert.match(queries[2],/from:SaudiNT/);
  assert.match(queries[3],/from:FCBarcelona_ar/);
  assert.match(queries[4],/from:ittihad/);
  assert.match(queries[5],/التنس/);
  assert.match(queries[5],/كرة السلة/);
  const sources=queries.flatMap(q=>q.match(/from:[A-Za-z0-9_]+/gu)??[]);
  assert.equal(new Set(sources).size,sources.length,'source pools must not duplicate accounts');
  for(const q of queries) {
    assert.match(q,/min_replies:50/);assert.match(q,/lang:ar/);assert.match(q,/since_time:1000 until_time:87400/);
    assert.match(q,/\(نتيجة OR رسمي/);assert.match(q,/إصابة OR انتقال/);assert.match(q,/-filter:retweets -filter:replies/);
  }
  assert.throws(()=>buildNewsQueries({since:20,until:10}));
});

test('unavailable, future, old, wrong-language, source-branded and sensitive items fail closed', () => {
  for(const changes of [{unavailable:true},{createdAt:'2026-10-23T00:00:00Z'},{createdAt:'2026-10-18T00:00:00Z'},{lang:'en'},{possiblySensitive:true},{sensitive:true},{replyCount:3},{retweeted_tweet:{id:'1'}},{isRetweet:true},{conversationId:'123'},{author:{...tweet().author,name:'X Sports'}}]) assert.equal(classifyTwitterApiTweet(tweet(undefined,changes),options).row,null);
});
