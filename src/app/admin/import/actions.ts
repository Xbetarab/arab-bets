"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import JSZip from "jszip";

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

/* ------------------------------------------------------------------ */
/*  Types for the JSON file formats                                    */
/* ------------------------------------------------------------------ */

type ImportReply = {
  author_username?: string;
  content: string;
  created_at: string;
  likes_count?: number;
};

type ImportComment = {
  author_username?: string;
  content: string;
  created_at: string;
  likes_count?: number;
  replies?: ImportReply[];
};

type ImportPost = {
  author_username?: string;
  content: string;
  sport?: string;
  created_at: string;
  likes_count?: number;
  comments?: ImportComment[];
};

type ImportPostsFile = {
  posts: ImportPost[];
};

type ImportCommentsEntry = {
  post_id: string;
  entries: ImportComment[];
};

type ImportCommentsFile = {
  comments: ImportCommentsEntry[];
};

export type ImportResult = {
  success: boolean;
  postsCreated: number;
  commentsCreated: number;
  profilesCreated: number;
  errors: string[];
};

/* ------------------------------------------------------------------ */
/*  Sport label → value mapping                                        */
/* ------------------------------------------------------------------ */

const SPORT_MAP: Record<string, string> = {
  "كرة قدم": "football",
  "football": "football",
  "سلة": "basketball",
  "كرة سلة": "basketball",
  "basketball": "basketball",
  "تنس": "tennis",
  "tennis": "tennis",
  "ملاكمة": "boxing",
  "boxing": "boxing",
  "فنون قتالية": "mma",
  "mma": "mma",
  "MMA": "mma",
  "رياضات إلكترونية": "esports",
  "esports": "esports",
  "كريكت": "other",
  "أخرى": "other",
  "other": "other",
};

/* ------------------------------------------------------------------ */
/*  Timestamp validation — clamp future dates to now                    */
/* ------------------------------------------------------------------ */

/**
 * Validate a created_at string. Rejects invalid dates and timestamps
 * that are significantly in the future (beyond 60 s tolerance).
 * Returns a normalized ISO-8601 UTC string, or throws with a clear message.
 */
function validateTimestamp(raw: string): string {
  const parsed = new Date(raw);
  if (isNaN(parsed.getTime())) {
    throw new Error(
      `تاريخ غير صالح: "${raw}". يجب أن يكون بتنسيق ISO-8601 صحيح.`
    );
  }
  const now = Date.now();
  if (parsed.getTime() > now + 60_000) {
    throw new Error(
      `التاريخ "${raw}" في المستقبل. يجب أن يكون created_at في الماضي أو الحاضر.`
    );
  }
  return parsed.toISOString();
}

/* ------------------------------------------------------------------ */
/*  Smart Ghost Community System — types & actions                      */
/* ------------------------------------------------------------------ */

type RolePreference = "poster" | "commenter" | "balanced";

type GhostIdentityInput = {
  display_name: string;
  username: string;
  activity_weight?: number;
  role_preference?: RolePreference;
};

type GhostIdentityFile = {
  ghost_users: GhostIdentityInput[];
};

type GhostIdentityRow = {
  id: string;
  display_name: string;
  username: string;
  activity_weight: number;
  role_preference: RolePreference;
};

export type GhostPoolStats = {
  total: number;
  posters: number;
  commenters: number;
  balanced: number;
  highActivity: number;
  mediumActivity: number;
  lowActivity: number;
  topIdentities: { display_name: string; username: string; activity_weight: number; role_preference: string }[];
};

export type GhostUploadResult = {
  success: boolean;
  added: number;
  skippedDuplicates: number;
  errors: string[];
};

const VALID_ROLES: RolePreference[] = ["poster", "commenter", "balanced"];

