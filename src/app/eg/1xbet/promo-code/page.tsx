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

export default function PromoCodePage() {
  const reduce = useReducedMotion();
  return (
    <main dir="rtl" lang="ar" className={`${display.variable} ${body.variable} min-h-screen bg-[var(--paper)] font-[var(--font-body)] text-[var(--ink)] antialiased`}>
      <style dangerouslySetInnerHTML={{ __html: tokens }} />
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-[360px] w-[640px] -translate-x-1/2 rounded-full bg-[oklch(74%_0.13_78/0.12)] blur-[120px]" />
        <div className="relative mx-auto max-w-3xl px-6">
          <Header />
          <div className="pt-8 text-center">
            <motion.h1 initial={reduce ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34, delay: 0.08, ease: EASE }}
              className="font-[var(--font-display)] text-[clamp(2.4rem,6.5vw,4rem)] font-black leading-[1.05] tracking-[-0.04em]">البرومو كود <span className="text-[var(--nile)]">بتاع 1xBet</span></motion.h1>
            <motion.p initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15, ease: EASE }}
              className="mx-auto mt-5 max-w-xl text-lg leading-[1.6] text-[var(--muted)]">البرومو كود بتاع 1xBet هو <strong className="text-[var(--gold-deep)]">{PROMO_CODE}</strong> — اكتبه وانت بتسجّل عشان تضاعف مكافأتك الترحيبية على أول إيداع.</motion.p>
          </div>
        </div>
      </section>
      {/* قسيمة عملاقة — العنصر المميز */}
      <section className="mx-auto max-w-2xl px-6 py-10">
        <Reveal>
          <div className="relative overflow-hidden rounded-[28px] border-2 border-dashed border-[var(--gold)] bg-[var(--card)] p-8 text-center shadow-[0_16px_50px_oklch(26%_0.03_250/0.1)]">
            <p className="text-sm font-bold tracking-[0.15em] text-[var(--gold-deep)]">البرومو كود الحصري</p>
            <p className="mt-4 font-[var(--font-display)] text-6xl font-black tracking-[0.12em] text-[var(--nile)]">{PROMO_CODE}</p>
            <div className="mt-6 flex justify-center"><DownloadCTA big>حمّل التطبيق واستخدمه</DownloadCTA></div>
          </div>
        </Reveal>
      </section>
      <section className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        <Reveal><h2 className="font-[var(--font-display)] text-2xl font-black tracking-[-0.02em] md:text-3xl">الفرق بالكود ومن غيره</h2></Reveal>
        <Reveal delay={0.1}>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 opacity-70">
              <p className="text-sm font-bold text-[var(--faint)]">من غير البرومو كود</p>
              <p className="mt-3 leading-[1.6] text-[var(--muted)]">مكافأة ترحيبية أساسية بس على أول إيداع، من غير مضاعفة.</p>
            </div>
            <div className="rounded-2xl border-2 border-[var(--gold)] bg-[oklch(74%_0.13_78/0.07)] p-6">
              <p className="text-sm font-bold text-[var(--gold-deep)]">بالبرومو كود {PROMO_CODE} ✓</p>
              <p className="mt-3 leading-[1.6] text-[var(--muted)]">مكافأة ترحيبية <strong className="text-[var(--ink)]">مضاعفة</strong> — أقصى استفادة من أول ما تبدأ.</p>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 text-center">
            <p className="text-[var(--muted)]">💡 الخانة بتظهر مرة واحدة بس وانت بتعمل حساب — اكتب الكود قبل ما تأكّد، وبعد كده مش هتقدر تضيفه.</p>
          </div>
        </Reveal>
      </section>
      <Footer />
    </main>
  );
}
