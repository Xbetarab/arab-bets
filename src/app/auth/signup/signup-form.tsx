"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { signUp, checkUsername, type SignUpState } from "../actions";
import { useDebounce } from "@/hooks/use-debounce";

export default function SignUpForm() {
  const [state, formAction] = useActionState<SignUpState, FormData>(signUp, {});

  // ---- Live username check ----
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<{
    checking: boolean;
    available?: boolean;
    error?: string;
  }>({ checking: false });

  const debouncedUsername = useDebounce(username, 500);
  const [, startTransition] = useTransition();
  useEffect(() => {
    if (!debouncedUsername || debouncedUsername.length < 3) {
      setUsernameStatus({ checking: false });
      return;
    }

    let cancelled = false;
    setUsernameStatus({ checking: true });

    startTransition(async () => {
      const result = await checkUsername(debouncedUsername);
      if (!cancelled) {
        setUsernameStatus({
          checking: false,
          available: result.available,
          error: result.error,
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [debouncedUsername, startTransition]);

  // ---- UI ----
  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center bg-zinc-950 px-4"
    >
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            إنشاء حساب جديد
          </h1>
          <p className="text-zinc-400 text-sm">
            انضم لمجتمع المراهنين العرب
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
          {/* Username */}
          <div className="space-y-1.5">
            <label htmlFor="username" className="block text-sm text-zinc-300">
              اسم المستخدم
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
                @
              </span>
              <input
                id="username"
                name="username"
                type="text"
                dir="ltr"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="username"
                autoComplete="username"
                className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 pl-8 py-2.5 text-white text-sm
                           placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500
                           transition-colors"
              />
              {/* Status indicator */}
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameStatus.checking && (
                  <span className="block h-4 w-4 rounded-full border-2 border-zinc-500 border-t-transparent animate-spin" />
                )}
                {!usernameStatus.checking && usernameStatus.available && (
                  <span className="text-emerald-400 text-lg">&#10003;</span>
                )}
                {!usernameStatus.checking &&
                  usernameStatus.available === false &&
                  username.length >= 3 && (
                    <span className="text-red-400 text-lg">&#10007;</span>
                  )}
              </span>
            </div>
            <FieldError
              error={
                state.fieldErrors?.username ?? usernameStatus.error
              }
            />
          </div>

          {/* Display Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="display_name"
              className="block text-sm text-zinc-300"
            >
              الاسم المعروض
            </label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              placeholder="مثال: أبو فهد"
              className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-white text-sm
                         placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500
                         transition-colors"
            />
            <FieldError error={state.fieldErrors?.display_name} />
          </div>

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
              autoComplete="new-password"
              className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-white text-sm
                         placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500
                         transition-colors"
            />
            <FieldError error={state.fieldErrors?.password} />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={usernameStatus.checking || usernameStatus.available === false}
            className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500
                       text-white font-medium py-2.5 text-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            إنشاء الحساب
          </button>
        </form>

        <p className="text-center text-zinc-500 text-sm">
          عندك حساب؟{" "}
          <a href="/auth/login" className="text-emerald-400 hover:underline">
            سجل دخول
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
