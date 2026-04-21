"use client";

import { useState } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      dir="rtl"
      className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800"
    >
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-emerald-400 shrink-0">
          arabtips
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <Link
                href="/create"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                + نشر
              </Link>

              <Link href={`/profile/${username}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
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
                <span className="text-sm text-zinc-400">
                  {displayName}{" "}
                  <span className="text-zinc-600">@{username}</span>
                </span>
              </Link>

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

        {/* Mobile: action button + hamburger */}
        <div className="flex sm:hidden items-center gap-2">
          {isLoggedIn && (
            <Link
              href="/create"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              + نشر
            </Link>
          )}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
            aria-label="القائمة"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-md px-4 py-3 space-y-3">
          {isLoggedIn ? (
            <>
              <Link href={`/profile/${username}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 pb-3 border-b border-zinc-800 hover:opacity-80 transition-opacity">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={displayName || ""}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-600/20 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">
                    {displayName?.charAt(0) || "?"}
                  </div>
                )}
                <div>
                  <p className="text-white text-sm font-medium">{displayName}</p>
                  <p className="text-zinc-500 text-xs">@{username}</p>
                </div>
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="w-full text-right text-sm text-red-400 hover:text-red-300 transition-colors cursor-pointer min-h-[44px] flex items-center"
                >
                  خروج
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                href="/auth/login"
                onClick={() => setMenuOpen(false)}
                className="text-sm text-zinc-400 hover:text-white transition-colors min-h-[44px] flex items-center"
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/auth/signup"
                onClick={() => setMenuOpen(false)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors text-center"
              >
                إنشاء حساب
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
