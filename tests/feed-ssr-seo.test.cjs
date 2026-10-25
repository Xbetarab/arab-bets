const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

function loadSource(relativePath, mocks = {}) {
  const filename = path.join(__dirname, "..", relativePath);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
    fileName: filename,
  }).outputText;
  const testModule = { exports: {} };
  const defaults = {
    "@/components/seo/article-jsonld": { ArticleJsonLd: () => null },
    "@/lib/seo": { SITE_URL: "https://arabtips.com" },
    "@/app/actions/imported-likes": { setImportedPostLike: async () => { throw new Error("Unexpected like mutation"); } },
  };
  new Function("require", "module", "exports", source)(
    (name) => Object.hasOwn(mocks, name) ? mocks[name] : Object.hasOwn(defaults, name) ? defaults[name] : require(name),
    testModule,
    testModule.exports,
  );
  return testModule.exports;
}

function importedCardHarness(setLike = async () => { throw new Error("Unexpected like mutation"); }) {
  const instances = new Map();
  let current = null;
  let cursor = 0;
  function useState(initial) {
    if (current === null) return React.useState(initial);
    const instance = current;
    const index = cursor++;
    if (!(index in instance.slots)) instance.slots[index] = typeof initial === "function" ? initial() : initial;
    return [instance.slots[index], (value) => {
      const next = typeof value === "function" ? value(instance.slots[index]) : value;
      if (!Object.is(next, instance.slots[index])) instance.dirty = true;
      instance.slots[index] = next;
    }];
  }
  const ImportedPostCard = loadSource("src/components/x-sports-post.tsx", {
    react: {
      ...React, useState,
      useRef: (initial) => current === null ? React.useRef(initial) : useState({ current: initial })[0],
      useEffect(effect, dependencies) {
        if (current === null) return React.useEffect(effect, dependencies);
        const index = cursor++;
        const previous = current.slots[index];
        if (!previous || dependencies.some((value, offset) => !Object.is(value, previous[offset]))) {
          current.effects.push(effect);
          current.slots[index] = dependencies;
        }
      },
    },
    "@/app/actions/imported-likes": { setImportedPostLike: setLike },
    "@/lib/format-time": { formatRelativeTime: () => "الآن" },
  }).default;
  return {
    render(key, props) {
      if (!instances.has(key)) instances.set(key, { slots: [], effects: [], dirty: false });
      const instance = instances.get(key);
      for (let attempt = 0; attempt < 5; attempt++) {
        current = instance;
        cursor = 0;
        instance.dirty = false;
        let tree;
        try { tree = ImportedPostCard(props); } finally { current = null; }
        for (const effect of instance.effects.splice(0)) effect();
        if (!instance.dirty) return tree;
      }
      throw new Error("Imported card did not settle after state synchronization");
    },
  };
}

const descendants = (node) => React.isValidElement(node)
  ? [node, ...React.Children.toArray(node.props.children).flatMap(descendants)] : [];

const OWNER = "10000000-0000-4000-8000-000000000001";
const OTHER = "10000000-0000-4000-8000-000000000002";
const ROWS = [
  { id: "public-post", author_id: OTHER, is_approved: true, content: "منشور عام للاختبار", created_at: "2026-10-06T10:00:00Z" },
  { id: "owner-private-post", author_id: OWNER, is_approved: false, content: "مسودة صاحب الحساب", created_at: "2026-10-06T09:00:00Z" },
  { id: "other-private-post", author_id: OTHER, is_approved: false, content: "مسودة مستخدم آخر", created_at: "2026-10-06T08:00:00Z" },
];

