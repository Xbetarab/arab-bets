export const metadata = {
  title: "تأكيد البريد الإلكتروني | مجتمع المراهنين العرب",
};

export default function VerifyEmailPage() {
  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center bg-zinc-950 px-4"
    >
      <div className="w-full max-w-md text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white">تفقد بريدك الإلكتروني</h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          أرسلنا لك رابط تأكيد على بريدك الإلكتروني.
          <br />
          اضغط على الرابط لتفعيل حسابك.
        </p>
        <a
          href="/auth/login"
          className="inline-block text-emerald-400 hover:underline text-sm"
        >
          العودة لصفحة الدخول
        </a>
      </div>
    </div>
  );
}
