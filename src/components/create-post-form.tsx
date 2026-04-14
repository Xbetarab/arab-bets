"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SPORTS } from "@/lib/supabase/types";
import { createPost } from "@/app/actions/posts";

export default function CreatePostForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [sport, setSport] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("حجم الصورة يجب أن لا يتجاوز 5MB");
      return;
    }

    setImageFile(file);
    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() && !imageFile) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const mediaUrls: string[] = [];

      // Upload image if present
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${userId}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("post-media")
          .upload(path, imageFile);

        if (uploadError) {
          throw new Error("فشل رفع الصورة: " + uploadError.message);
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("post-media").getPublicUrl(path);

        mediaUrls.push(publicUrl);
      }

      // Insert post via server action (checks auto-approve setting)
      await createPost(
        content.trim(),
        sport || null,
        mediaUrls.length > 0 ? mediaUrls : null
      );

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4"
    >
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="شارك رأيك أو توقعاتك..."
        rows={5}
        maxLength={500}
        className="w-full bg-transparent text-white text-sm placeholder:text-zinc-600 resize-none focus:outline-none"
      />

      {/* Sport selector */}
      <div className="space-y-1.5">
        <label className="block text-sm text-zinc-400">نوع الرياضة</label>
        <select
          value={sport}
          onChange={(e) => setSport(e.target.value)}
          className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white text-sm
                     focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500
                     transition-colors appearance-none cursor-pointer"
        >
          <option value="">اختر الرياضة (اختياري)</option>
          {SPORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagePreview}
            alt="Preview"
            className="w-full max-h-64 object-cover rounded-lg"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-2 left-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-black/80 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="text-zinc-500 hover:text-emerald-400 transition-colors cursor-pointer"
          title="إضافة صورة"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
            />
          </svg>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />

        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-600">{content.length}/500</span>
          <button
            type="submit"
            disabled={loading || (!content.trim() && !imageFile)}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500
                       text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? "ينشر..." : "نشر"}
          </button>
        </div>
      </div>
    </form>
  );
}