/** Upload ghost identities JSON — merges into existing pool */
export async function uploadGhostIdentities(
  jsonString: string
): Promise<GhostUploadResult> {
  const supabase = await assertAdmin();
  const errors: string[] = [];
  let added = 0;
  let skippedDuplicates = 0;

  let data: GhostIdentityFile;
  try {
    data = JSON.parse(jsonString);
  } catch {
    return { success: false, added: 0, skippedDuplicates: 0, errors: ["ملف JSON غير صالح. تأكد من صحة التنسيق."] };
  }

  if (!data.ghost_users || !Array.isArray(data.ghost_users)) {
    return { success: false, added: 0, skippedDuplicates: 0, errors: ['الملف يجب أن يحتوي على مفتاح "ghost_users" يكون مصفوفة.'] };
  }

  if (data.ghost_users.length === 0) {
    return { success: false, added: 0, skippedDuplicates: 0, errors: ["الملف لا يحتوي على أي حسابات شبحية."] };
  }

  for (let i = 0; i < data.ghost_users.length; i++) {
    const user = data.ghost_users[i];
    if (!user.display_name || typeof user.display_name !== "string") {
      errors.push(`حساب ${i + 1}: حقل display_name مطلوب ويجب أن يكون نصاً`);
    }
    if (!user.username || typeof user.username !== "string") {
      errors.push(`حساب ${i + 1}: حقل username مطلوب ويجب أن يكون نصاً`);
    }
    if (user.activity_weight !== undefined) {
      const w = Number(user.activity_weight);
      if (isNaN(w) || w < 0 || w > 1) {
        errors.push(`حساب ${i + 1}: activity_weight يجب أن يكون رقماً بين 0 و 1`);
      }
    }
    if (user.role_preference !== undefined && !VALID_ROLES.includes(user.role_preference)) {
      errors.push(`حساب ${i + 1}: role_preference يجب أن يكون "poster" أو "commenter" أو "balanced"`);
    }
  }

  if (errors.length > 0) {
    return { success: false, added: 0, skippedDuplicates: 0, errors };
  }

  const { data: existing } = await supabase
    .from("ghost_identities")
    .select("username")
    .limit(10000);
  const existingUsernames = new Set((existing ?? []).map((e: { username: string }) => e.username.toLowerCase()));

  const fileUsernames = new Set<string>();

  for (let i = 0; i < data.ghost_users.length; i++) {
    const user = data.ghost_users[i];
    const lowerUsername = user.username.toLowerCase();

    if (existingUsernames.has(lowerUsername)) {
      skippedDuplicates++;
      continue;
    }

    if (fileUsernames.has(lowerUsername)) {
      skippedDuplicates++;
      continue;
    }

    fileUsernames.add(lowerUsername);

    const weight = user.activity_weight !== undefined ? Math.max(0, Math.min(1, Number(user.activity_weight))) : 0.5;
    const role = user.role_preference && VALID_ROLES.includes(user.role_preference) ? user.role_preference : "balanced";

    const { error } = await supabase
      .from("ghost_identities")
      .insert({
        display_name: user.display_name.trim(),
        username: user.username.trim(),
        activity_weight: weight,
        role_preference: role,
      });

    if (error) {
      if (error.code === "23505") {
        skippedDuplicates++;
      } else {
        errors.push(`حساب "${user.username}": ${error.message}`);
      }
    } else {
      added++;
    }
  }

  return {
    success: errors.length === 0,
    added,
    skippedDuplicates,
    errors,
  };
}

/** Get ghost pool statistics with role/weight breakdown */
export async function getGhostPoolStats(): Promise<GhostPoolStats> {
  const supabase = await assertAdmin();

  const { data: all } = await supabase
    .from("ghost_identities")
    .select("display_name, username, activity_weight, role_preference")
    .limit(10000);

  const identities = all ?? [];
  const total = identities.length;
  let posters = 0, commenters = 0, balanced = 0;
  let highActivity = 0, mediumActivity = 0, lowActivity = 0;

  for (const g of identities) {
    const role = g.role_preference as string;
    if (role === "poster") posters++;
    else if (role === "commenter") commenters++;
    else balanced++;

    const w = g.activity_weight as number;
    if (w >= 0.7) highActivity++;
    else if (w >= 0.3) mediumActivity++;
    else lowActivity++;
  }

  // Top 10 highest-activity identities
  const sorted = [...identities].sort((a, b) => (b.activity_weight as number) - (a.activity_weight as number));
  const topIdentities = sorted.slice(0, 10).map(g => ({
    display_name: g.display_name as string,
    username: g.username as string,
    activity_weight: g.activity_weight as number,
    role_preference: g.role_preference as string,
  }));

  return { total, posters, commenters, balanced, highActivity, mediumActivity, lowActivity, topIdentities };
}

