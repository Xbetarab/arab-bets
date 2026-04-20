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
/*  Helper: resolve username → profile id (auto-create if missing)     */
/* ------------------------------------------------------------------ */

async function resolveProfileId(
  supabase: ReturnType<typeof createAdminClient>,
  username: string,
  profileCache: Map<string, string>,
  newProfileCount: { count: number }
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

  // Auto-create ghost profile
  const displayName = username.replace(/_/g, " ");
  const { data: newId, error } = await supabase.rpc(
    "admin_create_ghost_profile",
    {
      p_username: username,
      p_display_name: displayName,
      p_avatar_url: null,
    }
  );

  if (error) {
    throw new Error(`Failed to create ghost profile "${username}": ${error.message}`);
  }

  const id = typeof newId === "string" ? newId : String(newId);
  profileCache.set(username, id);
  newProfileCount.count++;
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
  errors: string[]
): Promise<number> {
  let count = 0;

  try {
    const authorId = await resolveProfileId(
      supabase,
      comment.author_username,
      profileCache,
      newProfileCount
    );

    const { data: inserted, error } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        author_id: authorId,
        content: comment.content,
        parent_id: parentId,
        is_approved: true,
        created_at: comment.created_at,
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
          errors
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
      // Resolve author
      const authorId = await resolveProfileId(
        supabase,
        post.author_username,
        profileCache,
        newProfileCount
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
          created_at: post.created_at,
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
            errors
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
        errors
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
