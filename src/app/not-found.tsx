import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "الصفحة غير موجودة | عرب تيبس",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main
      dir="rtl"
      className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center"
    >
      <p className="text-sm text-zinc-500">404</p>
      <h1 className="mt-2 text-2xl font-bold text-white">الصفحة غير موجودة</h1>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">
        هذا الرابط لا يطابق صفحة على عرب تيبس.
      </p>
      <Link href="/" className="mt-6 text-emerald-400 underline underline-offset-4">
        العودة إلى مجتمع المراهنين
      </Link>
    </main>
  );
}
