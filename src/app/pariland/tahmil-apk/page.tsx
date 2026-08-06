'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Changa, IBM_Plex_Sans_Arabic } from 'next/font/google';

const display = IBM_Plex_Sans_Arabic({ subsets: ['arabic'], weight: ['500', '600', '700'], variable: '--font-display' });
const body = Changa({ subsets: ['arabic'], weight: ['400', '500', '600'], variable: '--font-body' });

const AFF_LINK = '/go/pariland';
const PROMO_CODE = 'X9GO';
const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const tokens = `
  :root {
    --bg: oklch(18% 0.02 155); --bg-deep: oklch(14% 0.018 155);
    --surface: oklch(23% 0.03 155); --raised: oklch(31% 0.05 152);
    --ink: oklch(97% 0.01 150); --muted: oklch(80% 0.025 150);
    --faint: oklch(80% 0.025 150 / 0.55); --neon: oklch(83% 0.22 145);
    --neon-bright: oklch(90% 0.24 143); --neon-dim: oklch(70% 0.17 147);
    --amber: oklch(80% 0.14 78); --line: oklch(97% 0.01 150 / 0.1);
  }
  .focus-ring:focus-visible { outline: 2px solid var(--neon-bright); outline-offset: 3px; border-radius: 12px; }
`;

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div initial={reduce ? false : { opacity: 0, y: 16, scale: 0.97 }} whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.28, delay, ease: EASE }} className={className}>
      {children}
    </motion.div>
  );
}

function BrandLogo({ className = '' }: { className?: string }) {
  return (
    <span dir="ltr" aria-label="Pariland" role="img" className={`relative inline-flex select-none items-baseline leading-none ${className}`}>
      <span className="font-[var(--font-display)] text-2xl font-bold italic tracking-[-0.03em] text-[var(--ink)]">Pari</span>
      <span className="font-[var(--font-display)] text-2xl font-bold italic tracking-[-0.03em] text-[var(--neon)]">land</span>
      <span aria-hidden className="absolute -bottom-1.5 left-[2px] h-[3px] w-8 -skew-x-[18deg] rounded-full bg-[var(--neon)] shadow-[0_0_12px_var(--neon)]" />
    </span>
  );
}

function CTA({ children, big = false }: { children: React.ReactNode; big?: boolean }) {
  return (
    <motion.a href={AFF_LINK} target="_blank" rel="sponsored nofollow noopener" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      className={`focus-ring inline-flex items-center justify-center gap-2.5 rounded-2xl bg-[var(--neon)] font-bold text-[var(--bg-deep)]
        shadow-[0_1px_2px_oklch(0%_0_0/0.3),0_8px_28px_oklch(83%_0.22_145/0.45)] transition-shadow duration-200
        hover:bg-[var(--neon-bright)] hover:shadow-[0_10px_44px_oklch(90%_0.24_143/0.65)]
        ${big ? 'min-h-[64px] px-10 py-5 text-2xl' : 'min-h-[48px] px-6 py-3 text-base'}`}>
      {children}
    </motion.a>
  );
}

function Header() {
  return (
    <header className="flex items-center justify-between py-6">
      <BrandLogo />
      <a href="/pariland" className="focus-ring inline-flex min-h-[44px] items-center rounded-lg px-4 py-2 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--ink)]">← المراجعة الكاملة</a>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--bg-deep)] px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 text-center">
        <BrandLogo className="scale-90 opacity-70" />
        <p className="max-w-3xl text-sm leading-[1.6] text-[var(--faint)]">
          ⚠️ إخلاء مسؤولية: موقع معلوماتي مستقل لأغراض المراجعة، لا يمثل Pariland رسمياً. المراهنات لمن هم 18 عاماً فأكثر وتنطوي على مخاطر مالية — راهن بمسؤولية ولا تراهن بأموال لا تتحمل خسارتها.
        </p>
        <a href="/about" className="inline-flex min-h-[44px] items-center text-xs text-[var(--faint)] underline underline-offset-4 hover:text-[var(--muted)]">من نحن وسياسة الإفصاح</a>
      </div>
    </footer>
  );
}

