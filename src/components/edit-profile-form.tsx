"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/app/actions/profile";

export default function EditProfileForm({
  profile,
  presetAvatars,
  presetCovers,
  userId,
}: {
  profile: {
    display_name: string;
    bio: string;
    avatar_url: string | null;
    cover_url: string | null;
  };
  presetAvatars: string[];
  presetCovers: string[];
  userId: string;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [bio, setBio] = useState(profile.bio);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [coverUrl, setCoverUrl] = useState(profile.cover_url);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);

  async function uploadFile(
    file: File,
    bucket: string
  ): Promise<string | null> {
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setError("فشل رفع الصورة: " + uploadError.message);
      return null;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(path);
    return publicUrl;
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("حجم الصورة يجب أن لا يتجاوز 5MB");
      return;
    }
    setUploadingAvatar(true);
    setError(null);
    const url = await uploadFile(file, "avatars");
    if (url) setAvatarUrl(url);
    setUploadingAvatar(false);
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("حجم الصورة يجب أن لا يتجاوز 5MB");
      return;
    }
    setUploadingCover(true);
    setError(null);
    const url = await uploadFile(file, "covers");
    if (url) setCoverUrl(url);
    setUploadingCover(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) {
      setError("الاسم مطلوب");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await updateProfile({
        display_name: displayName.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl,
        cover_url: coverUrl,
      });
      setSuccess(true);
      setTimeout(() => {
        router.back();
        router.refresh();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cover image */}
      <div className="space-y-3">
        <label className="block text-sm text-zinc-400 font-medium">
          صورة الغلاف
        </label>
        <div className="relative h-32 rounded-xl overflow-hidden">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt="غلاف"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-600/30 to-zinc-900" />
          )}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => coverFileRef.current?.click()}
              disabled={uploadingCover}
              className="bg-zinc-800/80 hover:bg-zinc-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {uploadingCover ? "جاري الرفع..." : "رفع صورة"}
            </button>
            {coverUrl && (
              <button
                type="button"
                onClick={() => setCoverUrl(null)}
                className="bg-red-600/80 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                إزالة
              </button>
            )}
          </div>
        </div>
        <input
          ref={coverFileRef}
          type="file"
          accept="image/*"
          onChange={handleCoverUpload}
          className="hidden"
        />

        {/* Preset covers */}
        {presetCovers.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-zinc-500">أو اختر من الأغلفة الجاهزة:</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto scrollbar-thin">
              {presetCovers.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setCoverUrl(url)}
                  className={`relative rounded-lg overflow-hidden h-16 transition-all cursor-pointer ${
                    coverUrl === url
                      ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-zinc-950"
                      : "hover:opacity-80"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt="غلاف جاهز"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {coverUrl === url && (
                    <div className="absolute inset-0 bg-emerald-400/20 flex items-center justify-center">
                      <span className="text-emerald-400 text-lg font-bold">&#10003;</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Avatar */}
      <div className="space-y-3">
        <label className="block text-sm text-zinc-400 font-medium">
          الصورة الشخصية
        </label>
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt="صورة شخصية"
              className="w-20 h-20 rounded-full object-cover border-2 border-zinc-800 shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-emerald-600/20 flex items-center justify-center text-emerald-400 font-bold text-2xl border-2 border-zinc-800 shrink-0">
              {displayName?.charAt(0) || "?"}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => avatarFileRef.current?.click()}
              disabled={uploadingAvatar}
              className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-3 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {uploadingAvatar ? "جاري الرفع..." : "رفع صورة"}
            </button>
            {avatarUrl && (
              <button
                type="button"
                onClick={() => setAvatarUrl(null)}
                className="text-red-400 text-xs hover:text-red-300 transition-colors cursor-pointer"
              >
                إزالة الصورة
              </button>
            )}
          </div>
        </div>
        <input
          ref={avatarFileRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarUpload}
          className="hidden"
        />

        {/* Preset avatars */}
        {presetAvatars.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-zinc-500">أو اختر صورة جاهزة:</p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-64 overflow-y-auto scrollbar-thin">
              {presetAvatars.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setAvatarUrl(url)}
                  className={`relative rounded-full overflow-hidden aspect-square transition-all cursor-pointer ${
                    avatarUrl === url
                      ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-zinc-950"
                      : "hover:opacity-80"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt="صورة جاهزة"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {avatarUrl === url && (
                    <div className="absolute inset-0 bg-emerald-400/20 flex items-center justify-center">
                      <span className="text-emerald-400 text-lg font-bold">&#10003;</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Display name */}
      <div className="space-y-1.5">
        <label className="block text-sm text-zinc-400 font-medium">
          الاسم
        </label>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={50}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
          placeholder="اسمك"
        />
      </div>

      {/* Bio */}
      <div className="space-y-1.5">
        <label className="block text-sm text-zinc-400 font-medium">
          النبذة التعريفية
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={160}
          rows={3}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
          placeholder="أخبر الآخرين عنك..."
        />
        <p className="text-zinc-600 text-xs text-left">{bio.length}/160</p>
      </div>

      {/* Error / success */}
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {success && (
        <p className="text-emerald-400 text-sm">تم حفظ التغييرات بنجاح</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={saving || !displayName.trim()}
        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium py-3 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
      >
        {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
      </button>
    </form>
  );
}