/** Clear entire ghost pool */
export async function clearGhostPool(): Promise<{ success: boolean; deleted: number }> {
  const supabase = await assertAdmin();

  const { count } = await supabase
    .from("ghost_identities")
    .select("*", { count: "exact", head: true });

  const { error } = await supabase
    .from("ghost_identities")
    .delete()
    .gte("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    throw new Error("فشل مسح مخزون الحسابات: " + error.message);
  }

  return { success: true, deleted: count ?? 0 };
}

/* ------------------------------------------------------------------ */
/*  Smart weighted selection with anti-repetition                       */
/* ------------------------------------------------------------------ */

/**
 * Weighted random pick from the ghost pool.
 * - Uses activity_weight as probability weight (higher = more likely to appear)
 * - role_preference filters: "poster" identities are boosted for posts,
 *   "commenter" identities are boosted for comments, "balanced" is neutral.
 * - batchUsageCounts tracks how many times each identity has been used in
 *   the current import batch to prevent over-repetition.
 */
function weightedPickGhost(
  pool: GhostIdentityRow[],
  context: "post" | "comment",
  batchUsageCounts: Map<string, number>
): GhostIdentityRow {
  if (pool.length === 0) {
    throw new Error(
      'لا توجد حسابات شبحية في المخزون. يرجى رفع ملف حسابات شبحية أولاً من قسم "مخزون الحسابات الشبحية".'
    );
  }

  // Calculate effective weights
  const weights: number[] = pool.map((ghost) => {
    let w = ghost.activity_weight;

    // Role preference boost (1.5x for matching role, 0.5x for opposite)
    if (context === "post") {
      if (ghost.role_preference === "poster") w *= 1.5;
      else if (ghost.role_preference === "commenter") w *= 0.5;
    } else {
      if (ghost.role_preference === "commenter") w *= 1.5;
      else if (ghost.role_preference === "poster") w *= 0.5;
    }

    // Anti-repetition: reduce weight based on how many times used in this batch
    const usedCount = batchUsageCounts.get(ghost.username) ?? 0;
    if (usedCount > 0) {
      // Each use in the batch halves the weight (diminishing but never zero)
      w *= Math.pow(0.5, usedCount);
    }

    // Ensure minimum weight so nobody is completely excluded
    return Math.max(w, 0.01);
  });

  // Weighted random selection
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < pool.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return pool[i];
    }
  }

  // Fallback (should not reach here)
  return pool[pool.length - 1];
}

/** Load the full ghost identity pool from DB */
async function loadGhostPool(
  supabase: ReturnType<typeof createAdminClient>
): Promise<GhostIdentityRow[]> {
  const { data, error } = await supabase
    .from("ghost_identities")
    .select("id, display_name, username, activity_weight, role_preference")
    .limit(10000);

  if (error) {
    throw new Error("فشل جلب مخزون الحسابات الشبحية: " + error.message);
  }

  if (!data || data.length === 0) {
    throw new Error(
      'لا توجد حسابات شبحية في المخزون. يرجى رفع ملف حسابات شبحية أولاً من قسم "مخزون الحسابات الشبحية".'
    );
  }

  return data.map(row => ({
    id: row.id as string,
    display_name: row.display_name as string,
    username: row.username as string,
    activity_weight: (row.activity_weight as number) ?? 0.5,
    role_preference: (row.role_preference as RolePreference) ?? "balanced",
  }));
}

/** Ensure a ghost profile exists in the profiles table, create if not */
async function ensureGhostProfile(
  supabase: ReturnType<typeof createAdminClient>,
  ghost: GhostIdentityRow,
  profileCache: Map<string, string>,
  newProfileCount: { count: number }
): Promise<string> {
  const cached = profileCache.get(ghost.username);
  if (cached) return cached;

  // Check if profile already exists
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", ghost.username)
    .maybeSingle();

  if (existing) {
    profileCache.set(ghost.username, existing.id);
    return existing.id;
  }

  // Create new ghost profile
  const { data: newId, error } = await supabase.rpc(
    "admin_create_ghost_profile",
    {
      p_username: ghost.username,
      p_display_name: ghost.display_name,
      p_avatar_url: null,
    }
  );

  if (error) {
    throw new Error(`فشل إنشاء الحساب الشبحي "${ghost.username}": ${error.message}`);
  }

  const id = typeof newId === "string" ? newId : String(newId);
  profileCache.set(ghost.username, id);
  newProfileCount.count++;
  return id;
}