// Synthetic Supabase query evaluator. No credentials, network or live database.
function environment(user, imported = null) {
  const calls = [];
  const client = {
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    from(table) {
      assert.equal(table, "posts");
      let rows = [...ROWS];
      let rowLimit;
      const query = {
        select() { return query; },
        order() { return query; },
        limit(value) { rowLimit = value; return query; },
        eq(column, value) {
          calls.push(["eq", column, value]);
          rows = rows.filter((row) => row[column] === value);
          return query;
        },
        or(expression) {
          calls.push(["or", expression]);
          const ownId = expression.match(/^is_approved\.eq\.true,author_id\.eq\.(.+)$/)?.[1];
          assert.ok(ownId, "owner visibility query must be explicit");
          rows = rows.filter((row) => row.is_approved || row.author_id === ownId);
          return query;
        },
        lt(column, value) { rows = rows.filter((row) => row[column] < value); return query; },
        then(resolve, reject) {
          return Promise.resolve({ data: rows.slice(0, rowLimit), error: null }).then(resolve, reject);
        },
      };
      return query;
    },
  };
  const feedActions = loadSource("src/app/actions/feed.ts", {
    "@/lib/supabase/server": { createClient: async () => client },
  });
  let fetchCalls = 0;
  const fetchFeedPage = (...args) => {
    fetchCalls++;
    return feedActions.fetchFeedPage(...args);
  };
  const Link = ({ children, ...props }) => React.createElement("a", props, children);
  const PostCard = ({ post }) => React.createElement("a", { href: `/post/${post.id}` }, post.content);
  const ImportedPostCard = loadSource("src/components/x-sports-post.tsx", {
    "@/lib/format-time": { formatRelativeTime: () => "الآن" },
  }).default;
  const Feed = loadSource("src/components/feed.tsx", {
    "@/lib/supabase/client": { createClient: () => { throw new Error("Browser client must not run during SSR"); } },
    "@/app/actions/feed": { fetchFeedPage },
    "./post-card": PostCard,
    "./tip-card": PostCard,
    "./x-sports-post": ImportedPostCard,
    "next/link": Link,
  }).default;
  const HomePage = loadSource("src/app/(main)/page.tsx", {
    "@/lib/supabase/server": { createClient: async () => client },
    "@/app/actions/feed": { fetchFeedPage },
    "@/components/feed": Feed,
    "@/lib/x-sports/public-feed": {
      sportsFeedEnabled: async () => {
        if (imported?.failAt === "settings") throw new Error("sensitive upstream settings failure");
        return Boolean(imported);
      },
      getSportsFeed: async (rootLimit, viewerId) => {
        assert.equal(rootLimit, 20);
        assert.equal(viewerId, user?.id ?? null, "imported like state belongs to the verified viewer");
        if (["roots", "replies"].includes(imported?.failAt)) throw new Error("sensitive upstream feed failure");
        return { roots: imported?.roots ?? [], replies: imported?.replies ?? [] };
      },
    },
    "next/link": Link,
  }).default;
  return { calls, HomePage, Feed, fetchFeedPage, get fetchCalls() { return fetchCalls; } };
}

test("anonymous homepage HTML contains approved posts without guide links or private drafts", async () => {
  const env = environment(null);
  const html = renderToStaticMarkup(await env.HomePage());
  assert.match(html, /<h1[^>]*>ArabTips/);
  assert.match(html, /href="\/post\/public-post"/);
  assert.doesNotMatch(html, /owner-private-post|other-private-post|مسودة/);
  for (const href of ["/1xbet", "/eg/1xbet", "/pariland", "/about"]) {
    assert.equal(html.includes(`href="${href}"`), false);
  }
  assert.equal(env.fetchCalls, 1);
  assert.deepEqual(env.calls, [["eq", "is_approved", true]]);
});

