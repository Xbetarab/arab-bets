import Link from "next/link";

export default function PostNotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div dir="rtl" className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-white">المنشور غير موجود</h1>
        <p className="text-zinc-500 text-sm">
          قد يكون المنشور محذوفاً أو الرابط غير صحيح
        </p>
        <Link
          href="/"
          className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-6 py-3 rounded-lg transition-colors"
        >
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
