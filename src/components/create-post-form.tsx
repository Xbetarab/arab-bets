"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SPORTS } from "@/lib/supabase/types";
import { createPost } from "@/app/actions/posts";

const PREDICTION_TYPES = [
  "نتيجة المباراة",
  "عدد الأهداف",
  "كلا الفريقين يسجل",
  "أول من يسجل",
  "هاندي كاب",
  "أخرى",
];

export default function CreatePostForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [sport, setSport] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Tip mode
  const [isTip, setIsTip] = useState(false);
  const [matchHome, setMatchHome] = useState("");
  const [matchAway, setMatchAway] = useState("");
  const [league, setLeague] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [prediction, setPrediction] = useState("");
  const [predictionType, setPredictionType] = useState(PREDICTION_TYPES[0]);
  const [odds, setOdds] = useState("");
  const [confidence, setConfidence] = useState(3);

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

    // Validate tip fields
    if (isTip) {
      if (!matchHome.trim() || !matchAway.trim()) {
        setError("يجب إدخال اسم الفريقين");
        return;
      }
      if (!prediction.trim()) {
        setError("يجب إدخال التوقع");
        return;
      }
      if (!odds || parseFloat(odds) <= 0) {
        setError("يجب إدخال أوديز صالحة");
        return;
      }
    } else if (!content.trim() && !imageFile) {
      return;
    }

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

      const tipData = isTip
        ? {
            match_home: matchHome.trim(),
            match_away: matchAway.trim(),
            league: league.trim() || "غير محدد",
            match_date: matchDate || new Date().toISOString(),
            prediction: prediction.trim(),
            prediction_type: predictionType,
            odds: parseFloat(odds),
            confidence,
          }
        : null;

      // Insert post via server action (checks auto-approve setting)
      await createPost(
        content.trim(),
        sport || null,
        mediaUrls.length > 0 ? mediaUrls : null,
        tipData
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
      {/* Post type toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsTip(false)}
          className={`text-sm px-4 py-2 rounded-lg transition-colors cursor-pointer ${
            !isTip
              ? "bg-emerald-600 text-white"
              : "bg-zinc-800 text-zinc-400 hover:text-white"
          }`}
        >
          منشور عادي
        </button>
        <button
          type="button"
          onClick={() => setIsTip(true)}
          className={`text-sm px-4 py-2 rounded-lg transition-colors cursor-pointer ${
            isTip
              ? "bg-emerald-600 text-white"
              : "bg-zinc-800 text-zinc-400 hover:text-white"
          }`}
        >
          ⚽ توقع رياضي
        </button>
      </div>

      {/* Tip fields */}
      {isTip && (
        <div className="space-y-3 bg-zinc-800/30 rounded-lg p-3 border border-zinc-800">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">الفريق المضيف</label>
              <input
                value={matchHome}
                onChange={(e) => setMatchHome(e.target.value)}
                placeholder="مثال: ريال مدريد"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">الفريق الضيف</label>
              <input
                value={matchAway}
                onChange={(e) => setMatchAway(e.target.value)}
                placeholder="مثال: برشلونة"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">الدوري</label>
              <input
                value={league}
                onChange={(e) => setLeague(e.target.value)}
                placeholder="مثال: الدوري الإسباني"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">تاريخ المباراة</label>
              <input
                type="datetime-local"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">نوع التوقع</label>
            <select
              value={predictionType}
              onChange={(e) => setPredictionType(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none cursor-pointer"
            >
              {PREDICTION_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">التوقع</label>
            <input
              value={prediction}
              onChange={(e) => setPrediction(e.target.value)}
              placeholder="مثال: فوز ريال مدريد"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">الأوديز</label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={odds}
                onChange={(e) => setOdds(e.target.value)}
                placeholder="1.50"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">مستوى الثقة</label>
              <div className="flex items-center gap-1 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setConfidence(star)}
                    className={`text-xl cursor-pointer transition-colors ${
                      star <= confidence ? "text-yellow-400" : "text-zinc-700"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={isTip ? "أضف تحليلك (اختياري)..." : "شارك رأيك أو توقعاتك..."}
        rows={isTip ? 3 : 5}
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
            disabled={
              loading ||
              (isTip
                ? !matchHome.trim() || !matchAway.trim() || !prediction.trim()
                : !content.trim() && !imageFile)
            }
            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500
                       text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? "ينشر..." : isTip ? "نشر التوقع" : "نشر"}
          </button>
        </div>
      </div>
    </form>
  );
}