test("imported Arabic posts appear in the ordinary feed with comments collapsed and their real count visible", async () => {
  const root = {
    x_id: "sports-100", conversation_id: "sports-100", in_reply_to_x_id: null,
    author_username: "sport_news", author_name: "أخبار الملاعب", author_avatar_url: "https://example.test/avatar.jpg",
    body: "انتهت مباراة القمة بنتيجة مثيرة", posted_at: "2026-10-20T10:00:00Z",
    media_json: [{ type: "photo", url: "https://pbs.twimg.com/example/photo.jpg" }],
    links_json: [{ url: "https://x.com/example/status/100", label: "الرابط الأصلي" }],
  };
  const replies = [
    { ...root, x_id: "sports-101", in_reply_to_x_id: "sports-100", author_name: "محمد", author_username: "mohammed", body: "الهدف الأخير غيّر المباراة", posted_at: "2026-10-20T10:01:00Z" },
    { ...root, x_id: "sports-102", in_reply_to_x_id: "sports-101", author_name: "سارة", author_username: "sara", body: "والتصدي كان رائعًا", posted_at: "2026-10-20T10:02:00Z" },
    { ...root, x_id: "sports-103", in_reply_to_x_id: "missing-parent", author_name: "أحمد", author_username: "ahmad", body: "انتظروا الجولة القادمة", posted_at: "2026-10-20T10:03:00Z" },
  ];
  const env = environment(null, { roots: [root], replies });
  const html = renderToStaticMarkup(await env.HomePage());
  assert.ok(html.indexOf(root.body) < html.indexOf("منشور عام للاختبار"), "recent imported post is interleaved by time");
  for (const text of [root.author_name, root.body]) {
    assert.ok(html.includes(text), text);
  }
  assert.match(html, /<span>\(3\)<\/span>/);
  for (const reply of replies) {
    assert.equal(html.includes(reply.body), false, "collapsed comments do not render their bodies");
    assert.equal(html.includes(`/api/sports-image/${reply.x_id}/avatar`), false, "collapsed comments do not load avatars");
  }
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /aria-controls="sports-comments-sports-100"/);
  assert.match(html, /عرض التعليقات/);
  assert.doesNotMatch(html, /aria-label="التعليقات"|id="sports-comments-sports-100"/);
  assert.match(html, /src="\/api\/sports-image\/sports-100\/avatar"/);
  assert.match(html, /src="\/api\/sports-image\/sports-100\/media-0"/);
  assert.match(html, /href="\/post\/public-post"/);
  assert.doesNotMatch(html, /href="\/sports"|محتوى منقول|الرياضة الآن|https:\/\/x\.com|twitter\.com|twimg\.com|example\.test/);
});

test("homepage projects twenty complete conversations but initially renders only their posts and actual comment counts", async () => {
  const roots = Array.from({ length: 20 }, (_, i) => ({
    x_id: String(2000 + i), conversation_id: String(2000 + i), in_reply_to_x_id: null,
    author_username: `editor${i}`, author_name: `محرر رياضي ${i}`,
    author_avatar_url: "https://pbs.twimg.com/example-avatar.jpg",
    body: `خبر رياضي متنوع من مباريات الدوري رقم ${i}`, posted_at: "2026-10-21T10:00:00Z",
    media_json: [], links_json: [{ url: "https://x.com/source/100" }],
  }));
  const counts = roots.map((_, index) => Math.min(111, 20 + index * 5));
  const replies = roots.flatMap((root, i) => Array.from({ length: counts[i] }, (_, j) => ({
    ...root, x_id: `${root.x_id}${String(j).padStart(2, "0")}`,
    in_reply_to_x_id: root.x_id, author_name: `مشجع ${j}`, author_username: `fan${j}`,
    body: `رأي رياضي عربي عن الفريق والتشكيلة ${i}-${j}`,
  })));
  const env = environment(null, { roots, replies });
  const tree = await env.HomePage();
  const feed = tree.props.children.find((child) => child?.type === env.Feed);
  assert.equal(feed.props.importedPosts.length, 20);
  assert.equal(feed.props.importedReplies.length, counts.reduce((sum, count) => sum + count, 0));
  assert.ok(feed.props.importedReplies.every((reply) => !Object.hasOwn(reply, "author_avatar_url") && !Object.hasOwn(reply, "links_json")));
  const html = renderToStaticMarkup(tree);
  for (const count of counts) assert.ok(html.includes(`<span>(${count})</span>`), `actual count ${count} remains visible`);
  assert.equal((html.match(/aria-expanded="false"/g) ?? []).length, roots.length);
  for (const root of roots) {
    assert.ok(html.includes(root.body), "every root post remains visible");
    assert.ok(html.includes(`aria-controls="sports-comments-${root.x_id}"`), "each post controls its own comments");
  }
  for (const reply of replies) {
    assert.equal(html.includes(reply.body), false);
    assert.equal(html.includes(`/api/sports-image/${reply.x_id}/avatar`), false);
  }
  assert.doesNotMatch(html, /aria-label="التعليقات"/);
  assert.match(html, /href="\/post\/public-post"/);
  assert.doesNotMatch(html, /https:\/\/x\.com|twimg\.com|href="\/sports"/);
});

