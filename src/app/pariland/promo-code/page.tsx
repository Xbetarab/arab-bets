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

/* ═══════════════════════ 3. PROMO-CODE — قسيمة + جدول قبل/بعد ═══════════════════════ */

export default function Page() {
  const reduce = useReducedMotion();
  return (
    <main dir="rtl" lang="ar" className={`${display.variable} ${body.variable} min-h-screen bg-[var(--bg)] font-[var(--font-body)] text-[var(--ink)] antialiased`}>
      <style dangerouslySetInnerHTML={{ __html: tokens }} />
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0"><div className="absolute -top-40 right-[-8%] h-[440px] w-[600px] rounded-full bg-[oklch(83%_0.22_145/0.12)] blur-[120px]" /></div>
        <div className="relative mx-auto max-w-3xl px-6">
          <Header />
          <div className="pb-8 pt-8 text-center md:pt-12">
            <motion.h1 initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, delay: 0.08, ease: EASE }}
              className="font-[var(--font-display)] text-[clamp(2.2rem,6vw,3.5rem)] font-bold leading-[1.1] tracking-[-0.03em]">
              الرمز الترويجي <span className="text-[var(--neon-bright)]">Pariland</span>
            </motion.h1>
            <motion.p initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15, ease: EASE }}
              className="mx-auto mt-4 max-w-xl text-lg leading-[1.6] text-[var(--muted)]">الرمز الترويجي Pariland هو <strong className="text-[var(--neon-bright)]">{PROMO_CODE}</strong> — أدخله أثناء التسجيل لمضاعفة مكافأتك الترحيبية على أول إيداع.</motion.p>
          </div>
        </div>
      </section>

      {/* قسيمة كبيرة — العنصر المميز */}
      <section className="mx-auto max-w-2xl px-6 pb-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[28px] border-2 border-dashed border-[oklch(83%_0.22_145/0.5)] bg-[var(--surface)] p-8 text-center">
            <div aria-hidden className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[oklch(83%_0.22_145/0.12)] blur-2xl" />
            <p className="text-sm font-medium tracking-[0.15em] text-[var(--neon-dim)]">الرمز الترويجي الحصري</p>
            <p className="mt-4 font-[var(--font-display)] text-5xl font-bold tracking-[0.15em] text-[var(--neon-bright)] md:text-6xl">{PROMO_CODE}</p>
            <div className="mt-6 flex justify-center"><CTA big>سجّل بالرمز {PROMO_CODE} ←</CTA></div>
          </div>
        </Reveal>
      </section>

      {/* جدول قبل/بعد */}
      <section className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        <Reveal><h2 className="font-[var(--font-display)] text-2xl font-bold tracking-[-0.02em] md:text-3xl">الفرق مع الرمز وبدونه</h2></Reveal>
        <Reveal delay={0.1}>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[20px] border border-[var(--line)] bg-[var(--surface)] p-6 opacity-70">
              <p className="text-sm font-bold text-[var(--faint)]">بدون الرمز</p>
              <p className="mt-3 leading-[1.6] text-[var(--muted)]">مكافأة ترحيبية أساسية فقط على إيداعك الأول، بلا مضاعفة.</p>
            </div>
            <div className="rounded-[20px] border-2 border-[oklch(83%_0.22_145/0.4)] bg-[oklch(83%_0.22_145/0.06)] p-6">
              <p className="text-sm font-bold text-[var(--neon-bright)]">مع الرمز {PROMO_CODE} ✓</p>
              <p className="mt-3 leading-[1.6] text-[var(--muted)]">مكافأة ترحيبية <strong className="text-[var(--ink)]">مضاعفة</strong> على أول إيداع — أقصى استفادة من بداية حسابك.</p>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 text-center">
            <p className="text-[var(--muted)]">💡 الخانة تظهر مرة واحدة فقط أثناء إنشاء الحساب — بعدها لا يمكن إضافة الرمز. أدخله قبل التأكيد.</p>
          </div>
        </Reveal>
      </section>
      <Footer />
    </main>
  );
}
