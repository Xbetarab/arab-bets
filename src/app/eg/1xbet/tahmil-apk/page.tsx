'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Cairo, Tajawal } from 'next/font/google';

const display = Cairo({ subsets: ['arabic'], weight: ['700', '800', '900'], variable: '--font-display' });
const body = Tajawal({ subsets: ['arabic'], weight: ['400', '500', '700'], variable: '--font-body' });

const AFF_LINK = '/go/1xbet-eg';
const PROMO_CODE = 'X9GO';
const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const tokens = `
  :root {
    --paper: oklch(96% 0.014 85); --paper-2: oklch(93% 0.018 84); --card: oklch(99% 0.006 85);
    --nile: oklch(42% 0.11 245); --nile-deep: oklch(32% 0.10 248);
    --gold: oklch(74% 0.13 78); --gold-deep: oklch(64% 0.14 72);
    --ink: oklch(26% 0.03 250); --muted: oklch(46% 0.03 250); --faint: oklch(46% 0.03 250 / 0.6);
    --red: oklch(58% 0.19 25); --line: oklch(26% 0.03 250 / 0.12);
  }
  .focus-ring:focus-visible { outline: 2px solid var(--gold-deep); outline-offset: 3px; border-radius: 12px; }
`;

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div initial={reduce ? false : { opacity: 0, y: 18, scale: 0.98 }} whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.3, delay, ease: EASE }} className={className}>{children}</motion.div>
  );
}

function BrandLogo({ className = '' }: { className?: string }) {
  return (
    <span dir="ltr" aria-label="1xBet" role="img" className={`relative inline-flex select-none items-baseline leading-none ${className}`}>
      <span className="font-[var(--font-display)] text-2xl font-black italic tracking-[-0.03em] text-[var(--ink)]">1X</span>
      <span className="font-[var(--font-display)] text-2xl font-black italic tracking-[-0.03em] text-[var(--nile)]">BET</span>
      <span aria-hidden className="absolute -bottom-1.5 left-[2px] h-[3px] w-8 rounded-full bg-[var(--gold)]" />
    </span>
  );
}

function DownloadCTA({ children, big = false }: { children: React.ReactNode; big?: boolean }) {
  return (
    <motion.a href={AFF_LINK} target="_blank" rel="sponsored nofollow noopener" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      className={`focus-ring inline-flex items-center justify-center gap-2.5 rounded-full bg-[var(--nile)] font-bold text-[var(--paper)]
        shadow-[0_2px_4px_oklch(32%_0.1_248/0.2),0_10px_30px_oklch(42%_0.11_245/0.28)] transition-all duration-200
        hover:bg-[var(--nile-deep)] hover:shadow-[0_14px_40px_oklch(42%_0.11_245/0.4)]
        ${big ? 'min-h-[64px] px-9 py-5 text-xl' : 'min-h-[48px] px-6 py-3 text-base'}`}>
      <span aria-hidden>⬇</span>{children}
    </motion.a>
  );
}

function Header() {
  return (
    <header className="flex items-center justify-between py-6">
      <BrandLogo />
      <a href="/eg/1xbet" className="focus-ring rounded-full px-4 py-2.5 text-sm font-bold text-[var(--muted)] transition-colors hover:text-[var(--ink)]">← الدليل الكامل</a>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--paper-2)] px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 text-center">
        <BrandLogo className="scale-90 opacity-80" />
        <p className="max-w-3xl text-sm leading-[1.6] text-[var(--faint)]">
          ⚠️ إخلاء مسؤولية: موقع معلوماتي مستقل لأغراض المراجعة، لا يمثّل 1xBet رسمياً. المراهنات لمن هم 18 سنة فأكتر وفيها مخاطرة مالية — العب بمسؤولية ومتراهنش بفلوس مش قادر تخسرها.
        </p>
        <a href="/about" className="text-xs text-[var(--faint)] underline underline-offset-4 hover:text-[var(--muted)]">من نحن وسياسة الإفصاح</a>
      </div>
    </footer>
  );
}

export default function TahmilApkPage() {
  const reduce = useReducedMotion();
  const specs = [['نظام التشغيل', 'أندرويد 5.0 فأعلى'], ['الحجم', '~56 ميجا'], ['اللغة', 'عربي'], ['السعر', 'مجاني']];
  const steps = ['فعّل "مصادر غير معروفة" من إعدادات الأمان', 'دوس زرار التحميل واستنى الملف ينزّل', 'افتح ملف APK واعمل تثبيت', `سجّل وحط البرومو كود ${PROMO_CODE}`];
  return (
    <main dir="rtl" lang="ar" className={`${display.variable} ${body.variable} min-h-screen bg-[var(--paper)] font-[var(--font-body)] text-[var(--ink)] antialiased`}>
      <style dangerouslySetInnerHTML={{ __html: tokens }} />
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-[360px] w-[640px] -translate-x-1/2 rounded-full bg-[oklch(74%_0.13_78/0.1)] blur-[120px]" />
        <div className="relative mx-auto max-w-6xl px-6">
          <Header />
          <div className="grid items-center gap-12 py-12 md:grid-cols-[1fr_0.85fr] md:py-16">
            <div>
              <motion.h1 initial={reduce ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34, delay: 0.08, ease: EASE }}
                className="font-[var(--font-display)] text-[clamp(2.4rem,6.5vw,4rem)] font-black leading-[1.05] tracking-[-0.04em]">
                نزّل تطبيق<br /><span className="text-[var(--nile)]">1xBet APK</span>
              </motion.h1>
              <motion.p initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15, ease: EASE }}
                className="mt-5 max-w-lg text-lg leading-[1.6] text-[var(--muted)]">حمّل التطبيق الرسمي على موبايلك والعب في أي وقت. متنساش البرومو كود <strong className="text-[var(--gold-deep)]">{PROMO_CODE}</strong>.</motion.p>
              <motion.div initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.22, ease: EASE }} className="mt-8"><DownloadCTA big>حمّل التطبيق دلوقتي</DownloadCTA></motion.div>
            </div>
            {/* بطاقة موبايل — العنصر المميز */}
            <Reveal delay={0.2}>
              <div className="mx-auto w-full max-w-xs rounded-[32px] border-[6px] border-[var(--nile-deep)] bg-[var(--card)] p-5 shadow-[0_20px_60px_oklch(32%_0.1_248/0.25)]">
                <div className="flex items-center gap-3 border-b border-[var(--line)] pb-4">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--nile)] font-[var(--font-display)] text-xl font-black italic text-[var(--paper)]">1X</div>
                  <div><p className="font-bold text-[var(--ink)]">1xBet</p><p className="text-xs text-[var(--faint)]">رياضة وكازينو</p></div>
                </div>
                <div className="divide-y divide-[var(--line)]">
                  {specs.map(([k, v]) => (<div key={k} className="flex items-center justify-between py-3"><span className="text-sm text-[var(--faint)]">{k}</span><span className="text-sm font-bold text-[var(--ink)]">{v}</span></div>))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
      <section className="bg-[var(--paper-2)]">
        <div className="mx-auto max-w-4xl px-6 py-14 md:py-18">
          <Reveal><h2 className="font-[var(--font-display)] text-2xl font-black tracking-[-0.02em] md:text-3xl">خطوات التثبيت</h2></Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {steps.map((s, i) => (
              <Reveal key={i} delay={i * 0.06}><div className="flex gap-4 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--nile)] text-sm font-bold text-[var(--paper)]">{i + 1}</span>
                <span className="leading-[1.6] text-[var(--muted)]">{s}</span></div></Reveal>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