test("each imported post independently opens and closes its real comments without changing their count or identity", () => {
  const harness = importedCardHarness();
  const roots = ["101", "202"].map((id) => ({
    x_id: id, conversation_id: id, in_reply_to_x_id: null,
    author_username: `editor${id}`, author_name: `محرر ${id}`, has_avatar: true,
    body: `خبر رياضي للاختبار ${id}`, posted_at: "2026-10-22T10:00:00Z", media_count: 0,
  }));
  const groups = roots.map((post, index) => ({
    post,
    replies: Array.from({ length: index ? 111 : 20 }, (_, replyIndex) => ({
      ...post, x_id: `${post.x_id}-${replyIndex}`, in_reply_to_x_id: post.x_id,
      author_name: `مشجع ${replyIndex}`, author_username: `fan${replyIndex}`,
      body: `تعليق حقيقي خاص بالمنشور ${post.x_id} رقم ${replyIndex}`,
    })),
  }));
  const renderCard = (index) => harness.render(index, groups[index]);
  const toggle = (card) => {
    const buttons = descendants(card).filter((node) => node.type === "button" && node.props["aria-controls"]);
    assert.equal(buttons.length, 1);
    return buttons[0];
  };
  const assertCard = (index, expanded) => {
    const card = renderCard(index);
    const button = toggle(card);
    const regionId = `sports-comments-${groups[index].post.x_id}`;
    assert.equal(button.props.type, "button");
    assert.equal(button.props["aria-controls"], regionId);
    assert.equal(button.props["aria-expanded"], expanded);
    assert.match(button.props.className, /min-h-\[44px\]/);
    const html = renderToStaticMarkup(card);
    assert.ok(html.includes(groups[index].post.body));
    assert.ok(html.includes(`<span>(${groups[index].replies.length})</span>`));
    assert.ok(html.includes(expanded ? "إخفاء التعليقات" : "عرض التعليقات"));
    assert.equal(html.includes(`id="${regionId}"`), expanded);
    assert.equal(html.includes('aria-label="التعليقات"'), expanded);
    for (const reply of groups[index].replies) {
      assert.equal(html.includes(reply.body), expanded);
      assert.equal(html.includes(`/api/sports-image/${reply.x_id}/avatar`), expanded);
      if (expanded) {
        assert.ok(html.includes(reply.author_name));
        assert.ok(html.includes(`@${reply.author_username}`));
      }
    }
    assert.doesNotMatch(html, /https:\/\/x\.com|twitter\.com|href="\/sports"/);
    return card;
  };
  const first = assertCard(0, false);
  assertCard(1, false);
  toggle(first).props.onClick();
  const firstOpen = assertCard(0, true);
  const second = assertCard(1, false);
  toggle(second).props.onClick();
  assertCard(0, true);
  const secondOpen = assertCard(1, true);
  toggle(firstOpen).props.onClick();
  assertCard(0, false);
  assertCard(1, true);
  toggle(secondOpen).props.onClick();
  assertCard(0, false);
  assertCard(1, false);
});

test("server-rendered imported hearts show stored counts and the signed-in user's state while guest hearts require login", async () => {
  const roots = [124, 998].map((count, index) => ({
    x_id: String(9000 + index), conversation_id: String(9000 + index), in_reply_to_x_id: null,
    author_username: `editor${index}`, author_name: `محرر ${index}`, author_avatar_url: "https://pbs.twimg.com/avatar.jpg",
    body: `خبر رياضي عربي ${index}`, posted_at: "2026-10-22T10:00:00Z", media_json: [], links_json: [],
    likes_count: count, is_liked: index === 1,
  }));
  const member = environment({ id: OWNER }, { roots, replies: [] });
  const memberHTML = renderToStaticMarkup(await member.HomePage());
  assert.match(memberHTML, /<span>124<\/span>/);
  assert.match(memberHTML, /<span>998<\/span>/);
  assert.equal((memberHTML.match(/aria-pressed="true"/g) ?? []).length, 1);
  assert.equal((memberHTML.match(/aria-pressed="false"/g) ?? []).length, 1);
  assert.equal((memberHTML.match(/aria-expanded="false"/g) ?? []).length, 2);
  assert.doesNotMatch(memberHTML, /disabled=""|سجّل الدخول للإعجاب/);
  const guest = environment(null, { roots, replies: [] });
  const guestHTML = renderToStaticMarkup(await guest.HomePage());
  assert.equal((guestHTML.match(/aria-pressed="false"/g) ?? []).length, 2);
  assert.equal((guestHTML.match(/disabled=""/g) ?? []).length, 2);
  assert.match(guestHTML, /سجّل الدخول للإعجاب بالمنشور/);
  assert.match(guestHTML, /<span>124<\/span>/);
  assert.match(guestHTML, /<span>998<\/span>/);
});

