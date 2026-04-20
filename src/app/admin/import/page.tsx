"use client";

import { useState, useTransition, useRef } from "react";
import {
  importPostsWithComments,
  importCommentsOnly,
  type ImportResult,
} from "./actions";

function ResultCard({ result }: { result: ImportResult }) {
  return (
    <div className="space-y-3">
      <div
        className={`text-sm px-4 py-3 rounded-lg border ${
          result.errors.length === 0
            ? "bg-emerald-600/10 text-emerald-400 border-emerald-600/20"
            : result.postsCreated > 0 || result.commentsCreated > 0
              ? "bg-yellow-600/10 text-yellow-400 border-yellow-600/20"
              : "bg-red-600/10 text-red-400 border-red-600/20"
        }`}
      >
        <div className="font-medium mb-2">
          {result.errors.length === 0
            ? "تم الاستيراد بنجاح!"
            : "تم الاستيراد مع بعض الأخطاء"}
        </div>
        <div className="space-y-1 text-xs">
          {result.postsCreated > 0 && (
            <div>
              منشورات: <span className="font-bold">{result.postsCreated}</span>
            </div>
          )}
          <div>
            تعليقات: <span className="font-bold">{result.commentsCreated}</span>
          </div>
          {result.profilesCreated > 0 && (
            <div>
              حسابات شبحية جديدة:{" "}
              <span className="font-bold">{result.profilesCreated}</span>
            </div>
          )}
        </div>
      </div>
      {result.errors.length > 0 && (
        <div className="bg-red-600/5 border border-red-600/20 rounded-lg p-3 space-y-1 max-h-48 overflow-y-auto">
          <div className="text-xs font-medium text-red-400 mb-1">
            أخطاء ({result.errors.length}):
          </div>
          {result.errors.map((err, i) => (
            <div key={i} className="text-xs text-red-300/80">
              • {err}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ImportPage() {
  const [isPending, startTransition] = useTransition();

  // Posts import
  const [postsFile, setPostsFile] = useState<File | null>(null);
  const [postsPreview, setPostsPreview] = useState<{
    postCount: number;
    commentCount: number;
    usernames: string[];
  } | null>(null);
  const [postsResult, setPostsResult] = useState<ImportResult | null>(null);
  const postsInputRef = useRef<HTMLInputElement>(null);

  // Comments import
  const [commentsFile, setCommentsFile] = useState<File | null>(null);
  const [commentsPreview, setCommentsPreview] = useState<{
    postCount: number;
    commentCount: number;
    usernames: string[];
  } | null>(null);
  const [commentsResult, setCommentsResult] = useState<ImportResult | null>(
    null
  );
  const commentsInputRef = useRef<HTMLInputElement>(null);

  // Progress
  const [progress, setProgress] = useState("");

  // ── Posts file handler ────────────────────────────────────────────
  async function handlePostsFileChange(file: File | null) {
    setPostsFile(file);
    setPostsPreview(null);
    setPostsResult(null);
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.posts || !Array.isArray(data.posts)) {
        setPostsPreview(null);
        return;
      }
      let commentCount = 0;
      const usernames = new Set<string>();
      for (const post of data.posts) {
        if (post.author_username) usernames.add(post.author_username);
        if (post.comments) {
          for (const c of post.comments) {
            commentCount++;
            if (c.author_username) usernames.add(c.author_username);
            if (c.replies) {
              commentCount += c.replies.length;
              for (const r of c.replies) {
                if (r.author_username) usernames.add(r.author_username);
              }
            }
          }
        }
      }
      setPostsPreview({
        postCount: data.posts.length,
        commentCount,
        usernames: Array.from(usernames),
      });
    } catch {
      setPostsPreview(null);
    }
  }

  function handlePostsImport() {
    if (!postsFile) return;
    setPostsResult(null);
    setProgress("جاري قراءة الملف...");
    startTransition(async () => {
      try {
        const text = await postsFile.text();
        setProgress("جاري استيراد المنشورات والتعليقات...");
        const result = await importPostsWithComments(text);
        setPostsResult(result);
        setProgress("");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setPostsResult({
          success: false,
          postsCreated: 0,
          commentsCreated: 0,
          profilesCreated: 0,
          errors: [msg],
        });
        setProgress("");
      }
    });
  }

  // ── Comments file handler ─────────────────────────────────────────
  async function handleCommentsFileChange(file: File | null) {
    setCommentsFile(file);
    setCommentsPreview(null);
    setCommentsResult(null);
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.comments || !Array.isArray(data.comments)) {
        setCommentsPreview(null);
        return;
      }
      let commentCount = 0;
      const usernames = new Set<string>();
      const postCount = data.comments.length;
      for (const entry of data.comments) {
        if (entry.entries) {
          for (const c of entry.entries) {
            commentCount++;
            if (c.author_username) usernames.add(c.author_username);
            if (c.replies) {
              commentCount += c.replies.length;
              for (const r of c.replies) {
                if (r.author_username) usernames.add(r.author_username);
              }
            }
          }
        }
      }
      setCommentsPreview({
        postCount,
        commentCount,
        usernames: Array.from(usernames),
      });
    } catch {
      setCommentsPreview(null);
    }
  }

  function handleCommentsImport() {
    if (!commentsFile) return;
    setCommentsResult(null);
    setProgress("جاري قراءة الملف...");
    startTransition(async () => {
      try {
        const text = await commentsFile.text();
        setProgress("جاري استيراد التعليقات...");
        const result = await importCommentsOnly(text);
        setCommentsResult(result);
        setProgress("");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setCommentsResult({
          success: false,
          postsCreated: 0,
          commentsCreated: 0,
          profilesCreated: 0,
          errors: [msg],
        });
        setProgress("");
      }
    });
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-xl font-bold text-white">استيراد المحتوى</h1>

      {/* Progress indicator */}
      {isPending && progress && (
        <div className="bg-blue-600/10 text-blue-400 border border-blue-600/20 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          {progress}
        </div>
      )}

      {/* Section 1: Import Posts + Comments */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
        <div>
          <h2 className="text-sm font-medium text-zinc-300">
            استيراد منشورات مع تعليقات
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            ارفع ملف JSON يحتوي على منشورات كاملة مع تعليقات وردود وإعجابات
          </p>
        </div>

        <div className="space-y-3">
          <input
            ref={postsInputRef}
            type="file"
            accept=".json,application/json"
            onChange={(e) => handlePostsFileChange(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => postsInputRef.current?.click()}
            className="w-full border-2 border-dashed border-zinc-700 hover:border-emerald-500/50 rounded-lg px-4 py-6 text-center transition-colors cursor-pointer min-h-[44px]"
          >
            {postsFile ? (
              <div className="space-y-1">
                <div className="text-sm text-emerald-400">{postsFile.name}</div>
                <div className="text-xs text-zinc-500">
                  {(postsFile.size / 1024).toFixed(1)} KB — اضغط لتغيير الملف
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-sm text-zinc-400">اضغط لاختيار ملف JSON</div>
                <div className="text-xs text-zinc-600">
                  صيغة: {"{"}&quot;posts&quot;: [...]&#125;
                </div>
              </div>
            )}
          </button>

          {/* Preview */}
          {postsPreview && (
            <div className="bg-zinc-800/50 rounded-lg p-3 space-y-1">
              <div className="text-xs font-medium text-zinc-400">
                معاينة الملف:
              </div>
              <div className="text-xs text-zinc-300">
                📝 {postsPreview.postCount} منشور
              </div>
              <div className="text-xs text-zinc-300">
                💬 {postsPreview.commentCount} تعليق ورد
              </div>
              <div className="text-xs text-zinc-300">
                👤 {postsPreview.usernames.length} حساب مختلف
              </div>
            </div>
          )}

          <button
            onClick={handlePostsImport}
            disabled={isPending || !postsFile}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium px-4 py-3 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed min-h-[44px]"
          >
            {isPending ? "جاري الاستيراد..." : "استيراد المنشورات"}
          </button>

          {postsResult && <ResultCard result={postsResult} />}
        </div>
      </div>

      {/* Section 2: Import Comments Only */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
        <div>
          <h2 className="text-sm font-medium text-zinc-300">
            استيراد تعليقات فقط
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            ارفع ملف JSON يحتوي على تعليقات لمنشورات موجودة
          </p>
        </div>

        <div className="space-y-3">
          <input
            ref={commentsInputRef}
            type="file"
            accept=".json,application/json"
            onChange={(e) =>
              handleCommentsFileChange(e.target.files?.[0] ?? null)
            }
            className="hidden"
          />
          <button
            type="button"
            onClick={() => commentsInputRef.current?.click()}
            className="w-full border-2 border-dashed border-zinc-700 hover:border-emerald-500/50 rounded-lg px-4 py-6 text-center transition-colors cursor-pointer min-h-[44px]"
          >
            {commentsFile ? (
              <div className="space-y-1">
                <div className="text-sm text-emerald-400">
                  {commentsFile.name}
                </div>
                <div className="text-xs text-zinc-500">
                  {(commentsFile.size / 1024).toFixed(1)} KB — اضغط لتغيير
                  الملف
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-sm text-zinc-400">اضغط لاختيار ملف JSON</div>
                <div className="text-xs text-zinc-600">
                  صيغة: {"{"}&quot;comments&quot;: [...]&#125;
                </div>
              </div>
            )}
          </button>

          {/* Preview */}
          {commentsPreview && (
            <div className="bg-zinc-800/50 rounded-lg p-3 space-y-1">
              <div className="text-xs font-medium text-zinc-400">
                معاينة الملف:
              </div>
              <div className="text-xs text-zinc-300">
                📌 {commentsPreview.postCount} منشور مستهدف
              </div>
              <div className="text-xs text-zinc-300">
                💬 {commentsPreview.commentCount} تعليق ورد
              </div>
              <div className="text-xs text-zinc-300">
                👤 {commentsPreview.usernames.length} حساب مختلف
              </div>
            </div>
          )}

          <button
            onClick={handleCommentsImport}
            disabled={isPending || !commentsFile}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium px-4 py-3 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed min-h-[44px]"
          >
            {isPending ? "جاري الاستيراد..." : "استيراد التعليقات"}
          </button>

          {commentsResult && <ResultCard result={commentsResult} />}
        </div>
      </div>

      {/* JSON Spec Reference */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-medium text-zinc-300">
          مواصفات ملف JSON
        </h2>

        <div className="space-y-2">
          <div className="text-xs text-zinc-400 font-medium">
            صيغة المنشورات + التعليقات:
          </div>
          <pre
            dir="ltr"
            className="bg-zinc-800 rounded-lg p-3 text-xs text-zinc-300 overflow-x-auto"
          >
            {`{
  "posts": [
    {
      "author_username": "username",
      "content": "محتوى المنشور...",
      "sport": "كرة قدم",
      "created_at": "2026-04-10T14:30:00Z",
      "likes_count": 347,
      "comments": [
        {
          "author_username": "commenter",
          "content": "تعليق...",
          "created_at": "2026-04-10T15:10:00Z",
          "likes_count": 23,
          "replies": [
            {
              "author_username": "replier",
              "content": "رد...",
              "created_at": "2026-04-10T15:25:00Z",
              "likes_count": 8
            }
          ]
        }
      ]
    }
  ]
}`}
          </pre>

          <div className="text-xs text-zinc-400 font-medium mt-3">
            صيغة التعليقات فقط:
          </div>
          <pre
            dir="ltr"
            className="bg-zinc-800 rounded-lg p-3 text-xs text-zinc-300 overflow-x-auto"
          >
            {`{
  "comments": [
    {
      "post_id": "uuid-of-existing-post",
      "entries": [
        {
          "author_username": "commenter",
          "content": "تعليق...",
          "created_at": "2026-04-10T16:00:00Z",
          "likes_count": 12,
          "replies": [...]
        }
      ]
    }
  ]
}`}
          </pre>
        </div>

        <div className="text-xs text-zinc-500 space-y-1">
          <div>
            • <code className="text-zinc-400">author_username</code>: يجب أن
            يطابق حساب شبحي موجود، وإلا سيتم إنشاء حساب جديد تلقائياً
          </div>
          <div>
            • <code className="text-zinc-400">sport</code>: اختياري — كرة قدم،
            سلة، تنس، ملاكمة، MMA، أخرى
          </div>
          <div>
            • <code className="text-zinc-400">likes_count</code>: اختياري — يتم
            تعيين العدد مباشرة (بدون سجلات إعجاب فعلية)
          </div>
          <div>
            • <code className="text-zinc-400">created_at</code>: بتوقيت UTC
            بصيغة ISO 8601
          </div>
          <div>• جميع المحتوى المستورد يكون معتمد تلقائياً (is_approved = true)</div>
        </div>
      </div>
    </div>
  );
}
