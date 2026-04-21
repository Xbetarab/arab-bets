"use client";

import { useState, useTransition } from "react";
import { toggleFollow } from "@/app/actions/follows";

export default function FollowButton({
  targetUserId,
  initialFollowing,
}: {
  targetUserId: string;
  initialFollowing: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    setFollowing((prev) => !prev);
    startTransition(async () => {
      const result = await toggleFollow(targetUserId);
      setFollowing(result.following);
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`text-sm px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50 min-h-[44px] ${
        following
          ? "bg-zinc-800 hover:bg-red-600/20 text-zinc-300 hover:text-red-400 border border-zinc-700"
          : "bg-emerald-600 hover:bg-emerald-500 text-white"
      }`}
    >
      {isPending
        ? "..."
        : following
          ? "إلغاء المتابعة"
          : "متابعة"}
    </button>
  );
}
