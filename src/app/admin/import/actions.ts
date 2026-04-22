"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

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
  author_username: string;
  content: string;
  created_at: string;
  likes_count?: number;
};

type ImportComment = {
  author_username: string;
  content: string;
  created_at: string;
  likes_count?: number;
  replies?: ImportReply[];
};

type ImportPost = {
  author_username: string;
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
      batchUsageCounts.set(pool[i].username, (batchUsageCounts.get(pool[i].username) ?? 0) + 1);
      return pool[i];
    }
  }

  // Fallback (should not reach here)
  const last = pool[pool.length - 1];
  batchUsageCounts.set(last.username, (batchUsageCounts.get(last.username) ?? 0) + 1);
  return last;
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
/*  Helper: resolve username → profile id (smart pool-based)            */
/* ------------------------------------------------------------------ */

async function resolveProfileId(
  supabase: ReturnType<typeof createAdminClient>,
  username: string,
  profileCache: Map<string, string>,
  newProfileCount: { count: number },
  ghostPool: GhostIdentityRow[],
  batchUsageCounts: Map<string, number>,
  context: "post" | "comment"
): Promise<string> {
  // Check cache first
  const cached = profileCache.get(username);
  if (cached) return cached;

  // Look up in DB
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existing) {
    profileCache.set(username, existing.id);
    return existing.id;
  }

  // Username not found — check if it exists in the ghost pool
  const poolEntry = ghostPool.find(g => g.username === username);

  if (poolEntry) {
    // Create ghost profile from this specific pool entry
    const id = await ensureGhostProfile(supabase, poolEntry, profileCache, newProfileCount);
    batchUsageCounts.set(poolEntry.username, (batchUsageCounts.get(poolEntry.username) ?? 0) + 1);
    return id;
  }

  // Not in profiles and not in pool — pick a weighted random identity
  const picked = weightedPickGhost(ghostPool, context, batchUsageCounts);
  const id = await ensureGhostProfile(supabase, picked, profileCache, newProfileCount);
  // Also cache the original username pointing to this profile
  profileCache.set(username, id);
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
  batchUsageCounts: Map<string, number>
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
      "comment"
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
      errors.push(`Comment by "${comment.author_username}": ${error.message}`);
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
          batchUsageCounts
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

  // Pre-load all existing profiles into cache for speed
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, username")
    .limit(5000);
  for (const p of allProfiles ?? []) {
    profileCache.set(p.username, p.id);
  }

  // Process each post
  for (let i = 0; i < data.posts.length; i++) {
    const post = data.posts[i];

    // Validate required fields
    if (!post.author_username || !post.content || !post.created_at) {
      errors.push(
        `منشور ${i + 1}: حقول مطلوبة مفقودة (author_username, content, created_at)`
      );
      continue;
    }

    try {
      // Resolve author (context: "post")
      const authorId = await resolveProfileId(
        supabase,
        post.author_username,
        profileCache,
        newProfileCount,
        ghostPool,
        batchUsageCounts,
        "post"
      );

      // Map sport
      const sportValue = post.sport ? SPORT_MAP[post.sport] || null : null;

      // Count total comments (comments + their replies)
      let totalComments = 0;
      if (post.comments) {
        for (const c of post.comments) {
          totalComments++;
          if (c.replies) totalComments += c.replies.length;
        }
      }

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
          comments_count: totalComments,
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
          if (!comment.author_username || !comment.content || !comment.created_at) {
            errors.push(
              `تعليق في المنشور ${i + 1}: حقول مطلوبة مفقودة`
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
            batchUsageCounts
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

  // Pre-load all existing profiles into cache
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, username")
    .limit(5000);
  for (const p of allProfiles ?? []) {
    profileCache.set(p.username, p.id);
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

    let entryCommentCount = 0;

    for (const comment of entry.entries) {
      if (!comment.author_username || !comment.content || !comment.created_at) {
        errors.push(
          `تعليق في المجموعة ${i + 1}: حقول مطلوبة مفقودة`
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
        batchUsageCounts
      );
      commentsCreated += count;
      entryCommentCount += count;
    }

    // Update the post's comments_count
    if (entryCommentCount > 0) {
      // Get current count and add
      const { data: currentPost } = await supabase
        .from("posts")
        .select("comments_count")
        .eq("id", entry.post_id)
        .single();

      if (currentPost) {
        await supabase
          .from("posts")
          .update({
            comments_count: (currentPost.comments_count ?? 0) + entryCommentCount,
          })
          .eq("id", entry.post_id);
      }
    }
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
