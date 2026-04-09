import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== "uomankotd@gmail.com") {
    redirect("/");
  }

  return (
    <div dir="rtl" className="min-h-screen bg-zinc-950 flex">
      {/* Sidebar */}
      <aside className="w-56 border-l border-zinc-800 bg-zinc-950 p-4 space-y-2 shrink-0">
        <Link
          href="/admin"
          className="block text-lg font-bold text-emerald-400 mb-6"
        >
          لوحة التحكم
        </Link>
        <Link
          href="/admin/moderation"
          className="block px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          قائمة المراجعة
        </Link>
        <Link
          href="/admin/ghost"
          className="block px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          التعليقات الشبحية
        </Link>
        <Link
          href="/admin/settings"
          className="block px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          الإعدادات
        </Link>
        <div className="pt-4 border-t border-zinc-800">
          <Link
            href="/"
            className="block px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            ← العودة للموقع
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