test("imported likes send the desired state, reconcile authoritative counts, roll back failures, and leave other posts and comments independent", async () => {
  const requests = [];
  const setLike = (postId, desiredLiked) => new Promise((resolve, reject) => requests.push({ postId, desiredLiked, resolve, reject }));
  const harness = importedCardHarness(setLike);
  const post = {
    x_id: "7000", conversation_id: "7000", in_reply_to_x_id: null,
    author_username: "editor", author_name: "محرر رياضي", has_avatar: true,
    body: "خبر رياضي عربي للاختبار", posted_at: "2026-10-22T10:00:00Z", media_count: 0,
    likes_count: 124, is_liked: false,
  };
  const props = { post, userId: OWNER, replies: [{ ...post, x_id: "7001", in_reply_to_x_id: post.x_id, body: "تعليق رياضي عربي محفوظ" }] };
  const otherProps = { ...props, post: { ...post, x_id: "8000", conversation_id: "8000", likes_count: 998, is_liked: true }, replies: [] };
  const likeButton = (card) => descendants(card).find((node) => node.type === "button" && typeof node.props["aria-pressed"] === "boolean");
  const commentButton = (card) => descendants(card).find((node) => node.type === "button" && node.props["aria-controls"]);
  const assertLike = (card, count, liked, pending = false) => {
    const button = likeButton(card);
    assert.equal(button.props["aria-pressed"], liked);
    assert.equal(button.props["aria-busy"], pending);
    assert.equal(button.props.disabled, pending);
    assert.equal(button.props["aria-label"], liked ? "إلغاء الإعجاب" : "إعجاب");
    assert.match(renderToStaticMarkup(button), new RegExp(`<span>${count}</span>`));
    return button;
  };
  const guest = harness.render("guest", { ...props, userId: null });
  assert.equal(likeButton(guest).props.disabled, true);
  await likeButton(guest).props.onClick();
  assert.equal(requests.length, 0, "guests never invoke the persistent mutation");

  const first = harness.render("first", props);
  const firstLike = assertLike(first, 124, false);
  assert.equal(commentButton(first).props["aria-expanded"], false);
  const liking = firstLike.props.onClick();
  await firstLike.props.onClick();
  assert.equal(requests.length, 1, "an in-flight click cannot submit twice");
  assert.deepEqual([requests[0].postId, requests[0].desiredLiked], ["7000", true]);
  const pendingCard = harness.render("first", props);
  assertLike(pendingCard, 125, true, true);
  commentButton(pendingCard).props.onClick();
  assert.equal(commentButton(harness.render("first", props)).props["aria-expanded"], true);
  assertLike(harness.render("second", otherProps), 998, true);
  assert.equal(commentButton(harness.render("second", otherProps)).props["aria-expanded"], false);
  requests[0].resolve({ liked: true, likesCount: 130 });
  await liking;
  const likedCard = harness.render("first", props);
  assertLike(likedCard, 130, true);
  assert.equal(commentButton(likedCard).props["aria-expanded"], true);
  assert.ok(renderToStaticMarkup(likedCard).includes(props.replies[0].body));

  // Fresh server props reproduce the saved state after a remount/refresh.
  assertLike(importedCardHarness().render("fresh", { ...props, post: { ...post, likes_count: 130, is_liked: true } }), 130, true);
  const unliking = likeButton(likedCard).props.onClick();
  assertLike(harness.render("first", props), 129, false, true);
  assert.deepEqual([requests[1].postId, requests[1].desiredLiked], ["7000", false]);
  requests[1].resolve({ liked: false, likesCount: 129 });
  await unliking;
  const unlikedCard = harness.render("first", props);
  assertLike(unlikedCard, 129, false);

  const failing = likeButton(unlikedCard).props.onClick();
  assertLike(harness.render("first", props), 130, true, true);
  requests[2].reject(new Error("private backend details must not reach the page"));
  await failing;
  const failedCard = harness.render("first", props);
  assertLike(failedCard, 129, false);
  const failedHTML = renderToStaticMarkup(failedCard);
  assert.match(failedHTML, /role="alert"/);
  assert.match(failedHTML, /تعذّر تحديث الإعجاب/);
  assert.doesNotMatch(failedHTML, /private backend/);
  assert.equal(commentButton(failedCard).props["aria-expanded"], true);
  assertLike(harness.render("second", otherProps), 998, true);
  const retry = likeButton(failedCard).props.onClick();
  assert.doesNotMatch(renderToStaticMarkup(harness.render("first", props)), /role="alert"/);
  const refreshedProps = { ...props, post: { ...post, likes_count: 200, is_liked: false } };
  assertLike(harness.render("first", refreshedProps), 130, true, true);
  requests[3].resolve({ liked: true, likesCount: 201 });
  await retry;
  assertLike(harness.render("first", refreshedProps), 201, true);
  assertLike(harness.render("first", { ...props, post: { ...post, likes_count: 220, is_liked: true } }), 220, true);
});