/* ------------------------------------------------------------------ */
/*  Helper: resolve username → profile id (strict pool-only)            */
/* ------------------------------------------------------------------ */

/**
 * Resolves a username from the import JSON to a profile ID.
 *
 * STRICT RULE: Only ghost identities from the current ghost_identities
 * pool may be used. Old/deleted ghost profiles are NEVER reused.
 *
 * 1. If the username exists in the ghost pool → use that identity
 * 2. If not → pick a weighted random identity from the pool
 * 3. Never fall back to old profiles that aren't in the pool
 */
async function resolveProfileId(
  supabase: ReturnType<typeof createAdminClient>,
  username: string | undefined,
  profileCache: Map<string, string>,
  newProfileCount: { count: number },
  ghostPool: GhostIdentityRow[],
  batchUsageCounts: Map<string, number>,
  context: "post" | "comment",
  poolUsernameSet: Set<string>
): Promise<string> {
  // If username is provided and exists in the pool, use it directly
  if (username) {
    const inPool = poolUsernameSet.has(username);
    const poolEntry = inPool ? ghostPool.find(g => g.username === username) : null;

    if (poolEntry) {
      const cached = profileCache.get(poolEntry.username);
      if (cached) {
        batchUsageCounts.set(poolEntry.username, (batchUsageCounts.get(poolEntry.username) ?? 0) + 1);
        return cached;
      }
      const id = await ensureGhostProfile(supabase, poolEntry, profileCache, newProfileCount);
      batchUsageCounts.set(poolEntry.username, (batchUsageCounts.get(poolEntry.username) ?? 0) + 1);
      return id;
    }
  }

  // Username missing OR not in pool → auto-assign from pool via weighted selection
  const picked = weightedPickGhost(ghostPool, context, batchUsageCounts);
  const cachedPicked = profileCache.get(picked.username);
  if (cachedPicked) {
    batchUsageCounts.set(picked.username, (batchUsageCounts.get(picked.username) ?? 0) + 1);
    return cachedPicked;
  }
  const id = await ensureGhostProfile(supabase, picked, profileCache, newProfileCount);
  batchUsageCounts.set(picked.username, (batchUsageCounts.get(picked.username) ?? 0) + 1);
  return id;
}

/* ------------------------------------------------------------------ */
/*  Helper: insert a comment + its replies                             */
/* ------------------------------------------------------------------ */

