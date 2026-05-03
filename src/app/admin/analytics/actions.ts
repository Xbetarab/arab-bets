"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function assertAdmin() {
  const userClient = await createClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user || user.email !== "uomankotd@gmail.com") {
    throw new Error("Unauthorized");
  }
  return createAdminClient();
}

// ── Shared helper: fetch all auth users via RPC (paginated) ──

type AuthUser = { id: string; email: string; created_at: string };

async function fetchAllAuthUsers(
  admin: ReturnType<typeof createAdminClient>
): Promise<AuthUser[]> {
  const allUsers: AuthUser[] = [];
  const pageSize = 1000;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await admin.rpc("get_auth_users_for_analytics").range(offset, offset + pageSize - 1);
    if (error) {
      console.error("Error fetching auth users via RPC:", error);
      break;
    }
    if (data && data.length > 0) {
      for (const u of data) {
        allUsers.push({ id: u.id, email: u.email || "", created_at: u.created_at });
      }
      if (data.length < pageSize) hasMore = false;
      offset += pageSize;
    } else {
      hasMore = false;
    }
  }

  return allUsers;
}

// ── Time range helpers (Asia/Baghdad = UTC+3) ──

function getBaghdadNow(): Date {
  const now = new Date();
  const baghdadOffset = 3 * 60;
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + baghdadOffset * 60000);
}

function getTimeRanges(): Record<string, { start: string; end: string }> {
  const baghdadNow = getBaghdadNow();
  const y = baghdadNow.getFullYear();
  const m = baghdadNow.getMonth();
  const d = baghdadNow.getDate();
  const dow = baghdadNow.getDay();

  const todayStart = new Date(Date.UTC(y, m, d, -3, 0, 0));

  const daysSinceSat = (dow + 1) % 7;
  const weekStart = new Date(todayStart);
  weekStart.setUTCDate(weekStart.getUTCDate() - daysSinceSat);

  const monthStart = new Date(Date.UTC(y, m, 1, -3, 0, 0));
  const lastMonthStart = new Date(Date.UTC(y, m - 1, 1, -3, 0, 0));
  const lastMonthEnd = new Date(Date.UTC(y, m, 1, -3, 0, 0));
  const yearStart = new Date(Date.UTC(y, 0, 1, -3, 0, 0));

  const farPast = "2000-01-01T00:00:00Z";
  const nowISO = new Date().toISOString();

  return {
    today: { start: todayStart.toISOString(), end: nowISO },
    week: { start: weekStart.toISOString(), end: nowISO },
    month: { start: monthStart.toISOString(), end: nowISO },
    last_month: { start: lastMonthStart.toISOString(), end: lastMonthEnd.toISOString() },
    year: { start: yearStart.toISOString(), end: nowISO },
    all_time: { start: farPast, end: nowISO },
  };
}

// ── Helper: count items in a time range by created_at ──

function countInRange(items: { created_at: string }[], start: string, end: string): number {
  return items.filter((i) => i.created_at >= start && i.created_at < end).length;
}

// ── Types ──

export type UserRegistrationStats = {
  today: number;
  week: number;
  month: number;
  last_month: number;
  year: number;
  all_time: number;
};

export type LinkClickStats = {
  today: number;
  week: number;
  month: number;
  last_month: number;
  year: number;
  all_time: number;
};

export type PageViewStats = {
  today: number;
  week: number;
  month: number;
  last_month: number;
  year: number;
  all_time: number;
};

export type ContentStats = {
  total_posts: number;
  posts_today: number;
  posts_week: number;
  posts_month: number;
  total_comments: number;
  comments_today: number;
  comments_week: number;
  comments_month: number;
  total_likes: number;
  total_comment_likes: number;
};

export type RealVsGhostStats = {
  real_posts: number;
  ghost_posts: number;
  real_comments: number;
  ghost_comments: number;
};

export type EngagementStats = {
  avg_likes_per_post: number;
  avg_comments_per_post: number;
  most_liked_posts: {
    id: string;
    content: string;
    likes_count: number;
    author: string;
  }[];
  most_commented_posts: {
    id: string;
    content: string;
    comments_count: number;
    author: string;
  }[];
  most_active_real_users: {
    display_name: string;
    username: string;
    posts_count: number;
    comments_count: number;
  }[];
  most_active_ghost_accounts: {
    display_name: string;
    username: string;
    posts_count: number;
    comments_count: number;
  }[];
};

export type AnalyticsData = {
  users: UserRegistrationStats;
  clicks: LinkClickStats;
  pageViews: PageViewStats;
  content: ContentStats;
  realVsGhost: RealVsGhostStats;
  engagement: EngagementStats;
  cached_at: string;
};