test("a failed imported avatar shows the native initial fallback and a different avatar may load", () => {
  let failedImage = null;
  const ImportedPostCard = loadSource("src/components/x-sports-post.tsx", {
    react: {
      ...React,
      useState: (initial) => initial === null ? [failedImage, (value) => { failedImage = value; }] : [initial, () => {}],
      useRef: (initial) => ({ current: initial }),
      useEffect: () => {},
    },
    "@/lib/format-time": { formatRelativeTime: () => "الآن" },
  }).default;
  const post = {
    x_id: "100", conversation_id: "100", in_reply_to_x_id: null,
    author_username: "mohammed", author_name: "محمد", has_avatar: true,
    body: "منشور رياضي عربي للاختبار", posted_at: "2026-10-20T10:00:00Z", media_count: 0,
  };
  const card = ImportedPostCard({ post });
  const avatar = card.props.children[0].props.children[0];
  const image = avatar.type(avatar.props);
  assert.equal(image.type, "img");
  assert.equal(image.props.src, "/api/sports-image/100/avatar");
  image.props.onError();
  const fallback = avatar.type(avatar.props);
  assert.equal(fallback.type, "div");
  assert.equal(fallback.props.children, "م");
  assert.match(fallback.props.className, /rounded-full bg-emerald-600\/20/);
  const nextAvatar = avatar.type({ post: { ...post, x_id: "101" }, small: true });
  assert.equal(nextAvatar.type, "img");
  assert.match(nextAvatar.props.className, /h-8 w-8/);
});

test("optional import failures preserve the native homepage without partial imported conversations or upstream details", async (t) => {
  const warnings = t.mock.method(console, "warn", () => {});
  const root = {
    x_id: "sports-100", conversation_id: "sports-100", in_reply_to_x_id: null,
    author_username: "sport_news", author_name: "أخبار الملاعب", author_avatar_url: "https://pbs.twimg.com/private-avatar.jpg",
    body: "منشور مستورد لا يجب عرضه عند تعطل الردود", posted_at: "2026-10-20T10:00:00Z",
    media_json: [], links_json: [],
  };
  for (const failAt of ["settings", "roots", "replies"]) {
    const env = environment(null, { roots: [root], replies: [], failAt });
    const tree = await env.HomePage();
    const feed = tree.props.children.find((child) => child?.type === env.Feed);
    assert.deepEqual(feed.props.importedPosts, [], failAt);
    assert.deepEqual(feed.props.importedReplies, [], failAt);
    const html = renderToStaticMarkup(tree);
    assert.match(html, /href="\/post\/public-post"/, failAt);
    assert.doesNotMatch(html, /منشور مستورد|sensitive|upstream|twimg\.com/, failAt);
    assert.equal(env.fetchCalls, 1);
  }
  assert.equal(warnings.mock.callCount(), 3);
  for (const { arguments: args } of warnings.mock.calls) {
    assert.deepEqual(args, ["Optional sports feed unavailable; rendering native feed."]);
  }
});

