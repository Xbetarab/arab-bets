"use client";

import { logout } from "@/app/auth/actions";
import Link from "next/link";

export default function Navbar({
  username,
  displayName,
}: {
  username: string;
  displayName: string;
}) {
  return (
    <nav
      dir="rtl"
      className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800"
    >
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-emerald-400">
          X9 Bet
        </Link>

        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-400">
            {displayName}{" "}
            <span className="text-zinc-600">@{username}</span>
          </span>
          <form action={logout}>
            <button
              type="submit"
              className="text-xs text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
            >
              خروج
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
