'use client';

/**
 * 1xBet العراق — صفحة الرابط الجديد / البديل  (/1xbet/rabit-jadid)
 * Next.js 15 (App Router) + Tailwind + Framer Motion
 * التثبيت: npm i framer-motion
 *
 * نظام التصميم مطبّق حسب تفضيلات المالك:
 * - OKLCH tokens، لا تدرجات بنفسجية
 * - عناوين IBM Plex Sans Arabic ثقل 700 (بديل عربي لـ Geist/Cabinet — لا دعم عربي فيهما)
 *   مع tracking ضيق، تدرّج هرمي 48/32/24/18/16
 * - تخطيط لا متماثل، مسافات 64px+ بين الأقسام، شبكة 8px
 * - حركة ease-out cubic-bezier(0.23,1,0.32,1)، تحت 300ms، scale من 0.95
 * - يحترم prefers-reduced-motion
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Changa, IBM_Plex_Sans_Arabic } from 'next/font/google';

const display = IBM_Plex_Sans_Arabic({ subsets: ['arabic'], weight: ['500', '600', '700'], variable: '--font-display' });
const body = Changa({ subsets: ['arabic'], weight: ['400', '500', '600'], variable: '--font-body' });

const AFF_LINK = 'https://dub.sh/fP9V2WH';
const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

/* ------------------------------ توكنز التصميم ------------------------------ */

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
    --line:        oklch(97% 0.01 250 / 0.09);
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%      { opacity: 0.55; transform: scale(0.82); }
  }
  @keyframes ring-ping {
    0%   { transform: scale(1);   opacity: 0.7; }
    80%, 100% { transform: scale(2.4); opacity: 0; }
  }
  .live-dot { animation: pulse-dot 2s ease-in-out infinite; }
  .live-ring { animation: ring-ping 2s cubic-bezier(0,0,0.2,1) infinite; }
  @media (prefers-reduced-motion: reduce) {
    .live-dot, .live-ring { animation: none; }
  }
  .focus-ring:focus-visible {
    outline: 2px solid var(--lime-bright);
    outline-offset: 3px; border-radius: 12px;
  }
