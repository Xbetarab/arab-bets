"use client";

import { useState, useEffect, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { createGhostProfile, createGhostComment } from "../actions";
import TimeOffsetSelect, { computeTimestamp } from "@/components/time-offset-select";

type GhostProfile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

export default function GhostPage() {
  const [profiles, setProfiles] = useState<GhostProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState("");
  const [isPending, startTransition] = useTransition();

  // New ghost form
  const [newUsername, setNewUsername] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newAvatarUrl, setNewAvatarUrl] = useState("");

  // Comment form
  const [postId, setPostId] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [parentId, setParentId] = useState("");
  const [timeOffset, setTimeOffset] = useState(0);

  // Feedback
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function loadProfiles() {
    const supabase = createClient();
    // Fetch all profiles — admin can pick any as ghost
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .order("created_at", { ascending: false })
      .limit(100);
    setProfiles((data as GhostProfile[]) ?? []);
  }

  useEffect(() => {
    loadProfiles();
  }, []);

  function handleCreateGhost() {
    if (!newUsername.trim() || !newDisplayName.trim()) return;
    setMessage(null);
    startTransition(async () => {
      try {
        await createGhostProfile(
          newUsername.trim(),
          newDisplayName.trim(),
          newAvatarUrl.trim() || undefined
        );
        setMessage({ type: "success", text: "تم إنشاء الحساب الشبحي بنجاح" });
        setNewUsername("");
        setNewDisplayName("");
        setNewAvatarUrl("");
        loadProfiles();
      } catch (err: unknown) {
        const errorObj = err as { message?: string; code?: string; details?: string; hint?: string };
        const detail = [errorObj.message, errorObj.code, errorObj.details, errorObj.hint].filter(Boolean).join(" | ");
        console.error("Ghost profile error:", err);
        setMessage({
          type: "error",
          text: detail || "فشل إنشاء الحساب",
        });
      }
    });
  }

  function handlePostComment() {
    if (!selectedProfile || !postId.trim() || !commentContent.trim()) return;
    setMessage(null);
    startTransition(async () => {
      try {
        const ts = timeOffset > 0 ? computeTimestamp(timeOffset) : undefined;
        await createGhostComment(
          selectedProfile,
          postId.trim(),
          commentContent.trim(),
          parentId.trim() || undefined,
          ts
        );
        setMessage({ type: "success", text: "تم نشر التعليق الشبحي بنجاح" });
        setCommentContent("");
        setParentId("");
        setTimeOffset(0);
      } catch (err: unknown) {
        const errorObj = err as { message?: string; code?: string; details?: string; hint?: string };
        const detail = [errorObj.message, errorObj.code, errorObj.details, errorObj.hint].filter(Boolean).join(" | ");
        console.error("Ghost comment error:", err);
        setMessage({
          type: "error",
          text: detail || "فشل نشر التعليق",
        });
      }
    });
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-xl font-bold text-white">التعليقات الشبحية</h1>

      {/* Feedback */}
      {message && (
        <div
          className={`text-sm px-4 py-2 rounded-lg ${
            message.type === "success"
              ? "bg-emerald-600/10 text-emerald-400 border border-emerald-600/20"
              : "bg-red-600/10 text-red-400 border border-red-600/20"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Step 1: Create ghost profile */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
        <h2 className="text-sm font-medium text-zinc-300">
          إنشاء حساب شبحي جديد
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="اسم المستخدم"
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
          <input
            value={newDisplayName}
            onChange={(e) => setNewDisplayName(e.target.value)}
            placeholder="الاسم المعروض"
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>
        <input
          value={newAvatarUrl}
          onChange={(e) => setNewAvatarUrl(e.target.value)}
          placeholder="رابط الصورة الرمزية (اختياري)"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        />
        <button
          onClick={handleCreateGhost}
          disabled={isPending || !newUsername.trim() || !newDisplayName.trim()}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {isPending ? "جاري الإنشاء..." : "إنشاء حساب شبحي"}
        </button>
      </div>

      {/* Step 2: Write ghost comment */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
        <h2 className="text-sm font-medium text-zinc-300">كتابة تعليق شبحي</h2>

        <div className="space-y-1.5">
          <label className="text-xs text-zinc-500">اختر الحساب الشبحي</label>
          <select
            value={selectedProfile}
            onChange={(e) => setSelectedProfile(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none cursor-pointer"
          >
            <option value="">اختر حساب...</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.display_name} (@{p.username})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500">معرف المنشور</label>
            <input
              value={postId}
              onChange={(e) => setPostId(e.target.value)}
              placeholder="Post ID (UUID)"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500">
              معرف التعليق الأب (اختياري)
            </label>
            <input
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              placeholder="Parent comment ID"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
        </div>

        <TimeOffsetSelect value={timeOffset} onChange={setTimeOffset} />

        <textarea
          value={commentContent}
          onChange={(e) => setCommentContent(e.target.value)}
          placeholder="محتوى التعليق..."
          rows={3}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        />

        <button
          onClick={handlePostComment}
          disabled={
            isPending ||
            !selectedProfile ||
            !postId.trim() ||
            !commentContent.trim()
          }
          className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {isPending ? "جاري النشر..." : "نشر التعليق"}
        </button>
      </div>
    </div>
  );
}
