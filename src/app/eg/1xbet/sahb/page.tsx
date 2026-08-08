'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Cairo, Tajawal } from 'next/font/google';

const display = Cairo({ subsets: ['arabic'], weight: ['700', '800', '900'], variable: '--font-display' });
const body = Tajawal({ subsets: ['arabic'], weight: ['400', '500', '700'], variable: '--font-body' });

const AFF_LINK = '/go/1xbet-eg';
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

export default function SahbPage() {
  const reduce = useReducedMotion();
  const rows = [
    ['فودافون كاش', '50', '30,000', 'رقم المحفظة'],
    ['اتصالات كاش', '50', '30,000', 'رقم المحفظة'],
    ['انستاباي', '100', '50,000', 'حساب InstaPay'],
    ['فوري', '50', '20,000', 'كود الدفع'],
    ['العملات الرقمية', '—', 'حسب العملة', 'عنوان المحفظة'],
  ];
  return (
    <main dir="rtl" lang="ar" className={`${display.variable} ${body.variable} min-h-screen bg-[var(--paper)] font-[var(--font-body)] text-[var(--ink)] antialiased`}>
      <style dangerouslySetInnerHTML={{ __html: tokens }} />
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-[360px] w-[640px] -translate-x-1/2 rounded-full bg-[oklch(74%_0.13_78/0.1)] blur-[120px]" />
        <div className="relative mx-auto max-w-5xl px-6">
          <Header />
          <div className="py-12 md:py-16">
            <motion.h1 initial={reduce ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34, delay: 0.08, ease: EASE }}
              className="font-[var(--font-display)] text-[clamp(2.4rem,6.5vw,4rem)] font-black leading-[1.05] tracking-[-0.04em]">طرق السحب <span className="text-[var(--nile)]">بالجنيه</span></motion.h1>
            <motion.p initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15, ease: EASE }}
              className="mt-5 max-w-xl text-lg leading-[1.6] text-[var(--muted)]">الحدود الدنيا والقصوى لكل طريقة سحب بالجنيه المصري والبيانات المطلوبة.</motion.p>
          </div>
        </div>
      </section>
      {/* جدول حدود — العنصر المميز */}
      <section className="mx-auto max-w-4xl px-6 pb-12">
        <Reveal>
          <div className="overflow-x-auto rounded-[24px] border border-[var(--line)] bg-[var(--card)] shadow-[0_8px_30px_oklch(26%_0.03_250/0.06)]">
            <table className="w-full min-w-[560px] text-right">
              <thead><tr className="bg-[var(--nile)] text-sm text-[var(--paper)]">
                <th className="p-4 font-bold">الطريقة</th><th className="p-4 font-bold">الأدنى (ج.م)</th><th className="p-4 font-bold">الأقصى (ج.م)</th><th className="p-4 font-bold">المطلوب</th>
              </tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-[var(--line)] last:border-0">
                    <td className="p-4 font-bold text-[var(--ink)]">{r[0]}</td>
                    <td className="p-4 text-[var(--muted)]">{r[1]}</td>
                    <td className="p-4 text-[var(--muted)]">{r[2]}</td>
                    <td className="p-4 text-sm text-[var(--muted)]">{r[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="mt-6 rounded-2xl border-2 border-[oklch(74%_0.13_78/0.35)] bg-[oklch(74%_0.13_78/0.07)] p-5">
            <p className="text-sm leading-[1.6] text-[var(--muted)]"><strong className="text-[var(--gold-deep)]">💡 ملحوظة:</strong> الحدود دي تقريبية وممكن تختلف شوية حسب تحديثات التطبيق — راجع الحد المعروض جوه التطبيق نفسه قبل السحب للتأكيد.</p>
          </div>
        </Reveal>
        <Reveal delay={0.2}><div className="mt-10 text-center"><DownloadCTA big>حمّل التطبيق</DownloadCTA></div></Reveal>
      </section>
      <Footer />
    </main>
  );
}