/* ═══════════════════════ 2. TAHMIL-APK — بطاقة تطبيق + جدول ═══════════════════════ */

export default function Page() {
  const reduce = useReducedMotion();
  const specs = [['نظام التشغيل', 'أندرويد 5.0 فأعلى'], ['الحجم التقريبي', '~56 ميغابايت'], ['اللغة', 'العربية مدعومة'], ['التحديثات', 'تلقائية داخل التطبيق']];
  return (
    <main dir="rtl" lang="ar" className={`${display.variable} ${body.variable} min-h-screen bg-[var(--bg)] font-[var(--font-body)] text-[var(--ink)] antialiased`}>
      <style dangerouslySetInnerHTML={{ __html: tokens }} />
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0"><div className="absolute -top-40 left-[-8%] h-[440px] w-[600px] rounded-full bg-[oklch(83%_0.22_145/0.1)] blur-[120px]" /></div>
        <div className="relative mx-auto max-w-6xl px-6">
          <Header />
          <div className="grid items-center gap-12 pb-16 pt-8 md:grid-cols-[1fr_1fr] md:pb-20 md:pt-12">
            <div>
              <motion.h1 initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, delay: 0.08, ease: EASE }}
                className="font-[var(--font-display)] text-[clamp(2.2rem,6vw,3.5rem)] font-bold leading-[1.1] tracking-[-0.03em]">
                تطبيق Pariland<br /><span className="text-[var(--neon-bright)]">للأندرويد APK</span>
              </motion.h1>
              <motion.p initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15, ease: EASE }}
                className="mt-5 max-w-lg text-lg leading-[1.6] text-[var(--muted)]">حمّل التطبيق الرسمي للأندرويد وراهن من هاتفك بسهولة. لا تنسَ الرمز <strong className="text-[var(--neon-bright)]">{PROMO_CODE}</strong> عند التسجيل.</motion.p>
              <motion.div initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.22, ease: EASE }} className="mt-8"><CTA big>حمّل التطبيق ←</CTA></motion.div>
            </div>
            {/* بطاقة تطبيق — العنصر المميز */}
            <Reveal delay={0.2}>
              <div className="mx-auto w-full max-w-sm rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-6">
                <div className="flex items-center gap-4">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--neon)] font-[var(--font-display)] text-2xl font-bold italic text-[var(--bg-deep)] shadow-[0_0_20px_oklch(83%_0.22_145/0.4)]">P</div>
                  <div><p className="font-bold text-[var(--ink)]">Pariland</p><p className="text-sm text-[var(--faint)]">مراهنات رياضية وكازينو</p></div>
                </div>
                <div className="mt-6 divide-y divide-[var(--line)]">
                  {specs.map(([k, v]) => (<div key={k} className="flex items-center justify-between py-3"><span className="text-sm text-[var(--faint)]">{k}</span><span className="text-sm font-medium text-[var(--ink)]">{v}</span></div>))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line)] bg-[var(--bg-deep)]/40">
        <div className="mx-auto max-w-3xl px-6 py-14 md:py-20">
          <Reveal><h2 className="font-[var(--font-display)] text-2xl font-bold tracking-[-0.02em] md:text-3xl">خطوات التثبيت</h2></Reveal>
          <div className="mt-8 space-y-4">
            {['فعّل "مصادر غير معروفة" من إعدادات هاتفك (الأمان)', 'اضغط زر التحميل أعلاه وانتظر اكتمال تنزيل ملف APK', 'افتح الملف واضغط "تثبيت"، ثم افتح التطبيق', `سجّل بالرمز الترويجي ${PROMO_CODE} وابدأ`].map((s, i) => (
              <Reveal key={i} delay={i * 0.06}><div className="flex gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--raised)] text-sm font-bold text-[var(--ink)]">{i + 1}</span>
                <span className="leading-[1.6] text-[var(--muted)]">{s}</span></div></Reveal>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
