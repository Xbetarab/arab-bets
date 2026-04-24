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

// ── Shared helper: fetch all auth users via RPC ──

type AuthUser = { id: string; email: string; created_at: string };

async function fetchAllAuthUsers(
  admin: ReturnType<typeof createAdminClient>
): Promise<AuthUser[]> {
  // Use the get_auth_users_for_analytics RPC function which queries auth.users directly.
  // PostgREST limits results to 1000 per request, so we paginate.
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
        allUsers.push({
          id: u.id,
          email: u.email || "",
          created_at: u.created_at,
        });
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
  const baghdadOffset = 3 * 60; // UTC+3 in minutes
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + baghdadOffset * 60000);
}

function getTimeRanges(): Record<string, { start: string; end: string }> {
  const baghdadNow = getBaghdadNow();
  const y = baghdadNow.getFullYear();
  const m = baghdadNow.getMonth(); // 0-indexed
  const d = baghdadNow.getDate();
  const dow = baghdadNow.getDay(); // 0=Sun

  // Start of today in Baghdad → UTC
  const todayStart = new Date(Date.UTC(y, m, d, -3, 0, 0));

  // Start of this week (Saturday as first day for Arabic locale)
  const daysSinceSat = (dow + 1) % 7; // Sat=0
  const weekStart = new Date(todayStart);
  weekStart.setUTCDate(weekStart.getUTCDate() - daysSinceSat);

  // Start of this month
  const monthStart = new Date(Date.UTC(y, m, 1, -3, 0, 0));

  // Start of last month
  const lastMonthStart = new Date(Date.UTC(y, m - 1, 1, -3, 0, 0));
  const lastMonthEnd = new Date(Date.UTC(y, m, 1, -3, 0, 0));

  // Start of this year
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

// ── 1. User Registration Analytics ──

export type UserRegistrationStats = {
  today: number;
  week: number;
  month: number;
  last_month: number;
  year: number;
  all_time: number;
};

export async function fetchUserRegistrationStatsV2(): Promise<UserRegistrationStats> {
  const admin = await assertAdmin();
  const ranges = getTimeRanges();

  const allUsers = await fetchAllAuthUsers(admin);

  // Filter out ghost accounts
  const realUsers = allUsers.filter(
    (u) => u.email && !u.email.endsWith("@ghost.arabtips.com")
  );

  const countInRange = (start: string, end: string) =>
    realUsers.filter((u) => u.created_at >= start && u.created_at < end).length;

  return {
    today: countInRange(ranges.today.start, ranges.today.end),
    week: countInRange(ranges.week.start, ranges.week.end),
    month: countInRange(ranges.month.start, ranges.month.end),
    last_month: countInRange(ranges.last_month.start, ranges.last_month.end),
    year: countInRange(ranges.year.start, ranges.year.end),
    all_time: realUsers.length,
  };
}

// ── 2. Link Click Analytics ──

export type LinkClickStats = {
  today: number;
  week: number;
  month: number;
  last_month: number;
  year: number;
  all_time: number;
};

export async function fetchLinkClickStats(): Promise<LinkClickStats> {
  const supabase = await assertAdmin();
  const ranges = getTimeRanges();
  const results: Record<string, number> = {};

  for (const [key, range] of Object.entries(ranges)) {
    const { count } = await supabase
      .from("link_clicks")
      .select("id", { count: "exact", head: true })
      .gte("created_at", range.start)
      .lt("created_at", range.end);
    results[key] = count ?? 0;
  }

  return results as unknown as LinkClickStats;
}

// ── 3. Content Analytics ──

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

export async function fetchContentStats(): Promise<ContentStats> {
  const supabase = await assertAdmin();
  const ranges = getTimeRanges();

  const [
    totalPosts,
    postsToday,
    postsWeek,
    postsMonth,
    totalComments,
    commentsToday,
    commentsWeek,
    commentsMonth,
    totalLikes,
    totalCommentLikes,
  ] = await Promise.all([
    supabase.from("posts").select("id", { count: "exact", head: true }),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .gte("created_at", ranges.today.start),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .gte("created_at", ranges.week.start),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .gte("created_at", ranges.month.start),
    supabase.from("comments").select("id", { count: "exact", head: true }),
    supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .gte("created_at", ranges.today.start),
    supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .gte("created_at", ranges.week.start),
    supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .gte("created_at", ranges.month.start),
    supabase.from("likes").select("id", { count: "exact", head: true }),
    supabase.from("comment_likes").select("id", { count: "exact", head: true }),
  ]);

  return {
    total_posts: totalPosts.count ?? 0,
    posts_today: postsToday.count ?? 0,
    posts_week: postsWeek.count ?? 0,
    posts_month: postsMonth.count ?? 0,
    total_comments: totalComments.count ?? 0,
    comments_today: commentsToday.count ?? 0,
    comments_week: commentsWeek.count ?? 0,
    comments_month: commentsMonth.count ?? 0,
    total_likes: totalLikes.count ?? 0,
    total_comment_likes: totalCommentLikes.count ?? 0,
  };
}

// ── 4. Real vs Ghost Activity ──

export type RealVsGhostStats = {
  real_posts: number;
  ghost_posts: number;
  real_comments: number;
  ghost_comments: number;
};

export async function fetchRealVsGhostStats(): Promise<RealVsGhostStats> {
  const admin = await assertAdmin();

  const allUsers = await fetchAllAuthUsers(admin);

  const ghostIds = new Set(
    allUsers.filter((u) => u.email.endsWith("@ghost.arabtips.com")).map((u) => u.id)
  );
  const realIds = new Set(
    allUsers.filter((u) => u.email && !u.email.endsWith("@ghost.arabtips.com")).map((u) => u.id)
  );

  // Count posts by author type
  const { data: posts } = await admin
    .from("posts")
    .select("author_id");

  let realPosts = 0;
  let ghostPosts = 0;
  for (const p of posts ?? []) {
    if (ghostIds.has(p.author_id)) ghostPosts++;
    else if (realIds.has(p.author_id)) realPosts++;
    else ghostPosts++; // Unknown = treat as ghost
  }

  // Count comments by author type
  const { data: comments } = await admin
    .from("comments")
    .select("author_id");

  let realComments = 0;
  let ghostComments = 0;
  for (const c of comments ?? []) {
    if (ghostIds.has(c.author_id)) ghostComments++;
    else if (realIds.has(c.author_id)) realComments++;
    else ghostComments++;
  }

  return {
    real_posts: realPosts,
    ghost_posts: ghostPosts,
    real_comments: realComments,
    ghost_comments: ghostComments,
  };
}

// ── 5. Engagement Analytics ──

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

export async function fetchEngagementStats(): Promise<EngagementStats> {
  const admin = await assertAdmin();

  const allUsers = await fetchAllAuthUsers(admin);

  const ghostIds = new Set(
    allUsers.filter((u) => u.email.endsWith("@ghost.arabtips.com")).map((u) => u.id)
  );

  // Average likes and comments per post
  const { data: postStats } = await admin
    .from("posts")
    .select("likes_count, comments_count");

  const totalPosts = postStats?.length ?? 0;
  const sumLikes = postStats?.reduce((s, p) => s + (p.likes_count ?? 0), 0) ?? 0;
  const sumComments = postStats?.reduce((s, p) => s + (p.comments_count ?? 0), 0) ?? 0;

  const avgLikes = totalPosts > 0 ? Math.round((sumLikes / totalPosts) * 10) / 10 : 0;
  const avgComments = totalPosts > 0 ? Math.round((sumComments / totalPosts) * 10) / 10 : 0;

  // Most liked posts (top 5)
  const { data: topLiked } = await admin
    .from("posts")
    .select("id, content, likes_count, profiles:author_id(display_name)")
    .order("likes_count", { ascending: false })
    .limit(5);

  const mostLikedPosts = (topLiked ?? []).map((p) => ({
    id: p.id,
    content: (p.content || "").slice(0, 100),
    likes_count: p.likes_count ?? 0,
    author: (p.profiles as unknown as { display_name: string })?.display_name || "—",
  }));

  // Most commented posts (top 5)
  const { data: topCommented } = await admin
    .from("posts")
    .select("id, content, comments_count, profiles:author_id(display_name)")
    .order("comments_count", { ascending: false })
    .limit(5);

  const mostCommentedPosts = (topCommented ?? []).map((p) => ({
    id: p.id,
    content: (p.content || "").slice(0, 100),
    comments_count: p.comments_count ?? 0,
    author: (p.profiles as unknown as { display_name: string })?.display_name || "—",
  }));

  // Most active users — get all posts and comments grouped by author
  const { data: allPosts } = await admin.from("posts").select("author_id");
  const { data: allComments } = await admin.from("comments").select("author_id");

  // Count per author
  const authorActivity: Record<string, { posts: number; comments: number }> = {};
  for (const p of allPosts ?? []) {
    if (!authorActivity[p.author_id]) authorActivity[p.author_id] = { posts: 0, comments: 0 };
    authorActivity[p.author_id].posts++;
  }
  for (const c of allComments ?? []) {
    if (!authorActivity[c.author_id]) authorActivity[c.author_id] = { posts: 0, comments: 0 };
    authorActivity[c.author_id].comments++;
  }

  // Get profiles for all active authors
  const authorIds = Object.keys(authorActivity);
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, display_name, username")
    .in("id", authorIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, { display_name: p.display_name, username: p.username }])
  );

  // Split into real vs ghost
  const realAuthors: { display_name: string; username: string; posts_count: number; comments_count: number }[] = [];
  const ghostAuthors: { display_name: string; username: string; posts_count: number; comments_count: number }[] = [];

  for (const [authorId, activity] of Object.entries(authorActivity)) {
    const profile = profileMap.get(authorId);
    if (!profile) continue;
    const entry = {
      display_name: profile.display_name,
      username: profile.username,
      posts_count: activity.posts,
      comments_count: activity.comments,
    };
    if (ghostIds.has(authorId)) {
      ghostAuthors.push(entry);
    } else {
      realAuthors.push(entry);
    }
  }

  // Sort by total activity (posts + comments), take top 10
  realAuthors.sort((a, b) => (b.posts_count + b.comments_count) - (a.posts_count + a.comments_count));
  ghostAuthors.sort((a, b) => (b.posts_count + b.comments_count) - (a.posts_count + a.comments_count));

  return {
    avg_likes_per_post: avgLikes,
    avg_comments_per_post: avgComments,
    most_liked_posts: mostLikedPosts,
    most_commented_posts: mostCommentedPosts,
    most_active_real_users: realAuthors.slice(0, 10),
    most_active_ghost_accounts: ghostAuthors.slice(0, 10),
  };
}

// ── Combined fetch for the analytics page ──

export type AnalyticsData = {
  users: UserRegistrationStats;
  clicks: LinkClickStats;
  content: ContentStats;
  realVsGhost: RealVsGhostStats;
  engagement: EngagementStats;
};

export async function fetchAllAnalytics(): Promise<AnalyticsData> {
  const [users, clicks, content, realVsGhost, engagement] = await Promise.all([
    fetchUserRegistrationStatsV2(),
    fetchLinkClickStats(),
    fetchContentStats(),
    fetchRealVsGhostStats(),
    fetchEngagementStats(),
  ]);

  return { users, clicks, content, realVsGhost, engagement };
}
