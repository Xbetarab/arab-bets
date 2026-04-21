import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Post, Profile } from "@/lib/supabase/types";
import FollowButton from "@/components/follow-button";
import ProfileTabs from "@/components/profile-tabs";
import Link from "next/link";

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, bio")
    .ilike("username", username)
    .single();

  if (!profile) return { title: "مستخدم غير موجود | arabtips" };

  return {
    title: `${profile.display_name} (@${username}) | arabtips`,
    description: profile.bio || `ملف ${profile.display_name} على arabtips`,
  };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .ilike("username", username)
    .single();

  if (!profile) notFound();

  const typedProfile = profile as unknown as Profile;
  const isOwnProfile = user?.id === typedProfile.id;

  // Fetch user's posts
  const { data: posts } = await supabase
    .from("posts")
    .select("*, profiles:author_id(*)")
    .eq("author_id", typedProfile.id)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(50);

  const allPosts = (posts as unknown as Post[]) ?? [];
  const regularPosts = allPosts.filter((p) => !p.tip_data);
  const tipPosts = allPosts.filter((p) => p.tip_data);

  // Check post count
  const { count: postCount } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("author_id", typedProfile.id)
    .eq("is_approved", true);

  // Check if current user follows this profile
  let isFollowing = false;
  if (user && !isOwnProfile) {
    const { data: followData } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", typedProfile.id)
      .maybeSingle();
    isFollowing = !!followData;
  }

  // Liked posts (only visible on own profile)
  let likedPosts: Post[] = [];
  if (isOwnProfile) {
    const { data: likes } = await supabase
      .from("likes")
      .select("target_id")
      .eq("user_id", user!.id)
      .eq("target_type", "post")
      .order("created_at", { ascending: false })
      .limit(50);

    if (likes && likes.length > 0) {
      const ids = likes.map((l: { target_id: string }) => l.target_id);
      const { data: likedPostsData } = await supabase
        .from("posts")
        .select("*, profiles:author_id(*)")
        .in("id", ids)
        .eq("is_approved", true);
      likedPosts = (likedPostsData as unknown as Post[]) ?? [];
    }
  }

  // Format join date
  const joinDate = new Date(typedProfile.created_at);
  const monthNames = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
  ];
  const joinStr = `${monthNames[joinDate.getMonth()]} ${joinDate.getFullYear()}`;

  return (
    <div dir="rtl" className="space-y-4 -mt-2">
      {/* Cover */}
      <div className="relative h-32 sm:h-40 rounded-xl overflow-hidden">
        {typedProfile.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={typedProfile.cover_url}
            alt="غلاف"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-600/30 to-zinc-900" />
        )}
      </div>

      {/* Avatar + info */}
      <div className="relative px-1">
        <div className="-mt-12 flex items-end gap-3">
          {typedProfile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={typedProfile.avatar_url}
              alt={typedProfile.display_name}
              className="w-20 h-20 rounded-full object-cover border-4 border-zinc-950 shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-emerald-600/20 flex items-center justify-center text-emerald-400 font-bold text-2xl border-4 border-zinc-950 shrink-0">
              {typedProfile.display_name?.charAt(0) || "?"}
            </div>
          )}
          <div className="flex-1 min-w-0 pb-1">
            <h1 className="text-white text-lg font-bold truncate">
              {typedProfile.display_name}
            </h1>
            <p className="text-zinc-500 text-sm">@{typedProfile.username}</p>
          </div>
        </div>

        {/* Action button */}
        <div className="mt-3">
          {isOwnProfile ? (
            <Link
              href="/profile/edit"
              className="inline-block bg-zinc-800 hover:bg-zinc-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              تعديل الملف الشخصي
            </Link>
          ) : user ? (
            <FollowButton
              targetUserId={typedProfile.id}
              initialFollowing={isFollowing}
            />
          ) : (
            <Link
              href="/auth/login"
              className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              تسجيل الدخول للمتابعة
            </Link>
          )}
        </div>

        {/* Bio */}
        {typedProfile.bio && (
          <p className="text-zinc-300 text-sm mt-3 leading-relaxed">
            {typedProfile.bio}
          </p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-3 text-sm">
          <span className="text-zinc-400">
            <span className="text-white font-medium">{postCount ?? 0}</span>{" "}
            منشور
          </span>
          <span className="text-zinc-400">
            <span className="text-white font-medium">
              {typedProfile.followers_count ?? 0}
            </span>{" "}
            متابع
          </span>
          <span className="text-zinc-400">
            <span className="text-white font-medium">
              {typedProfile.following_count ?? 0}
            </span>{" "}
            متابَع
          </span>
        </div>

        {/* Join date */}
        <p className="text-zinc-600 text-xs mt-2">
          انضم في {joinStr}
        </p>
      </div>

      {/* Content tabs */}
      <ProfileTabs
        regularPosts={regularPosts}
        tipPosts={tipPosts}
        likedPosts={likedPosts}
        userId={user?.id ?? null}
        isOwnProfile={isOwnProfile}
      />
    </div>
  );
}