test("authenticated server feed includes only that user's own draft and remounts when identity changes", async () => {
  const env = environment({ id: OWNER, email: "member@example.test" });
  const tree = await env.HomePage();
  const feed = tree.props.children.find((child) => child?.type === env.Feed);
  assert.equal(feed.key, OWNER, "identity changes must not retain another user's client state");
  const html = renderToStaticMarkup(tree);
  assert.match(html, /href="\/post\/public-post"/);
  assert.match(html, /href="\/post\/owner-private-post"/);
  assert.doesNotMatch(html, /other-private-post|مسودة مستخدم آخر/);
  assert.equal(env.fetchCalls, 1);
  assert.deepEqual(env.calls, [["or", `is_approved.eq.true,author_id.eq.${OWNER}`]]);
  const guest = environment(null);
  assert.equal((await guest.HomePage()).props.children.find((child) => child?.type === guest.Feed).key, "guest");
});

test("browser mount subscribes to realtime without refetching the server-rendered first page", () => {
  const effects = [];
  let fetchCalls = 0;
  let subscriptions = 0;
  let removals = 0;
  const channel = {
    on() { return channel; },
    subscribe() { subscriptions++; return channel; },
  };
  const Feed = loadSource("src/components/feed.tsx", {
    react: {
      useState: (value) => [value, () => {}],
      useRef: () => ({ current: null }),
      useCallback: (callback) => callback,
      useEffect: (effect) => effects.push(effect),
    },
    "@/lib/supabase/client": { createClient: () => ({ channel: () => channel, removeChannel: () => { removals++; } }) },
    "@/app/actions/feed": { fetchFeedPage: () => { fetchCalls++; throw new Error("Unexpected first-page reload"); } },
    "./post-card": () => null,
    "./tip-card": () => null,
    "./x-sports-post": () => null,
    "next/link": () => null,
  }).default;
  Feed({ userId: null, initialPosts: [ROWS[0]], initialCursor: "cursor" });
  const cleanups = effects.map((effect) => effect());
  assert.equal(subscriptions, 1);
  assert.equal(fetchCalls, 0);
  for (const cleanup of cleanups) if (typeof cleanup === "function") cleanup();
  assert.equal(removals, 1);
});

test("first server feed retains its pagination cursor for subsequent batches", async () => {
  const env = environment({ id: OWNER });
  const first = await env.fetchFeedPage(undefined, 1);
  assert.deepEqual(first.posts.map((post) => post.id), ["public-post"]);
  assert.equal(first.nextCursor, ROWS[0].created_at);
  const html = renderToStaticMarkup(React.createElement(env.Feed, {
    userId: OWNER, initialPosts: first.posts, initialCursor: first.nextCursor,
  }));
  assert.doesNotMatch(html, /animate-spin|لا يوجد المزيد من المنشورات/);
  const second = await env.fetchFeedPage(first.nextCursor, 1);
  assert.deepEqual(second.posts.map((post) => post.id), ["owner-private-post"]);
  assert.equal(second.nextCursor, null);
  assert.equal(env.fetchCalls, 2);
});

test("only the literal public manifest bypasses session middleware, without opening private JSON or nested paths", () => {
  const { config } = loadSource("src/proxy.ts");
  const { unstable_doesMiddlewareMatch } = require("next/experimental/testing/server");
  const matches = (pathname) => unstable_doesMiddlewareMatch({
    config, nextConfig: {}, url: `https://arabtips.com${pathname}`,
  });
  assert.equal(matches("/manifest.json"), false);
  for (const pathname of ["/manifest.json/private", "/private/data.json", "/profile/edit", "/admin", "/auth/login"]) {
    assert.equal(matches(pathname), true, pathname);
  }
});