async function insertComment(
  supabase: ReturnType<typeof createAdminClient>,
  comment: ImportComment,
  postId: string,
  parentId: string | null,
  profileCache: Map<string, string>,
  newProfileCount: { count: number },
  errors: string[],
  ghostPool: GhostIdentityRow[],
  batchUsageCounts: Map<string, number>,
  poolUsernameSet: Set<string>
): Promise<number> {
  let count = 0;

  try {
    const authorId = await resolveProfileId(
      supabase,
      comment.author_username,
      profileCache,
      newProfileCount,
      ghostPool,
      batchUsageCounts,
      "comment",
      poolUsernameSet
    );

    const { data: inserted, error } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        author_id: authorId,
        content: comment.content,
        parent_id: parentId,
        is_approved: true,
        created_at: validateTimestamp(comment.created_at),
        likes_count: comment.likes_count ?? 0,
      })
      .select("id")
      .single();

    if (error) {
      errors.push(`Comment by "${comment.author_username ?? "auto"}": ${error.message}`);
      return count;
    }

    count++;

    // Insert replies
    if (comment.replies && comment.replies.length > 0 && inserted) {
      for (const reply of comment.replies) {
        const replyAsComment: ImportComment = {
          ...reply,
          replies: undefined,
        };
        const replyCount = await insertComment(
          supabase,
          replyAsComment,
          postId,
          inserted.id,
          profileCache,
          newProfileCount,
          errors,
          ghostPool,
          batchUsageCounts,
          poolUsernameSet
        );
        count += replyCount;
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Comment by "${comment.author_username}": ${msg}`);
  }

  return count;
}

/* ------------------------------------------------------------------ */
/*  Main: Import posts + comments                                      */
/* ------------------------------------------------------------------ */

export async function importPostsWithComments(
  jsonString: string
): Promise<ImportResult> {
  const supabase = await assertAdmin();
  const errors: string[] = [];
  let postsCreated = 0;
  let commentsCreated = 0;
  const newProfileCount = { count: 0 };
  const profileCache = new Map<string, string>();
  const batchUsageCounts = new Map<string, number>();

  // Parse JSON
  let data: ImportPostsFile;
  try {
    data = JSON.parse(jsonString);
  } catch {
    return {
      success: false,
      postsCreated: 0,
      commentsCreated: 0,
      profilesCreated: 0,
      errors: ["ملف JSON غير صالح. تأكد من صحة التنسيق."],
    };
  }

  if (!data.posts || !Array.isArray(data.posts)) {
    return {
      success: false,
      postsCreated: 0,
      commentsCreated: 0,
      profilesCreated: 0,
      errors: ['الملف يجب أن يحتوي على مفتاح "posts" يكون مصفوفة.'],
    };
  }

  // Load ghost pool for weighted selection
  let ghostPool: GhostIdentityRow[];
  try {
    ghostPool = await loadGhostPool(supabase);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      postsCreated: 0,
      commentsCreated: 0,
      profilesCreated: 0,
      errors: [msg],
    };
  }

  // Build a set of valid ghost pool usernames for strict enforcement
  const poolUsernameSet = new Set(ghostPool.map(g => g.username));

  // Pre-load ONLY profiles that belong to the current ghost pool into cache
  // This prevents old/deleted ghost profiles from being used
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, username")
    .limit(10000);
  for (const p of allProfiles ?? []) {
    if (poolUsernameSet.has(p.username)) {
      profileCache.set(p.username, p.id);
    }
  }

  // Process each post
  for (let i = 0; i < data.posts.length; i++) {
    const post = data.posts[i];

    // Validate required fields (author_username is now optional)
    if (!post.content || !post.created_at) {
      errors.push(
        `منشور ${i + 1}: حقول مطلوبة مفقودة (content, created_at)`
      );
      continue;
    }

    try {
      // Resolve author (context: "post") — strict pool-only
      const authorId = await resolveProfileId(
        supabase,
        post.author_username,
        profileCache,
        newProfileCount,
        ghostPool,
        batchUsageCounts,
        "post",
        poolUsernameSet
      );

      // Map sport
      const sportValue = post.sport ? SPORT_MAP[post.sport] || null : null;

      // Insert post
      const { data: insertedPost, error: postError } = await supabase
        .from("posts")
        .insert({
          content: post.content,
          sport: sportValue,
          author_id: authorId,
          is_approved: true,
          created_at: validateTimestamp(post.created_at),
          likes_count: post.likes_count ?? 0,
          comments_count: 0, // trigger trg_comment_insert will increment for each comment
        })
        .select("id")
        .single();

      if (postError) {
        errors.push(`منشور ${i + 1}: ${postError.message}`);
        continue;
      }

      postsCreated++;

      // Insert comments
      if (post.comments && insertedPost) {
        for (const comment of post.comments) {
          if (!comment.content || !comment.created_at) {
            errors.push(
              `تعليق في المنشور ${i + 1}: حقول مطلوبة مفقودة (content, created_at)`
            );
            continue;
          }
          const commentCount = await insertComment(
            supabase,
            comment,
            insertedPost.id,
            null,
            profileCache,
            newProfileCount,
            errors,
            ghostPool,
            batchUsageCounts,
            poolUsernameSet
          );
          commentsCreated += commentCount;
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`منشور ${i + 1}: ${msg}`);
    }
  }

  revalidatePath("/");
  return {
    success: errors.length === 0,
    postsCreated,
    commentsCreated,
    profilesCreated: newProfileCount.count,
    errors,
  };
}

/* ------------------------------------------------------------------ */
/*  Main: Import comments only (to existing posts)                     */
/* ------------------------------------------------------------------ */

export async function importCommentsOnly(
  jsonString: string
): Promise<ImportResult> {
  const supabase = await assertAdmin();
  const errors: string[] = [];
  let commentsCreated = 0;
  const newProfileCount = { count: 0 };
  const profileCache = new Map<string, string>();
  const batchUsageCounts = new Map<string, number>();

  // Parse JSON
  let data: ImportCommentsFile;
  try {
    data = JSON.parse(jsonString);
  } catch {
    return {
      success: false,
      postsCreated: 0,
      commentsCreated: 0,
      profilesCreated: 0,
      errors: ["ملف JSON غير صالح. تأكد من صحة التنسيق."],
    };
  }

  if (!data.comments || !Array.isArray(data.comments)) {
    return {
      success: false,
      postsCreated: 0,
      commentsCreated: 0,
      profilesCreated: 0,
      errors: ['الملف يجب أن يحتوي على مفتاح "comments" يكون مصفوفة.'],
    };
  }

  // Load ghost pool for weighted selection
  let ghostPool: GhostIdentityRow[];
  try {
    ghostPool = await loadGhostPool(supabase);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      postsCreated: 0,
      commentsCreated: 0,
      profilesCreated: 0,
      errors: [msg],
    };
  }

  // Build a set of valid ghost pool usernames for strict enforcement
  const poolUsernameSet = new Set(ghostPool.map(g => g.username));

  // Pre-load ONLY profiles that belong to the current ghost pool into cache
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, username")
    .limit(10000);
  for (const p of allProfiles ?? []) {
    if (poolUsernameSet.has(p.username)) {
      profileCache.set(p.username, p.id);
    }
  }

  // Process each post's comments
  for (let i = 0; i < data.comments.length; i++) {
    const entry = data.comments[i];

    if (!entry.post_id || !entry.entries || !Array.isArray(entry.entries)) {
      errors.push(
        `مجموعة التعليقات ${i + 1}: حقول مطلوبة مفقودة (post_id, entries)`
      );
      continue;
    }

    // Verify post exists
    const { data: postExists } = await supabase
      .from("posts")
      .select("id")
      .eq("id", entry.post_id)
      .maybeSingle();

    if (!postExists) {
      errors.push(
        `مجموعة التعليقات ${i + 1}: المنشور "${entry.post_id}" غير موجود`
      );
      continue;
    }

    for (const comment of entry.entries) {
      if (!comment.content || !comment.created_at) {
        errors.push(
          `تعليق في المجموعة ${i + 1}: حقول مطلوبة مفقودة (content, created_at)`
        );
        continue;
      }
      const count = await insertComment(
        supabase,
        comment,
        entry.post_id,
        null,
        profileCache,
        newProfileCount,
        errors,
        ghostPool,
        batchUsageCounts,
        poolUsernameSet
      );
      commentsCreated += count;
    }

    // comments_count is handled by trigger trg_comment_insert — no manual update needed
  }

  revalidatePath("/");
  return {
    success: errors.length === 0,
    postsCreated: 0,
    commentsCreated,
    profilesCreated: newProfileCount.count,
    errors,
  };
}

/* ------------------------------------------------------------------ */
/*  Cleanup: reassign all stale ghost content to valid pool identities */
/* ------------------------------------------------------------------ */

export type CleanupResult = {
  postsReassigned: number;
  commentsReassigned: number;
  staleProfilesDeleted: number;
  errors: string[];
};

/**
 * Finds ALL posts and comments authored by profiles NOT in the ghost pool
 * (excluding admin accounts) and reassigns them to valid ghost pool identities.
 * Then deletes the stale profiles.
 */
export async function cleanupStaleGhostContent(): Promise<CleanupResult> {
  const supabase = await assertAdmin();
  const errors: string[] = [];
  let postsReassigned = 0;
  let commentsReassigned = 0;
  let staleProfilesDeleted = 0;

  // Load ghost pool
  const ghostPool = await loadGhostPool(supabase);
  const poolUsernameSet = new Set(ghostPool.map(g => g.username));
  const profileCache = new Map<string, string>();
  const newProfileCount = { count: 0 };
  const batchUsageCounts = new Map<string, number>();

  // Admin profile IDs to exclude from cleanup
  const ADMIN_USERNAMES = ["one", "user_8fdbc0d9"];

  // Step 1: Find all stale profiles (have content but NOT in ghost pool)
  const { data: staleProfiles } = await supabase
    .from("profiles")
    .select("id, username")
    .limit(10000);

  if (!staleProfiles) {
    return { postsReassigned: 0, commentsReassigned: 0, staleProfilesDeleted: 0, errors: ["Failed to load profiles"] };
  }

  // Filter to stale ghost profiles (not in pool, not admin)
  const staleProfileList = staleProfiles.filter(
    p => !poolUsernameSet.has(p.username) && !ADMIN_USERNAMES.includes(p.username)
  );

  if (staleProfileList.length === 0) {
    return { postsReassigned: 0, commentsReassigned: 0, staleProfilesDeleted: 0, errors: ["No stale profiles found"] };
  }

  // Pre-load existing pool profiles into cache
  for (const p of staleProfiles) {
    if (poolUsernameSet.has(p.username)) {
      profileCache.set(p.username, p.id);
    }
  }

  // Step 2: For each stale profile, pick a valid pool identity and reassign content
  for (const stale of staleProfileList) {
    try {
      // Pick a weighted random pool identity for this stale profile
      const picked = weightedPickGhost(ghostPool, "comment", batchUsageCounts);
      const newProfileId = await ensureGhostProfile(supabase, picked, profileCache, newProfileCount);
      batchUsageCounts.set(picked.username, (batchUsageCounts.get(picked.username) ?? 0) + 1);

      // Reassign all posts from this stale profile
      const { data: stalePosts } = await supabase
        .from("posts")
        .select("id")
        .eq("author_id", stale.id);

      if (stalePosts && stalePosts.length > 0) {
        const { error: postErr } = await supabase
          .from("posts")
          .update({ author_id: newProfileId })
          .eq("author_id", stale.id);
        if (postErr) {
          errors.push(`Failed to reassign posts from ${stale.username}: ${postErr.message}`);
        } else {
          postsReassigned += stalePosts.length;
        }
      }

      // Reassign all comments from this stale profile
      const { data: staleComments } = await supabase
        .from("comments")
        .select("id")
        .eq("author_id", stale.id);

      if (staleComments && staleComments.length > 0) {
        const { error: commentErr } = await supabase
          .from("comments")
          .update({ author_id: newProfileId })
          .eq("author_id", stale.id);
        if (commentErr) {
          errors.push(`Failed to reassign comments from ${stale.username}: ${commentErr.message}`);
        } else {
          commentsReassigned += staleComments.length;
        }
      }

      // Step 3: Delete the stale profile (and its auth.users entry)
      // First delete profile, then auth user
      const { error: delProfileErr } = await supabase
        .from("profiles")
        .delete()
        .eq("id", stale.id);

      if (delProfileErr) {
        errors.push(`Failed to delete stale profile ${stale.username}: ${delProfileErr.message}`);
      } else {
        // Try to delete the auth.users entry too
        await supabase.auth.admin.deleteUser(stale.id);
        staleProfilesDeleted++;
      }
    } catch (e) {
      errors.push(`Error processing ${stale.username}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  revalidatePath("/");
  revalidatePath("/admin/import");

  return {
    postsReassigned,
    commentsReassigned,
    staleProfilesDeleted,
    errors,
  };
}

/* ------------------------------------------------------------------ */
/*  Ghost Avatar ZIP Upload + Auto-distribution                        */
/* ------------------------------------------------------------------ */

function guessContentType(filename: string): string | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    default:
      return null;
  }
}

