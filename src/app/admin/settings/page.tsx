import Link from "next/link";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold text-white">الإعدادات</h1>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
        <p className="text-sm text-zinc-400">
          إعدادات الموافقة التلقائية متوفرة في{" "}
          <Link
            href="/admin/moderation"
            className="text-emerald-400 hover:underline"
          >
            صفحة المراجعة
          </Link>
          .
        </p>
        <p className="text-sm text-zinc-500">
          سيتم إضافة المزيد من الإعدادات قريباً.
        </p>
      </div>
    </div>
  );
}
