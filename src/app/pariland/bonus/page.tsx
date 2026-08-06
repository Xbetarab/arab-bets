'use client';

import { useState } from 'react';
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

/* ═══════════════════════ 6. BONUS — مسار مكافأة + FAQ ═══════════════════════ */

export default function Page() {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState<number | null>(0);
  const deposits = [['100%', 'إيداع 1'], ['50%', 'إيداع 2'], ['25%', 'إيداع 3'], ['25%', 'إيداع 4']];
  const faqs = [
    { q: 'شنو الفرق بين مكافأة الرياضة والكازينو؟', a: 'مكافأة الرياضة 100% على الإيداع الأول للمراهنات الرياضية. مكافأة الكازينو موزعة على 4 إيداعات (100%، 50%، 25%، 25%) مع لفات مجانية.' },
    { q: 'شنو شرط الرهان لتحرير المكافأة؟', a: 'يجب تدوير مبلغ المكافأة عدة مرات برهانات تراكمية (3 أحداث فأكثر بتذكرة واحدة، كل حدث باحتمالية 1.40 فأعلى) قبل أن تصبح قابلة للسحب.' },
    { q: 'ليش المكافأة ما تتحرر؟', a: 'أشهر الأسباب: استخدام رهانات مفردة بدل تراكمية، أو أحداث باحتمالية أقل من 1.40، أو السحب المبكر (Cash Out) الذي لا يُحتسب عادة.' },
  ];
  return (
    <main dir="rtl" lang="ar" className={`${display.variable} ${body.variable} min-h-screen bg-[var(--bg)] font-[var(--font-body)] text-[var(--ink)] antialiased`}>
      <style dangerouslySetInnerHTML={{ __html: tokens }} />
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0"><div className="absolute -top-40 right-[-8%] h-[440px] w-[600px] rounded-full bg-[oklch(83%_0.22_145/0.1)] blur-[120px]" /></div>
        <div className="relative mx-auto max-w-3xl px-6">
          <Header />
          <div className="pb-8 pt-8 text-center md:pt-12">
            <motion.h1 initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, delay: 0.08, ease: EASE }}
              className="font-[var(--font-display)] text-[clamp(2.2rem,6vw,3.5rem)] font-bold leading-[1.1] tracking-[-0.03em]">
              مكافآت <span className="text-[var(--neon-bright)]">Pariland</span>
            </motion.h1>
            <motion.p initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15, ease: EASE }}
              className="mx-auto mt-4 max-w-xl text-lg leading-[1.6] text-[var(--muted)]">مكافأة الكازينو موزعة على 4 إيداعات، ومكافأة الرياضة على الأول. افهم الشروط قبل ما تبدأ.</motion.p>
          </div>
        </div>
      </section>

      {/* مسار الإيداعات — العنصر المميز */}
      <section className="mx-auto max-w-3xl px-6 py-10">
        <Reveal><p className="text-center text-sm font-medium tracking-[0.18em] text-[var(--neon-dim)]">مكافأة الكازينو تتوزع على</p></Reveal>
        <div className="mt-8 flex items-center justify-center gap-2 overflow-x-auto pb-2">
          {deposits.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <Reveal delay={i * 0.08}>
                <div className="flex flex-col items-center">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl border-2 border-[var(--neon)] bg-[oklch(83%_0.22_145/0.1)] font-[var(--font-display)] text-lg font-bold text-[var(--neon-bright)] shadow-[0_0_16px_oklch(83%_0.22_145/0.25)]">{d[0]}</div>
                  <p className="mt-2 text-sm font-bold text-[var(--ink)]">{d[1]}</p>
                </div>
              </Reveal>
              {i < deposits.length - 1 && <div aria-hidden className="h-0.5 w-6 bg-[var(--neon-dim)]" />}
            </div>
          ))}
        </div>
        <Reveal delay={0.3}><div className="mt-10 text-center"><CTA big>سجّل بالرمز {PROMO_CODE} ←</CTA></div></Reveal>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        <Reveal><h2 className="font-[var(--font-display)] text-2xl font-bold tracking-[-0.02em] md:text-3xl">أسئلة المكافأة</h2></Reveal>
        <div className="mt-8 space-y-2.5">
          {faqs.map((item, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={i} delay={i * 0.05}>
                <div className={`overflow-hidden rounded-2xl border transition-colors duration-200 ${isOpen ? 'border-[oklch(83%_0.22_145/0.4)] bg-[var(--surface)]' : 'border-[var(--line)]'}`}>
                  <button onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} className="focus-ring flex min-h-[56px] w-full items-center justify-between gap-4 px-5 py-4 text-right">
                    <span className="font-bold text-[var(--ink)]">{item.q}</span>
                    <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--raised)] text-lg font-bold text-[var(--ink)]" aria-hidden>+</motion.span>
                  </button>
                  <motion.div initial={false} animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }} transition={{ duration: 0.28, ease: EASE }} style={{ overflow: 'hidden' }} aria-hidden={!isOpen}>
                    <p className="px-5 pb-5 leading-[1.6] text-[var(--muted)]">{item.a}</p>
                  </motion.div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>
      <Footer />
    </main>
  );
}