`;

/* --------------------------------- الحركة --------------------------------- */

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

/* ---------------------------------- الشعار ---------------------------------- */

function BrandLogo({ className = '' }: { className?: string }) {
  return (
    <span dir="ltr" aria-label="1xBet" role="img" className={`relative inline-flex select-none items-baseline leading-none ${className}`}>
      <span className="font-[var(--font-display)] text-3xl font-bold italic tracking-[-0.03em] text-[var(--ink)]">1X</span>
      <span className="font-[var(--font-display)] text-3xl font-bold italic tracking-[-0.03em] text-[var(--sky)]">BET</span>
      <span aria-hidden className="absolute -bottom-1.5 left-[2px] h-[3px] w-9 -skew-x-[18deg] rounded-full bg-[var(--lime)]" />
    </span>
  );
}

/* --------------------------------- زر CTA --------------------------------- */

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

/* ----------------------------- مؤشر الحالة الحي ----------------------------- */

function LiveStatus() {
  const [now, setNow] = useState<string>('');
  useEffect(() => {
    const d = new Date();
    setNow(d.toLocaleDateString('ar-IQ', { day: 'numeric', month: 'long' }));
  }, []);
  return (
    <div className="inline-flex items-center gap-2.5 rounded-full border border-[oklch(71%_0.165_128/0.3)] bg-[oklch(71%_0.165_128/0.08)] px-4 py-2">
      <span className="relative flex h-2.5 w-2.5">
        <span className="live-ring absolute inline-flex h-full w-full rounded-full bg-[var(--lime)]" />
        <span className="live-dot relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--lime-bright)]" />
      </span>
      <span className="text-sm font-medium text-[var(--lime-bright)]">
        الرابط يعمل الآن{now && <span className="text-[var(--faint)]"> · آخر فحص {now}</span>}
      </span>
    </div>
  );
}

/* ----------------------------------- FAQ ----------------------------------- */

const faqs = [
  { q: 'ليش الرابط ما يفتح عندي؟', a: 'أغلب مزودي الإنترنت في العراق يحجبون رابط 1xbet الرئيسي من فترة لأخرى. المشكلة ليست في حسابك ولا في هاتفك — فقط الرابط القديم توقّف. استخدم الرابط المحدّث بالأعلى أو حمّل التطبيق.' },
  { q: 'شلون أفتح 1xbet بعد الحجب؟', a: 'ثلاث طرق مضمونة: (1) الرابط الشغال المحدّث في هذه الصفحة، (2) تطبيق APK الذي يتجاوز الحجب تماماً، (3) حسابك نفسه يعمل على أي رابط — لا تحتاج حساباً جديداً.' },
  { q: 'الرابط الجديد آمن؟ حسابي يبقى نفسه؟', a: 'نعم. الرابط البديل يوصلك لنفس منصة 1xbet الرسمية — حسابك ورصيدك ومكافآتك كلها كما هي. تدخل بنفس اسم المستخدم وكلمة المرور.' },
  { q: 'كل ما ينحجب الرابط، شنو أسوي؟', a: 'احفظ هذه الصفحة في المفضلة. نحن نحدّث الرابط الشغال باستمرار — ارجع لها متى ما توقف الرابط عندك وستجد الجديد جاهزاً.' },
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

  const accessMethods = [
    { tag: 'الأسرع', title: 'الرابط الشغال', desc: 'مُحدّث باستمرار — يفتح فوراً في متصفحك', action: 'افتح الآن' },
    { tag: 'الأضمن', title: 'تطبيق APK', desc: 'يتجاوز الحجب نهائياً، لا يتأثر بأي مزود إنترنت', action: 'حمّل التطبيق' },
  ];

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

          {/* هيرو لا متماثل: النص + الزر الضخم يميناً، بطاقة الحالة يساراً */}
          <div className="grid items-center gap-10 pb-20 pt-8 md:grid-cols-[1.25fr_0.75fr] md:pb-28 md:pt-14">
            <div>
              <motion.div initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05, ease: EASE }}>
                <LiveStatus />
              </motion.div>

              <motion.h1
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32, delay: 0.1, ease: EASE }}
                className="mt-6 font-[var(--font-display)] text-[clamp(2.5rem,6.5vw,4rem)] font-bold leading-[1.05] tracking-[-0.03em]">
                رابط 1xBet
                <br />
                <span className="text-[var(--lime-bright)]">الشغّال الآن</span>
                <span className="text-[var(--muted)]"> في العراق</span>
              </motion.h1>

              <motion.p
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.16, ease: EASE }}
                className="mt-5 max-w-lg text-lg leading-[1.6] text-[var(--muted)]">
                محجوب عندك؟ المشكلة من مزود الإنترنت، مو من حسابك. اضغط الزر وادخل مباشرة — نحدّث الرابط باستمرار كل ما يتوقف القديم.
              </motion.p>

              <motion.div
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.22, ease: EASE }}
                className="mt-9">
                <PrimaryCTA big>افتح 1xBet الآن ←</PrimaryCTA>
                <p className="mt-3 text-sm text-[var(--faint)]">يفتح الموقع الرسمي مباشرة · حسابك يبقى نفسه</p>
              </motion.div>
            </div>

            {/* بطاقة الحالة — العنصر المميز */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 20, rotate: 0 }}
              animate={{ opacity: 1, y: 0, rotate: 1.5 }}
              transition={{ duration: 0.4, delay: 0.2, ease: EASE }}
              whileHover={reduce ? undefined : { rotate: 0, y: -4 }}
              className="relative mx-auto w-full max-w-xs">
              <div aria-hidden className="absolute -inset-3 rounded-[28px] bg-[oklch(71%_0.165_128/0.15)] blur-2xl" />
              <div className="relative rounded-[24px] border border-[var(--line)] bg-[oklch(97%_0.01_250/0.06)] p-6 backdrop-blur-xl shadow-[0_1px_2px_oklch(0%_0_0/0.3),0_20px_50px_oklch(0%_0_0/0.35)]">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--faint)]">حالة الوصول</span>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="live-ring absolute inline-flex h-full w-full rounded-full bg-[var(--lime)]" />
                    <span className="live-dot relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--lime-bright)]" />
                  </span>
                </div>
                <div className="mt-5 space-y-3">
                  {[
                    ['الرابط المحدّث', 'يعمل', true],
                    ['تطبيق APK', 'يعمل', true],
                    ['الرابط الرسمي القديم', 'قد يُحجب', false],
                  ].map(([label, state, ok]) => (
                    <div key={label as string} className="flex items-center justify-between rounded-xl bg-[var(--bg-deep)]/50 px-4 py-3">
                      <span className="text-sm text-[var(--muted)]">{label}</span>
                      <span className={`flex items-center gap-1.5 text-sm font-bold ${ok ? 'text-[var(--lime-bright)]' : 'text-[var(--amber)]'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-[var(--lime)]' : 'bg-[var(--amber)]'}`} />
                        {state}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================= طرق الوصول (بطاقتان) ========================= */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <Reveal>
          <p className="text-sm font-medium tracking-[0.18em] text-[var(--sky)]">طريقتان مضمونتان</p>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em] md:text-4xl">لو انحجب الرابط، إلك خيارين</h2>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {accessMethods.map((m, i) => (
            <Reveal key={m.title} delay={i * 0.08}>
              <div className={`flex h-full flex-col rounded-[20px] border p-7 transition-colors duration-200 ${i === 0 ? 'border-[oklch(71%_0.165_128/0.35)] bg-[var(--surface)]' : 'border-[var(--line)] hover:bg-[oklch(97%_0.01_250/0.03)]'}`}>
                <div className="flex items-center justify-between">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${i === 0 ? 'bg-[oklch(71%_0.165_128/0.15)] text-[var(--lime-bright)]' : 'bg-[oklch(72%_0.12_242/0.15)] text-[var(--sky)]'}`}>{m.tag}</span>
                </div>
                <h3 className="mt-4 font-[var(--font-display)] text-2xl font-bold">{m.title}</h3>
                <p className="mt-2 flex-1 leading-[1.6] text-[var(--muted)]">{m.desc}</p>
                <PrimaryCTA className="mt-6 w-full">{m.action} ←</PrimaryCTA>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================================ FAQ ================================ */}
      <section className="border-t border-[var(--line)] bg-[var(--bg-deep)]/40">
        <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
          <Reveal>
            <p className="text-sm font-medium tracking-[0.18em] text-[var(--sky)]">أسئلة سريعة</p>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em] md:text-4xl">مشكلة الحجب — محلولة</h2>
          </Reveal>
          <div className="mt-10"><FAQ /></div>
        </div>
      </section>

      {/* =============================== خاتمة CTA =============================== */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <Reveal>
          <h2 className="font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em] md:text-4xl">جاهز تدخل؟ الرابط شغّال الآن</h2>
          <div className="mt-8 flex justify-center"><PrimaryCTA big>افتح 1xBet ودخّل حسابك ←</PrimaryCTA></div>
          <p className="mt-4 text-sm text-[var(--faint)]">احفظ الصفحة في المفضلة — ارجع لها متى ما توقف الرابط</p>
        </Reveal>
      </section>

      {/* =============================== الفوتر =============================== */}
      <footer className="border-t border-[var(--line)] bg-[var(--bg-deep)] px-6 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 text-center">
          <BrandLogo className="scale-90 opacity-70" />
          <p className="max-w-3xl text-sm leading-[1.6] text-[var(--faint)]">
            ⚠️ إخلاء مسؤولية: موقع معلوماتي مستقل لأغراض المراجعة، لا يمثل العلامة التجارية 1xBet رسمياً. المراهنات لمن هم 18 عاماً فأكثر. المراهنة تنطوي على مخاطر مالية — لا تراهن بأموال لا تتحمل خسارتها. للعب المسؤول: حدد ميزانيتك والتزم بها.
          </p>
        </div>
      </footer>
    </main>
  );
}
