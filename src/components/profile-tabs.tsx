"use client";

import { useState } from "react";
import type { Post } from "@/lib/supabase/types";
import PostCard from "./post-card";
import TipCard from "./tip-card";

type Tab = "posts" | "tips" | "likes";

export default function ProfileTabs({
  regularPosts,
  tipPosts,
  likedPosts,
  userId,
  isOwnProfile,
  isAdmin = false,
}: {
  regularPosts: Post[];
  tipPosts: Post[];
  likedPosts: Post[];
  userId: string | null;
  isOwnProfile: boolean;
  isAdmin?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("posts");

  const tabs: { key: Tab; label: string; show: boolean }[] = [
    { key: "posts", label: `المنشورات (${regularPosts.length})`, show: true },
    { key: "tips", label: `التوقعات (${tipPosts.length})`, show: true },
    {
      key: "likes",
      label: `الإعجابات (${likedPosts.length})`,
      show: isOwnProfile,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex border-b border-zinc-800">
        {tabs
          .filter((t) => t.show)
          .map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 text-center py-3 text-sm font-medium transition-colors cursor-pointer ${
                activeTab === tab.key
                  ? "text-emerald-400 border-b-2 border-emerald-400"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
      </div>

      {/* Tab content */}
      {activeTab === "posts" && (
        <div className="space-y-4">
          {regularPosts.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-8">
              لا توجد منشورات
            </p>
          ) : (
            regularPosts.map((post) => (
              <PostCard key={post.id} post={post} userId={userId} isAdmin={isAdmin} />
            ))
          )}
        </div>
      )}

      {activeTab === "tips" && (
        <div className="space-y-4">
          {tipPosts.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-8">
              لا توجد توقعات
            </p>
          ) : (
            tipPosts.map((post) => (
              <TipCard
                key={post.id}
                post={post}
                userId={userId}
                canSettle={isOwnProfile || false}
                isAdmin={isAdmin}
              />
            ))
          )}
        </div>
      )}

      {activeTab === "likes" && isOwnProfile && (
        <div className="space-y-4">
          {likedPosts.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-8">
              لا توجد إعجابات
            </p>
          ) : (
            likedPosts.map((post) =>
              post.tip_data ? (
                <TipCard
                  key={post.id}
                  post={post}
                  userId={userId}
                  canSettle={false}
                  isAdmin={isAdmin}
                />
              ) : (
                <PostCard key={post.id} post={post} userId={userId} isAdmin={isAdmin} />
              )
            )
          )}
        </div>
      )}
    </div>
  );
}
