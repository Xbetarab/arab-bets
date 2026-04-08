"use client";

import { useActionState } from "react";
import { login, type LoginState } from "../actions";

export default function LoginForm() {
  const [state, formAction] = useActionState<LoginState, FormData>(login, {});

  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center bg-zinc-950 px-4"
    >
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            تسجيل الدخول
          </h1>
          <p className="text-zinc-400 text-sm">
            أهلاً بك مرة ثانية
          </p>
        </div>

        {/* Global error */}
        {state.error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">
            {state.error}
          </div>
        )}

        {/* Form */}
        <form action={formAction} className="space-y-5">
          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm text-zinc-300">
              البريد الإلكتروني
            </label>
            <input
              id="email"
              name="email"
              type="email"
              dir="ltr"
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-white text-sm
                         placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500
                         transition-colors"
            />
            <FieldError error={state.fieldErrors?.email} />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm text-zinc-300">
              كلمة المرور
            </label>
            <input
              id="password"
              name="password"
              type="password"
              dir="ltr"
              placeholder="--------"
              autoComplete="current-password"
              className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-white text-sm
                         placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500
                         transition-colors"
            />
            <FieldError error={state.fieldErrors?.password} />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 text-sm transition-colors cursor-pointer"
          >
            تسجيل الدخول
          </button>
        </form>

        <p className="text-center text-zinc-500 text-sm">
          ما عندك حساب؟{" "}
          <a href="/auth/signup" className="text-emerald-400 hover:underline">
            سجل الآن
          </a>
        </p>
      </div>
    </div>
  );
}

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="text-red-400 text-xs mt-1">{error}</p>;
}
