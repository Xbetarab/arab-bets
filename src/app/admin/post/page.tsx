"use client";

import { useState, useEffect, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { adminCreatePost } from "../actions";
import { SPORTS } from "@/lib/supabase/types";
import TimeOffsetSelect, { computeTimestamp } from "@/components/time-offset-select";

type ProfileOption = {
  id: string;
  username: string;
  display_name: string;
};

export default function AdminPostPage() {
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [selectedAuthor, setSelectedAuthor] = useState("");
  const [content, setContent] = useState("");
  const [sport, setSport] = useState("");
  const [timeOffset, setTimeOffset] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("id, username, display_name")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setProfiles((data as ProfileOption[]) ?? []);
      });
  }, []);

  function handleSubmit() {
    if (!content.trim() || !selectedAuthor) return;
    setMessage(null);
    startTransition(async () => {
      try {
        const ts = timeOffset > 0 ? computeTimestamp(timeOffset) : undefined;
        await adminCreatePost(
          content.trim(),
          sport || null,
          selectedAuthor,
          ts
        );
        setMessage({ type: "success", text: "تم نشر المنشور بنجاح" });
        setContent("");
        setSport("");
        setTimeOffset(0);
      } catch (err: unknown) {
        const errorObj = err as { message?: string };
        console.error("Admin post error:", err);
        setMessage({
          type: "error",
          text: errorObj.message || "فشل نشر المنشور",
        });
      }
    });
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-xl font-bold text-white">نشر منشور (God Mode)</h1>

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

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs text-zinc-500">الناشر (الحساب)</label>
          <select
            value={selectedAuthor}
            onChange={(e) => setSelectedAuthor(e.target.value)}
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

        <div className="space-y-1.5">
          <label className="text-xs text-zinc-500">الرياضة (اختياري)</label>
          <select
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none cursor-pointer"
          >
            <option value="">بدون تصنيف</option>
            {SPORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <TimeOffsetSelect value={timeOffset} onChange={setTimeOffset} />

        <div className="space-y-1.5">
          <label className="text-xs text-zinc-500">محتوى المنشور</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="اكتب المنشور..."
            rows={5}
            maxLength={500}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
          <p className="text-xs text-zinc-600 text-left">{content.length}/500</p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isPending || !content.trim() || !selectedAuthor}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium px-4 py-3 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed min-h-[44px]"
        >
          {isPending ? "جاري النشر..." : "نشر المنشور"}
        </button>
      </div>
    </div>
  );
}
