"use client";

import { logout } from "@/app/auth/actions";
import Link from "next/link";

export default function Navbar({
  username,
  displayName,
  avatarUrl,
  isLoggedIn,
}: {
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  isLoggedIn: boolean;
}) {
  return (
    <nav
      dir="rtl"
      className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800"
    >
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-emerald-400">
          arabtips
        </Link>

        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <Link
                href="/create"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                + نشر
              </Link>

              <div className="flex items-center gap-2">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={displayName || ""}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-600/20 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                    {displayName?.charAt(0) || "?"}
                  </div>
                )}
                <span className="text-sm text-zinc-400 hidden sm:inline">
                  {displayName}{" "}
                  <span className="text-zinc-600">@{username}</span>
                </span>
              </div>

              <form action={logout}>
                <button
                  type="submit"
                  className="text-xs text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                >
                  خروج
                </button>
              </form>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/auth/signup"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                إنشاء حساب
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
