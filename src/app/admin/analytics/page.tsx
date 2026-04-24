"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchAllAnalytics, type AnalyticsData } from "./actions";

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-1">
      <span className="text-zinc-400 text-xs">{label}</span>
      <span className="text-2xl font-bold text-white">{value}</span>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-lg font-bold text-emerald-400 border-b border-zinc-800 pb-2 mb-4">
      {title}
    </h2>
  );
}

function RankTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | number)[][];
}) {
  if (rows.length === 0) {
    return <p className="text-zinc-500 text-sm">لا توجد بيانات</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800">
            {headers.map((h, i) => (
              <th
                key={i}
                className="text-zinc-400 text-xs font-medium py-2 px-3 text-right"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
              {row.map((cell, ci) => (
                <td key={ci} className="py-2 px-3 text-zinc-300 text-right">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAllAnalytics();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-zinc-400 text-sm">جاري تحميل التحليلات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3 bg-red-950/30 border border-red-800 rounded-xl p-6 max-w-sm">
          <p className="text-red-400 font-bold">خطأ</p>
          <p className="text-zinc-400 text-sm">{error}</p>
          <button
            onClick={load}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { users, clicks, content, realVsGhost, engagement } = data;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">التحليلات والإحصائيات</h1>
        <button
          onClick={load}
          disabled={loading}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors min-h-[44px] disabled:opacity-50"
        >
          تحديث
        </button>
      </div>

      {/* 1. User Registration */}
      <section>
        <SectionHeader title="المستخدمون الحقيقيون" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="تسجيلات اليوم" value={users.today} />
          <StatCard label="تسجيلات هذا الأسبوع" value={users.week} />
          <StatCard label="تسجيلات هذا الشهر" value={users.month} />
          <StatCard label="تسجيلات الشهر الماضي" value={users.last_month} />
          <StatCard label="تسجيلات هذه السنة" value={users.year} />
          <StatCard label="إجمالي المستخدمين" value={users.all_time} />
        </div>
      </section>

      {/* 2. Link Clicks */}
      <section>
        <SectionHeader title="النقرات" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="نقرات اليوم" value={clicks.today} />
          <StatCard label="نقرات هذا الأسبوع" value={clicks.week} />
          <StatCard label="نقرات هذا الشهر" value={clicks.month} />
          <StatCard label="نقرات الشهر الماضي" value={clicks.last_month} />
          <StatCard label="نقرات هذه السنة" value={clicks.year} />
          <StatCard label="إجمالي النقرات" value={clicks.all_time} />
        </div>
      </section>

      {/* 3. Content Analytics */}
      <section>
        <SectionHeader title="المحتوى" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard label="إجمالي المنشورات" value={content.total_posts} />
          <StatCard label="منشورات اليوم" value={content.posts_today} />
          <StatCard label="منشورات هذا الأسبوع" value={content.posts_week} />
          <StatCard label="منشورات هذا الشهر" value={content.posts_month} />
          <StatCard label="إجمالي التعليقات" value={content.total_comments} />
          <StatCard label="تعليقات اليوم" value={content.comments_today} />
          <StatCard label="تعليقات هذا الأسبوع" value={content.comments_week} />
          <StatCard label="تعليقات هذا الشهر" value={content.comments_month} />
          <StatCard label="إجمالي الإعجابات" value={content.total_likes} />
          <StatCard label="إعجابات التعليقات" value={content.total_comment_likes} />
        </div>
      </section>

      {/* 4. Real vs Ghost */}
      <section>
        <SectionHeader title="حقيقي مقابل شبحي" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="منشورات حقيقية" value={realVsGhost.real_posts} />
          <StatCard label="منشورات شبحية" value={realVsGhost.ghost_posts} />
          <StatCard label="تعليقات حقيقية" value={realVsGhost.real_comments} />
          <StatCard label="تعليقات شبحية" value={realVsGhost.ghost_comments} />
        </div>
      </section>

      {/* 5. Engagement */}
      <section>
        <SectionHeader title="التفاعل" />
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard label="متوسط الإعجابات لكل منشور" value={engagement.avg_likes_per_post} />
          <StatCard label="متوسط التعليقات لكل منشور" value={engagement.avg_comments_per_post} />
        </div>

        {/* Most liked posts */}
        <h3 className="text-sm font-bold text-zinc-300 mb-3">أكثر المنشورات إعجاباً</h3>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
          <RankTable
            headers={["#", "المحتوى", "الكاتب", "الإعجابات"]}
            rows={engagement.most_liked_posts.map((p, i) => [
              i + 1,
              p.content.length > 60 ? p.content.slice(0, 60) + "..." : p.content,
              p.author,
              p.likes_count,
            ])}
          />
        </div>

        {/* Most commented posts */}
        <h3 className="text-sm font-bold text-zinc-300 mb-3">أكثر المنشورات تعليقاً</h3>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
          <RankTable
            headers={["#", "المحتوى", "الكاتب", "التعليقات"]}
            rows={engagement.most_commented_posts.map((p, i) => [
              i + 1,
              p.content.length > 60 ? p.content.slice(0, 60) + "..." : p.content,
              p.author,
              p.comments_count,
            ])}
          />
        </div>

        {/* Most active real users */}
        <h3 className="text-sm font-bold text-zinc-300 mb-3">أكثر المستخدمين الحقيقيين نشاطاً</h3>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
          <RankTable
            headers={["#", "الاسم", "المعرف", "المنشورات", "التعليقات"]}
            rows={engagement.most_active_real_users.map((u, i) => [
              i + 1,
              u.display_name,
              u.username,
              u.posts_count,
              u.comments_count,
            ])}
          />
        </div>

        {/* Most active ghost accounts */}
        <h3 className="text-sm font-bold text-zinc-300 mb-3">نشاط الحسابات الشبحية</h3>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <RankTable
            headers={["#", "الاسم", "المعرف", "المنشورات", "التعليقات"]}
            rows={engagement.most_active_ghost_accounts.map((u, i) => [
              i + 1,
              u.display_name,
              u.username,
              u.posts_count,
              u.comments_count,
            ])}
          />
        </div>
      </section>
    </div>
  );
}
