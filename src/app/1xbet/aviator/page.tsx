'use client';

/**
 * 1xBet العراق — صفحة لعبة الطيارة Aviator  (/1xbet/aviator)
 * Next.js 15 (App Router) + Tailwind + Framer Motion
 *
 * العنصر المميز: محاكاة حية للمضاعف (منحنى صعود + إعادة تصفير) —
 * ثامن تنويع بصري، مبني بالكامل بـFramer Motion، لا صور فعلية للعبة.
 *
 * ملاحظة نزاهة مهمة: هذه لعبة حظ بحتة (RNG) — لا "استراتيجية مضمونة"
 * بأي مكان بالصفحة. القسم الأهم هنا هو التحذير الصادق من المخاطر،
 * لا الترويج لطريقة ربح. صفحات كهذه تحتاج معياراً أعلى من الحذر.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Changa, IBM_Plex_Sans_Arabic } from 'next/font/google';
import RelatedLinks from '../RelatedLinks';

const display = IBM_Plex_Sans_Arabic({ subsets: ['arabic'], weight: ['500', '600', '700'], variable: '--font-display' });
const body = Changa({ subsets: ['arabic'], weight: ['400', '500', '600'], variable: '--font-body' });

const AFF_LINK = 'https://dub.sh/fP9V2WH';
const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const tokens = `
  :root {
    --bg:          oklch(23% 0.048 251);
    --bg-deep:     oklch(19% 0.043 252);
    --surface:     oklch(29% 0.058 250);
    --raised:      oklch(40% 0.082 248);
    --ink:         oklch(97% 0.010 250);
    --muted:       oklch(79% 0.027 248);
    --faint:       oklch(79% 0.027 248 / 0.55);
    --lime:        oklch(71% 0.165 128);
    --lime-bright: oklch(80% 0.180 128);
    --sky:         oklch(72% 0.120 242);
    --amber:       oklch(78% 0.140 75);
    --red:         oklch(63% 0.19 25);
    --line:        oklch(97% 0.01 250 / 0.09);
  }
  .focus-ring:focus-visible { outline: 2px solid var(--lime-bright); outline-offset: 3px; border-radius: 12px; }
`;

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.28, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function BrandLogo({ className = '' }: { className?: string }) {
  return (
    <span dir="ltr" aria-label="1xBet" role="img" className={`relative inline-flex select-none items-baseline leading-none ${className}`}>
      <span className="font-[var(--font-display)] text-3xl font-bold italic tracking-[-0.03em] text-[var(--ink)]">1X</span>
      <span className="font-[var(--font-display)] text-3xl font-bold italic tracking-[-0.03em] text-[var(--sky)]">BET</span>
      <span aria-hidden className="absolute -bottom-1.5 left-[2px] h-[3px] w-9 -skew-x-[18deg] rounded-full bg-[var(--lime)]" />
    </span>
  );
}

function PrimaryCTA({ children, className = '', big = false }: { children: React.ReactNode; className?: string; big?: boolean }) {
  return (
    <motion.a
      href={AFF_LINK}
      target="_blank"
      rel="sponsored noopener"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      className={`focus-ring inline-flex items-center justify-center gap-2.5 rounded-2xl bg-[var(--lime)] font-bold text-[var(--bg-deep)]
        shadow-[0_1px_2px_oklch(0%_0_0/0.2),0_8px_28px_oklch(71%_0.165_128/0.4)]
        transition-shadow duration-200 hover:bg-[var(--lime-bright)]
        hover:shadow-[0_1px_2px_oklch(0%_0_0/0.2),0_10px_40px_oklch(80%_0.18_128/0.6)]
        ${big ? 'min-h-[64px] px-10 py-5 text-2xl' : 'min-h-[48px] px-6 py-3 text-base'} ${className}`}
    >
      {children}
    </motion.a>
  );
}

/* ------------------------- محاكاة المضاعف الحية (العنصر المميز) ------------------------- */
/* توضيحية بالكامل — لا تمثّل نتائج حقيقية أو مضموناً. تُعيد نفسها بعشوائية
   مصطنعة بسيطة فقط لشرح الآلية بصرياً. */