export type ZipUploadResult = {
  success: boolean;
  uploaded: number;
  assigned: number;
  errors: string[];
};

/** Upload a ZIP of avatar images → ghost-avatars bucket → assign to ghost profiles without avatars */
export async function uploadGhostAvatarsZip(
  formData: FormData
): Promise<ZipUploadResult> {
  const supabase = await assertAdmin();
  const errors: string[] = [];
  let uploaded = 0;
  let assigned = 0;

  const file = formData.get("file") as File | null;
  if (!file) {
    return { success: false, uploaded: 0, assigned: 0, errors: ["لم يتم تحديد ملف"] };
  }

  // Extract ZIP
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // Collect valid image entries
  const imageEntries: { name: string; file: JSZip.JSZipObject }[] = [];
  zip.forEach((relativePath, zipEntry) => {
    if (zipEntry.dir) return;
    // Skip macOS metadata files
    if (relativePath.startsWith("__MACOSX/") || relativePath.startsWith(".")) return;
    const contentType = guessContentType(relativePath);
    if (!contentType) return;
    imageEntries.push({ name: relativePath, file: zipEntry });
  });

  if (imageEntries.length === 0) {
    return { success: false, uploaded: 0, assigned: 0, errors: ["لم يتم العثور على صور صالحة في الملف المضغوط (يدعم: jpg, png, webp, gif)"] };
  }

  // Upload each image to ghost-avatars bucket
  const uploadedUrls: string[] = [];
  for (const entry of imageEntries) {
    const data = await entry.file.async("uint8array");
    const contentType = guessContentType(entry.name)!;
    const ext = entry.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const storagePath = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("ghost-avatars")
      .upload(storagePath, data, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      errors.push(`فشل رفع "${entry.name}": ${uploadError.message}`);
      continue;
    }

    const { data: urlData } = supabase.storage
      .from("ghost-avatars")
      .getPublicUrl(storagePath);

    uploadedUrls.push(urlData.publicUrl);
    uploaded++;
  }

  if (uploadedUrls.length === 0) {
    return { success: false, uploaded: 0, assigned: 0, errors };
  }

  // Find ghost profiles without avatars (profiles that exist in ghost_identities pool)
  const { data: ghostIdentities } = await supabase
    .from("ghost_identities")
    .select("username")
    .limit(10000);

  if (ghostIdentities && ghostIdentities.length > 0) {
    const ghostUsernames = ghostIdentities.map((g: { username: string }) => g.username);

    const { data: ghostProfiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("username", ghostUsernames)
      .limit(10000);

    const profilesWithoutAvatars = (ghostProfiles ?? []).filter(
      (p: { avatar_url: string | null }) => !p.avatar_url
    );

    // Distribute avatars round-robin to profiles without avatars
    for (let i = 0; i < profilesWithoutAvatars.length; i++) {
      const avatarUrl = uploadedUrls[i % uploadedUrls.length];
      const profile = profilesWithoutAvatars[i];

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", profile.id);

      if (updateError) {
        errors.push(`فشل تعيين صورة لـ "${profile.username}": ${updateError.message}`);
      } else {
        assigned++;
      }
    }
  }

  revalidatePath("/");
  revalidatePath("/admin/import");

  return {
    success: errors.length === 0,
    uploaded,
    assigned,
    errors,
  };
}

/** Upload a ZIP of cover images → preset-covers bucket */
export async function uploadPresetCoversZip(
  formData: FormData
): Promise<ZipUploadResult> {
  const supabase = await assertAdmin();
  const errors: string[] = [];
  let uploaded = 0;

  const file = formData.get("file") as File | null;
  if (!file) {
    return { success: false, uploaded: 0, assigned: 0, errors: ["لم يتم تحديد ملف"] };
  }

  // Extract ZIP
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // Collect valid image entries
  const imageEntries: { name: string; file: JSZip.JSZipObject }[] = [];
  zip.forEach((relativePath, zipEntry) => {
    if (zipEntry.dir) return;
    if (relativePath.startsWith("__MACOSX/") || relativePath.startsWith(".")) return;
    const contentType = guessContentType(relativePath);
    if (!contentType) return;
    imageEntries.push({ name: relativePath, file: zipEntry });
  });

  if (imageEntries.length === 0) {
    return { success: false, uploaded: 0, assigned: 0, errors: ["لم يتم العثور على صور صالحة في الملف المضغوط (يدعم: jpg, png, webp, gif)"] };
  }

  // Upload each image to preset-covers bucket
  for (const entry of imageEntries) {
    const data = await entry.file.async("uint8array");
    const contentType = guessContentType(entry.name)!;
    const ext = entry.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const storagePath = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("preset-covers")
      .upload(storagePath, data, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      errors.push(`فشل رفع "${entry.name}": ${uploadError.message}`);
      continue;
    }

    uploaded++;
  }

  revalidatePath("/");
  revalidatePath("/admin/import");
  revalidatePath("/profile/edit");

  return {
    success: errors.length === 0,
    uploaded,
    assigned: 0,
    errors,
  };
}