// ── Server-side in-memory cache (60s TTL) ──

let analyticsCache: { data: AnalyticsData; timestamp: number } | null = null;
const CACHE_TTL_MS = 60_000;

// ── Unified optimized fetch ──
// Before: ~25+ DB queries (5 assertAdmin, 3 fetchAllAuthUsers, 6 sequential click queries,
//          10 content count queries, duplicate posts/comments fetches)
// After:  ~9 DB queries total (1 assertAdmin, 1 fetchAllAuthUsers, 8 parallel queries)

async function fetchAnalyticsUncached(): Promise<AnalyticsData> {
  const admin = await assertAdmin();
  const ranges = getTimeRanges();

  // ── Parallel batch: all data in one round-trip ──
  const [
    allUsers,
    postsResult,
    commentsResult,
    clicksResult,
    likesCount,
    commentLikesCount,
    topLikedResult,
    topCommentedResult,
  ] = await Promise.all([
    fetchAllAuthUsers(admin),
    admin.from("posts").select("author_id, created_at, likes_count, comments_count"),
    admin.from("comments").select("author_id, created_at"),
    admin.from("link_clicks").select("created_at, link_type"),
    admin.from("likes").select("id", { count: "exact", head: true }),
    admin.from("comment_likes").select("id", { count: "exact", head: true }),
    admin
      .from("posts")
      .select("id, content, likes_count, profiles:author_id(display_name)")
      .order("likes_count", { ascending: false })
      .limit(5),
    admin
      .from("posts")
      .select("id, content, comments_count, profiles:author_id(display_name)")
      .order("comments_count", { ascending: false })
      .limit(5),
  ]);

  const posts = postsResult.data ?? [];
  const comments = commentsResult.data ?? [];
  const allClicks = clicksResult.data ?? [];
  const clicks = allClicks.filter((c: { link_type: string | null }) => c.link_type !== "page_view");
  const pageViews = allClicks.filter((c: { link_type: string | null }) => c.link_type === "page_view");

  // ── Build user ID sets (once, shared across all stats) ──
  const ghostIds = new Set(
    allUsers.filter((u) => u.email.endsWith("@ghost.arabtips.com")).map((u) => u.id)
  );
  const realUsers = allUsers.filter(
    (u) => u.email && !u.email.endsWith("@ghost.arabtips.com")
  );
  const realIdSet = new Set(realUsers.map((u) => u.id));

  // ── 1. User Registration Stats ──
  const userStats: UserRegistrationStats = {
    today: countInRange(realUsers, ranges.today.start, ranges.today.end),
    week: countInRange(realUsers, ranges.week.start, ranges.week.end),
    month: countInRange(realUsers, ranges.month.start, ranges.month.end),
    last_month: countInRange(realUsers, ranges.last_month.start, ranges.last_month.end),
    year: countInRange(realUsers, ranges.year.start, ranges.year.end),
    all_time: realUsers.length,
  };

  // ── 2. Link Click Stats ──
  const clickStats: LinkClickStats = {
    today: countInRange(clicks, ranges.today.start, ranges.today.end),
    week: countInRange(clicks, ranges.week.start, ranges.week.end),
    month: countInRange(clicks, ranges.month.start, ranges.month.end),
    last_month: countInRange(clicks, ranges.last_month.start, ranges.last_month.end),
    year: countInRange(clicks, ranges.year.start, ranges.year.end),
    all_time: clicks.length,
  };

  // ── 2b. Page View Stats ──
  const pageViewStats: PageViewStats = {
    today: countInRange(pageViews, ranges.today.start, ranges.today.end),
    week: countInRange(pageViews, ranges.week.start, ranges.week.end),
    month: countInRange(pageViews, ranges.month.start, ranges.month.end),
    last_month: countInRange(pageViews, ranges.last_month.start, ranges.last_month.end),
    year: countInRange(pageViews, ranges.year.start, ranges.year.end),
    all_time: pageViews.length,
  };

  // ── 3. Content Stats ──
  const contentStats: ContentStats = {
    total_posts: posts.length,
    posts_today: countInRange(posts, ranges.today.start, ranges.today.end),
    posts_week: countInRange(posts, ranges.week.start, ranges.week.end),
    posts_month: countInRange(posts, ranges.month.start, ranges.month.end),
    total_comments: comments.length,
    comments_today: countInRange(comments, ranges.today.start, ranges.today.end),
    comments_week: countInRange(comments, ranges.week.start, ranges.week.end),
    comments_month: countInRange(comments, ranges.month.start, ranges.month.end),
    total_likes: likesCount.count ?? 0,
    total_comment_likes: commentLikesCount.count ?? 0,
  };

  // ── 4. Real vs Ghost Stats ──
  let realPosts = 0, ghostPosts = 0, realComments = 0, ghostComments = 0;

  for (const p of posts) {
    if (ghostIds.has(p.author_id)) ghostPosts++;
    else if (realIdSet.has(p.author_id)) realPosts++;
    else ghostPosts++;
  }
  for (const c of comments) {
    if (ghostIds.has(c.author_id)) ghostComments++;
    else if (realIdSet.has(c.author_id)) realComments++;
    else ghostComments++;
  }

  const realVsGhostStats: RealVsGhostStats = {
    real_posts: realPosts,
    ghost_posts: ghostPosts,
    real_comments: realComments,
    ghost_comments: ghostComments,
  };

  // ── 5. Engagement Stats ──
  const totalPostCount = posts.length;
  const sumLikes = posts.reduce((s, p) => s + (p.likes_count ?? 0), 0);
  const sumComments = posts.reduce((s, p) => s + (p.comments_count ?? 0), 0);

  const avgLikes = totalPostCount > 0 ? Math.round((sumLikes / totalPostCount) * 10) / 10 : 0;
  const avgComments = totalPostCount > 0 ? Math.round((sumComments / totalPostCount) * 10) / 10 : 0;

  const mostLikedPosts = (topLikedResult.data ?? []).map((p) => ({
    id: p.id,
    content: (p.content || "").slice(0, 100),
    likes_count: p.likes_count ?? 0,
    author: (p.profiles as unknown as { display_name: string })?.display_name || "—",
  }));

  const mostCommentedPosts = (topCommentedResult.data ?? []).map((p) => ({
    id: p.id,
    content: (p.content || "").slice(0, 100),
    comments_count: p.comments_count ?? 0,
    author: (p.profiles as unknown as { display_name: string })?.display_name || "—",
  }));

  // Author activity from shared posts/comments arrays
  const authorActivity: Record<string, { posts: number; comments: number }> = {};
  for (const p of posts) {
    if (!authorActivity[p.author_id]) authorActivity[p.author_id] = { posts: 0, comments: 0 };
    authorActivity[p.author_id].posts++;
  }
  for (const c of comments) {
    if (!authorActivity[c.author_id]) authorActivity[c.author_id] = { posts: 0, comments: 0 };
    authorActivity[c.author_id].comments++;
  }

  // Single profiles query for active authors only
  const authorIds = Object.keys(authorActivity);
  const { data: profiles } = authorIds.length > 0
    ? await admin.from("profiles").select("id, display_name, username").in("id", authorIds)
    : { data: [] as { id: string; display_name: string; username: string }[] };

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, { display_name: p.display_name, username: p.username }])
  );

  const realAuthors: EngagementStats["most_active_real_users"] = [];
  const ghostAuthors: EngagementStats["most_active_ghost_accounts"] = [];

  for (const [authorId, activity] of Object.entries(authorActivity)) {
    const profile = profileMap.get(authorId);
    if (!profile) continue;
    const entry = {
      display_name: profile.display_name,
      username: profile.username,
      posts_count: activity.posts,
      comments_count: activity.comments,
    };
    if (ghostIds.has(authorId)) ghostAuthors.push(entry);
    else realAuthors.push(entry);
  }

  realAuthors.sort((a, b) => (b.posts_count + b.comments_count) - (a.posts_count + a.comments_count));
  ghostAuthors.sort((a, b) => (b.posts_count + b.comments_count) - (a.posts_count + a.comments_count));

  return {
    users: userStats,
    clicks: clickStats,
    pageViews: pageViewStats,
    content: contentStats,
    realVsGhost: realVsGhostStats,
    engagement: {
      avg_likes_per_post: avgLikes,
      avg_comments_per_post: avgComments,
      most_liked_posts: mostLikedPosts,
      most_commented_posts: mostCommentedPosts,
      most_active_real_users: realAuthors.slice(0, 10),
      most_active_ghost_accounts: ghostAuthors.slice(0, 10),
    },
    cached_at: new Date().toISOString(),
  };
}

// ── Public API ──

export async function fetchAllAnalytics(force = false): Promise<AnalyticsData> {
  if (!force && analyticsCache && Date.now() - analyticsCache.timestamp < CACHE_TTL_MS) {
    return analyticsCache.data;
  }

  const data = await fetchAnalyticsUncached();
  analyticsCache = { data, timestamp: Date.now() };
  return data;
}