function LiveMultiplierDemo() {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<'rising' | 'crashed'>('rising');
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashPoint] = useState(() => 1.5 + Math.random() * 4.5); // توضيحي فقط، لا علاقة له بأي معدل ربح حقيقي

  useEffect(() => {
    if (reduce) return;
    let raf: number;
    let start = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      const m = 1 + elapsed * 0.7;
      if (m >= crashPoint) {
        setMultiplier(crashPoint);
        setPhase('crashed');
        setTimeout(() => {
          setPhase('rising');
          setMultiplier(1.0);
          start = performance.now();
        }, 1400);
      } else {
        setMultiplier(m);
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crashPoint, reduce]);

  const progress = Math.min((multiplier - 1) / (crashPoint - 1), 1);

  return (
    <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-6">
      <p className="text-center text-xs tracking-[0.2em] text-[var(--faint)]">محاكاة توضيحية — ليست نتيجة حقيقية</p>

      <div className="relative mt-4 h-48 overflow-hidden rounded-2xl bg-[var(--bg-deep)]">
        {/* منحنى الصعود */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 200 100" preserveAspectRatio="none">
          <motion.path
            d={`M 10 90 Q ${10 + progress * 90} ${90 - progress * 60}, ${10 + progress * 180} ${90 - progress * 75}`}
            fill="none"
            stroke={phase === 'crashed' ? 'oklch(63% 0.19 25)' : 'oklch(71% 0.165 128)'}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>

        {/* رمز الطائرة */}
        <motion.div
          className="absolute text-2xl"
          style={{ left: `${5 + progress * 82}%`, bottom: `${8 + progress * 62}%` }}
          animate={phase === 'crashed' ? { opacity: 0, scale: 0.5 } : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          ✈️
        </motion.div>

        {/* المضاعف */}
        <div className="absolute inset-x-0 top-4 text-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={phase}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`font-[var(--font-display)] text-4xl font-bold ${
                phase === 'crashed' ? 'text-[var(--red)]' : 'text-[var(--lime-bright)]'
              }`}
            >
              {multiplier.toFixed(2)}x
            </motion.p>
          </AnimatePresence>
          {phase === 'crashed' && <p className="mt-1 text-sm font-bold text-[var(--red)]">طارت! 💥</p>}
        </div>
      </div>

      <p className="mt-4 text-center text-sm leading-[1.6] text-[var(--muted)]">
        المضاعف يصعد باستمرار — تسحب أرباحك متى ما أردت قبل أن "تطير" الطائرة. كل جولة عشوائية بالكامل ولا يمكن توقّعها.
      </p>
    </div>
  );
}

/* ----------------------------------- FAQ ----------------------------------- */

const faqs = [
  { q: 'لعبة الطيارة عادلة؟ مو مُتلاعب فيها؟', a: 'اللعبة تعمل بنظام RNG (توليد أرقام عشوائي) معتمد، ونتيجة كل جولة تُحدَّد عشوائياً بشكل مستقل عن الجولات السابقة — لا يوجد "نمط" يمكن توقّعه أو استغلاله.' },
  { q: 'أقدر أجرّبها مجاناً قبل المراهنة بفلوس حقيقية؟', a: 'أغلب المنصات توفر وضع تجريبي (Demo) لتجربة الآلية بدون مخاطرة مالية — تحقق من توفره في حسابك قبل المراهنة الحقيقية.' },
  { q: 'شكد الحد الأدنى للرهان بلعبة الطيارة؟', a: 'يختلف حسب المنصة، لكنه عادة منخفض جداً (أقل من 1000 دينار) — راجع الحد المعروض داخل اللعبة نفسها قبل البدء.' },
  { q: 'فيه استراتيجية مضمونة للربح؟', a: 'لا. هذه لعبة حظ بحتة تعتمد على أرقام عشوائية — أي "استراتيجية" مُروَّج لها بالإنترنت لا تضمن ربحاً، والمنصة دائماً لها هامش ربح إحصائي (House Edge). لا تراهن معتقداً أن هناك طريقة مضمونة.' },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-2.5">
      {faqs.map((item, i) => {
        const isOpen = open === i;
        return (
          <Reveal key={i} delay={i * 0.05}>
            <div className={`overflow-hidden rounded-2xl border transition-colors duration-200 ${isOpen ? 'border-[oklch(72%_0.12_242/0.4)] bg-[var(--surface)]' : 'border-[var(--line)]'}`}>
              <button onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen}
                className="focus-ring flex min-h-[56px] w-full items-center justify-between gap-4 px-5 py-4 text-right">
                <span className="font-bold text-[var(--ink)]">{item.q}</span>
                <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--raised)] text-lg font-bold text-[var(--ink)]" aria-hidden>+</motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: EASE }}>
                    <p className="px-5 pb-5 leading-[1.6] text-[var(--muted)]">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}

/* ---------------------------------- الصفحة ---------------------------------- */

export default function Page() {
  const reduce = useReducedMotion();

  return (
    <main dir="rtl" lang="ar"
      className={`${display.variable} ${body.variable} min-h-screen bg-[var(--bg)] font-[var(--font-body)] text-[var(--ink)] antialiased`}>
      <style dangerouslySetInnerHTML={{ __html: tokens }} />

      {/* ================================ HERO ================================ */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 right-[-8%] h-[440px] w-[600px] rounded-full bg-[oklch(40%_0.082_248/0.45)] blur-[120px]" />
          <div className="absolute bottom-[-25%] left-[-8%] h-[360px] w-[480px] rounded-full bg-[oklch(71%_0.165_128/0.1)] blur-[110px]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6">
          <motion.header
            initial={reduce ? false : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="flex items-center justify-between py-6">
            <BrandLogo />
            <a href="/1xbet" className="focus-ring rounded-lg px-4 py-2 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--ink)]">
              ← المراجعة الكاملة
            </a>
          </motion.header>

          <div className="grid items-center gap-12 pb-16 pt-8 md:grid-cols-[1.1fr_0.9fr] md:pb-24 md:pt-12">
            <div>
              <motion.h1
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32, delay: 0.08, ease: EASE }}
                className="font-[var(--font-display)] text-[clamp(2.3rem,6vw,3.75rem)] font-bold leading-[1.08] tracking-[-0.03em]">
                لعبة الطيارة
                <br />
                <span className="text-[var(--lime-bright)]">Aviator شرح كامل</span>
              </motion.h1>
              <motion.p
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15, ease: EASE }}
                className="mt-5 max-w-lg text-lg leading-[1.6] text-[var(--muted)]">
                آلية اللعبة، كيف تُحسب النتيجة، وأهم شيء — المخاطر الحقيقية قبل ما تراهن. لعبة حظ بحتة، لا استراتيجيات مضمونة.
              </motion.p>
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.22, ease: EASE }}
                className="mt-8">
                <PrimaryCTA big>جرّب اللعبة ←</PrimaryCTA>
              </motion.div>
            </div>

            <Reveal delay={0.2}>
              <LiveMultiplierDemo />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================ كيف تعمل اللعبة ============================ */}
      <section className="border-t border-[var(--line)] bg-[var(--bg-deep)]/40">
        <div className="mx-auto max-w-4xl px-6 py-16 md:py-24">
          <Reveal>
            <p className="text-sm font-medium tracking-[0.18em] text-[var(--sky)]">الآلية ببساطة</p>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em] md:text-4xl">شلون تلعب الطيارة؟</h2>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { n: '1', t: 'ضع رهانك', d: 'حدد المبلغ قبل بدء الجولة الجديدة — يمكنك المراهنة برهانين بنفس الوقت.' },
              { n: '2', t: 'راقب المضاعف', d: 'الطائرة تصعد والمضاعف يزيد من ×1.00 تصاعدياً — لا أحد يعرف متى "تطير".' },
              { n: '3', t: 'اسحب قبل الطيران', d: 'اضغط "سحب" في أي لحظة تريدها لتقفل أرباحك بذلك المضاعف — أو استخدم السحب التلقائي.' },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 0.07}>
                <div className="h-full rounded-[20px] border border-[var(--line)] bg-[var(--surface)] p-6">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--raised)] text-sm font-bold text-[var(--ink)]">{s.n}</span>
                  <h3 className="mt-4 font-bold text-[var(--ink)]">{s.t}</h3>
                  <p className="mt-2 leading-[1.6] text-[var(--muted)]">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ========================= تحذير المخاطر — القسم الأهم ========================= */}
      <section className="mx-auto max-w-4xl px-6 py-16 md:py-24">
        <Reveal>
          <div className="rounded-[24px] border-2 border-[oklch(63%_0.19_25/0.35)] bg-[oklch(63%_0.19_25/0.06)] p-7">
            <p className="text-sm font-bold tracking-[0.1em] text-[var(--red)]">⚠ اقرأ هذا قبل أي رهان</p>
            <h2 className="mt-3 font-[var(--font-display)] text-2xl font-bold tracking-[-0.02em] text-[var(--ink)] md:text-3xl">
              الطيارة لعبة حظ بحتة — لا يوجد نظام يضمن الربح
            </h2>
            <div className="mt-5 space-y-3 leading-[1.7] text-[var(--muted)]">
              <p>
                كل جولة تُحدَّد عشوائياً بالكامل (RNG) ومستقلة تماماً عن الجولات السابقة — لا يوجد "نمط" أو "توقيت مثالي"
                يمكن تعلّمه. أي محتوى على الإنترنت يدّعي "استراتيجية مضمونة" أو "طريقة لخداع اللعبة" غير صحيح.
              </p>
              <p>
                المنصة تملك دائماً هامش ربح إحصائي طويل الأمد (House Edge)، بمعنى أن اللعب لفترة طويلة يميل إحصائياً
                لصالح المنصة لا اللاعب. سرعة الجولات (ثوانٍ معدودة) تجعلها من أكثر الألعاب التي تحتاج انضباطاً حقيقياً
                في تحديد ميزانية مسبقة والالتزام بها.
              </p>
              <p className="font-bold text-[var(--ink)]">
                حدد مبلغاً تتحمل خسارته بالكامل قبل البدء، ولا تحاول "تعويض" خسارة سابقة برهان أكبر.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ================================ FAQ ================================ */}
      <section className="border-t border-[var(--line)] bg-[var(--bg-deep)]/40">
        <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
          <Reveal>
            <p className="text-sm font-medium tracking-[0.18em] text-[var(--sky)]">أسئلة شائعة</p>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em] md:text-4xl">قبل ما تبدأ</h2>
          </Reveal>
          <div className="mt-10"><FAQ /></div>
        </div>
      </section>

      {/* =============================== خاتمة CTA =============================== */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <Reveal>
          <h2 className="font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em] md:text-4xl">جاهز تجرّب؟</h2>
          <div className="mt-8 flex justify-center"><PrimaryCTA big>سجّل وجرّب الطيارة ←</PrimaryCTA></div>
          <p className="mt-4 text-sm text-[var(--faint)]">راهن بمسؤولية — حدد ميزانيتك مسبقاً</p>
        </Reveal>
      </section>

      <RelatedLinks current="/1xbet/aviator" />

      {/* =============================== الفوتر =============================== */}
      <footer className="border-t border-[var(--line)] bg-[var(--bg-deep)] px-6 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 text-center">
          <BrandLogo className="scale-90 opacity-70" />
          <p className="max-w-3xl text-sm leading-[1.6] text-[var(--faint)]">
            ⚠️ إخلاء مسؤولية: موقع معلوماتي مستقل لأغراض المراجعة، لا يمثل العلامة التجارية 1xBet رسمياً. المراهنات لمن هم 18 عاماً فأكثر. لعبة الطيارة تعتمد كلياً على الحظ العشوائي (RNG) — لا توجد استراتيجية تضمن الربح، والمنصة تملك هامش ربح إحصائي دائم. لا تراهن بأموال لا تتحمل خسارتها، ولا تحاول تعويض الخسائر برهانات أكبر. للعب المسؤول: حدد ميزانيتك مسبقاً والتزم بها، وتوقف فوراً إن شعرت أن المراهنة تخرج عن سيطرتك.
          </p>
        </div>
      </footer>
    </main>
  );
}
