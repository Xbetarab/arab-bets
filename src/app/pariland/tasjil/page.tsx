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
      <a href="/pariland" className="focus-ring rounded-lg px-4 py-2 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--ink)]">← المراجعة الكاملة</a>
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
        <a href="/about" className="text-xs text-[var(--faint)] underline underline-offset-4 hover:text-[var(--muted)]">من نحن وسياسة الإفصاح</a>
      </div>
    </footer>
  );
}

/* ═══════════════════════ 1. TASJIL — خط زمني عمودي مرقّم ═══════════════════════ */

export default function Page() {
  const reduce = useReducedMotion();
  const steps = [
    { t: 'افتح صفحة التسجيل', d: 'اضغط "سجّل الآن" واختر إحدى طرق التسجيل الأربع (الرمز، الهاتف، البريد، الشبكات الاجتماعية).' },
    { t: 'اختر العراق والدينار', d: 'حدّد الدولة: العراق، والعملة: الدينار العراقي (IQD) لتناسب طرق الدفع المحلية.' },
    { t: `أدخل الرمز الترويجي ${PROMO_CODE}`, d: 'الخانة تظهر مرة واحدة فقط أثناء التسجيل — أدخل الرمز قبل التأكيد لمضاعفة مكافأتك.' },
    { t: 'احفظ بياناتك وابدأ', d: 'احفظ رقم حسابك وكلمة المرور فوراً بلقطة شاشة، ثم أودع وابدأ اللعب.' },
  ];
  return (
    <main dir="rtl" lang="ar" className={`${display.variable} ${body.variable} min-h-screen bg-[var(--bg)] font-[var(--font-body)] text-[var(--ink)] antialiased`}>
      <style dangerouslySetInnerHTML={{ __html: tokens }} />
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0"><div className="absolute -top-40 right-[-8%] h-[440px] w-[600px] rounded-full bg-[oklch(83%_0.22_145/0.1)] blur-[120px]" /></div>
        <div className="relative mx-auto max-w-3xl px-6">
          <Header />
          <div className="pb-10 pt-8 text-center md:pb-14 md:pt-12">
            <motion.h1 initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, delay: 0.08, ease: EASE }}
              className="font-[var(--font-display)] text-[clamp(2.3rem,6vw,3.5rem)] font-bold leading-[1.1] tracking-[-0.03em]">
              التسجيل في Pariland<br /><span className="text-[var(--neon-bright)]">خطوة بخطوة</span>
            </motion.h1>
            <motion.p initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15, ease: EASE }}
              className="mx-auto mt-5 max-w-xl text-lg leading-[1.6] text-[var(--muted)]">أقل من دقيقتين لإنشاء حسابك. لا تنسَ الرمز الترويجي <strong className="text-[var(--neon-bright)]">{PROMO_CODE}</strong>.</motion.p>
          </div>
        </div>
      </section>

      {/* خط زمني عمودي — العنصر المميز لهذه الصفحة */}
      <section className="mx-auto max-w-2xl px-6 py-12 md:py-16">
        <div className="relative">
          <div aria-hidden className="absolute right-[22px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-[var(--neon)] via-[var(--neon-dim)] to-transparent" />
          <div className="space-y-8">
            {steps.map((s, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div className="flex gap-5">
                  <div className="relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-[var(--neon)] bg-[var(--bg)] font-[var(--font-display)] text-lg font-bold text-[var(--neon-bright)] shadow-[0_0_16px_oklch(83%_0.22_145/0.3)]">{i + 1}</div>
                  <div className="flex-1 rounded-[20px] border border-[var(--line)] bg-[var(--surface)] p-5">
                    <h3 className="font-bold text-[var(--ink)]">{s.t}</h3>
                    <p className="mt-1.5 leading-[1.6] text-[var(--muted)]">{s.d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        <Reveal delay={0.3}><div className="mt-12 text-center"><CTA big>سجّل الآن ←</CTA></div></Reveal>
      </section>
      <Footer />
    </main>
  );
}
