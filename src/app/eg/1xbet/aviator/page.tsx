'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
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

export default function AviatorPage() {
  const reduce = useReducedMotion();
  const [multiplier, setMultiplier] = useState(1.0);
  const [phase, setPhase] = useState<'rising' | 'crashed'>('rising');
  const [crashPoint] = useState(() => 1.5 + Math.random() * 4);

  useEffect(() => {
    if (reduce) return;
    let raf: number; let start = performance.now();
    const tick = (now: number) => {
      const m = 1 + ((now - start) / 1000) * 0.7;
      if (m >= crashPoint) {
        setMultiplier(crashPoint); setPhase('crashed');
        setTimeout(() => { setPhase('rising'); setMultiplier(1.0); start = performance.now(); }, 1400);
      } else { setMultiplier(m); raf = requestAnimationFrame(tick); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crashPoint, reduce]);

  const faqs = [
    { q: 'لعبة الطيارة عادلة؟', a: 'اللعبة بتشتغل بنظام RNG (أرقام عشوائية) معتمد، ونتيجة كل جولة بتتحدّد عشوائياً ومستقلة عن اللي قبلها — مفيش نمط تقدر تتوقعه.' },
    { q: 'فيه استراتيجية مضمونة للربح؟', a: 'لأ خالص. دي لعبة حظ بحتة، وأي حد بيقولك "استراتيجية مضمونة" بيضحك عليك. المنصة دايماً ليها هامش ربح إحصائي، فالعب بحذر ومتحطّش فلوس مش قادر تخسرها.' },
    { q: 'أقدر أجرّبها ببلاش الأول؟', a: 'أغلب المنصات فيها وضع تجريبي (Demo) تقدر تجرّب بيه الآلية من غير فلوس حقيقية — دوّر عليه قبل ما تراهن بجد.' },
  ];
  const [open, setOpen] = useState<number | null>(0);
  const progress = Math.min((multiplier - 1) / (crashPoint - 1), 1);

  return (
    <main dir="rtl" lang="ar" className={`${display.variable} ${body.variable} min-h-screen bg-[var(--paper)] font-[var(--font-body)] text-[var(--ink)] antialiased`}>
      <style dangerouslySetInnerHTML={{ __html: tokens }} />
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-[360px] w-[640px] -translate-x-1/2 rounded-full bg-[oklch(74%_0.13_78/0.1)] blur-[120px]" />
        <div className="relative mx-auto max-w-6xl px-6">
          <Header />
          <div className="grid items-center gap-12 py-12 md:grid-cols-[1fr_0.9fr] md:py-16">
            <div>
              <motion.h1 initial={reduce ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34, delay: 0.08, ease: EASE }}
                className="font-[var(--font-display)] text-[clamp(2.4rem,6.5vw,4rem)] font-black leading-[1.05] tracking-[-0.04em]">لعبة الطيارة<br /><span className="text-[var(--nile)]">Aviator</span></motion.h1>
              <motion.p initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15, ease: EASE }}
                className="mt-5 max-w-lg text-lg leading-[1.6] text-[var(--muted)]">اعرف إزاي بتشتغل، وأهم حاجة — المخاطر الحقيقية قبل ما تراهن. لعبة حظ، مفيش استراتيجية مضمونة.</motion.p>
              <motion.div initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.22, ease: EASE }} className="mt-8"><DownloadCTA big>حمّل وجرّب</DownloadCTA></motion.div>
            </div>
            {/* محاكاة المضاعف — العنصر المميز */}
            <Reveal delay={0.2}>
              <div className="relative overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--nile-deep)] p-6 shadow-[0_16px_50px_oklch(32%_0.1_248/0.3)]">
                <p className="text-center text-xs tracking-[0.2em] text-[oklch(96%_0.014_85/0.6)]">محاكاة توضيحية — مش نتيجة حقيقية</p>
                <div className="relative mt-4 h-48 overflow-hidden rounded-2xl bg-[oklch(26%_0.08_250)]">
                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 200 100" preserveAspectRatio="none">
                    <motion.path d={`M 10 90 Q ${10 + progress * 90} ${90 - progress * 60}, ${10 + progress * 180} ${90 - progress * 75}`} fill="none"
                      stroke={phase === 'crashed' ? 'oklch(58% 0.19 25)' : 'oklch(74% 0.13 78)'} strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                  <motion.div className="absolute text-2xl" style={{ left: `${5 + progress * 82}%`, bottom: `${8 + progress * 62}%` }}
                    animate={phase === 'crashed' ? { opacity: 0, scale: 0.5 } : { opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>✈️</motion.div>
                  <div className="absolute inset-x-0 top-4 text-center">
                    <AnimatePresence mode="wait">
                      <motion.p key={phase} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className={`font-[var(--font-display)] text-4xl font-black ${phase === 'crashed' ? 'text-[var(--red)]' : 'text-[var(--gold)]'}`}>{multiplier.toFixed(2)}x</motion.p>
                    </AnimatePresence>
                    {phase === 'crashed' && <p className="mt-1 text-sm font-bold text-[var(--red)]">طارت! 💥</p>}
                  </div>
                </div>
                <p className="mt-4 text-center text-sm leading-[1.6] text-[oklch(96%_0.014_85/0.8)]">المضاعف بيطلع باستمرار — تسحب مكسبك في أي وقت قبل ما الطيارة &quot;تطير&quot;. كل جولة عشوائية متقدرش تتوقعها.</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* تحذير المخاطر — القسم الأهم */}
      <section className="mx-auto max-w-4xl px-6 py-14">
        <Reveal>
          <div className="rounded-[24px] border-2 border-[oklch(58%_0.19_25/0.3)] bg-[oklch(58%_0.19_25/0.05)] p-7">
            <p className="text-sm font-bold tracking-[0.1em] text-[var(--red)]">⚠ اقرا ده قبل أي رهان</p>
            <h2 className="mt-3 font-[var(--font-display)] text-2xl font-black tracking-[-0.02em] md:text-3xl">الطيارة لعبة حظ — مفيش نظام يضمن المكسب</h2>
            <div className="mt-5 space-y-3 leading-[1.7] text-[var(--muted)]">
              <p>كل جولة بتتحدّد عشوائي بالكامل (RNG) ومستقلة عن اللي قبلها — مفيش &quot;نمط&quot; ولا &quot;توقيت مثالي&quot; تقدر تتعلمه. أي محتوى بيدّعي &quot;استراتيجية مضمونة&quot; مش صحيح.</p>
              <p>المنصة دايماً ليها هامش ربح إحصائي على المدى الطويل، يعني اللعب لفترة طويلة بيميل إحصائياً لصالح المنصة. وسرعة الجولات (ثواني) بتخليها من أكتر الألعاب اللي محتاجة انضباط في تحديد ميزانية والالتزام بيها.</p>
              <p className="font-bold text-[var(--ink)]">حدّد مبلغ تقدر تخسره بالكامل قبل ما تبدأ، ومتحاولش &quot;تعوّض&quot; خسارة برهان أكبر.</p>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="bg-[var(--paper-2)]">
        <div className="mx-auto max-w-3xl px-6 py-14 md:py-18">
          <Reveal><h2 className="font-[var(--font-display)] text-2xl font-black tracking-[-0.02em] md:text-3xl">أسئلة شائعة</h2></Reveal>
          <div className="mt-8 space-y-3">
            {faqs.map((item, i) => {
              const isOpen = open === i;
              return (
                <Reveal key={i} delay={i * 0.05}>
                  <div className={`overflow-hidden rounded-2xl border transition-colors duration-200 ${isOpen ? 'border-[var(--gold)] bg-[var(--card)]' : 'border-[var(--line)] bg-[var(--card)]'}`}>
                    <button onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} className="focus-ring flex min-h-[56px] w-full items-center justify-between gap-4 px-5 py-4 text-right">
                      <span className="font-bold text-[var(--ink)]">{item.q}</span>
                      <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--nile)] text-lg font-bold text-[var(--paper)]" aria-hidden>+</motion.span>
                    </button>
                    <motion.div initial={false} animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }} transition={{ duration: 0.28, ease: EASE }} style={{ overflow: 'hidden' }} aria-hidden={!isOpen}>
                      <p className="px-5 pb-5 leading-[1.7] text-[var(--muted)]">{item.a}</p>
                    </motion.div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
