'use client';

import RelatedLinks from '../RelatedLinks';

/**
 * 1xBet العراق — صفحة طرق الإيداع  (/1xbet/idaa)
 * Next.js 15 (App Router) + Tailwind + Framer Motion
 *
 * العنصر المميز: مبدّل طرق الدفع (Method Switcher) — تفاعلي، يختلف
 * بصرياً عن قسيمة الرهان (rabit-jadid) وبطاقة التطبيق (tahmil-apk).
 */

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Changa, IBM_Plex_Sans_Arabic } from 'next/font/google';

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

/* --------------------------- بيانات طرق الإيداع --------------------------- */

const methods = [
  {
    id: 'zaincash',
    name: 'زين كاش',
    min: '14,000 IQD تقريباً',
    speed: 'فوري',
    steps: [
      'ادخل حسابك ← "الإيداع" ← اختر زين كاش',
      'أدخل المبلغ ورقم محفظة زين كاش (نفس رقم هاتفك)',
      'أكّد العملية من تطبيق زين كاش عبر رمز التحقق',
      'الرصيد يظهر بحسابك خلال ثوانٍ',
    ],
    tip: 'أشهر طريقة إيداع بالعراق — الأسرع والأقل تعقيداً.',
  },
  {
    id: 'asiacell',
    name: 'آسيا سيل',
    min: '14,000 IQD تقريباً',
    speed: 'فوري',
    steps: [
      'اختر "آسيا حوالة" من قائمة طرق الإيداع',
      'أدخل رقم هاتفك المسجّل بآسيا سيل والمبلغ',
      'أكّد عبر رسالة SMS تصلك',
      'الرصيد يُضاف فوراً لحسابك',
    ],
    tip: 'مثالي إذا كان رقمك الأساسي من آسيا سيل.',
  },
  {
    id: 'fib',
    name: 'FIB',
    min: 'يعتمد على حسابك المصرفي',
    speed: 'فوري غالباً',
    steps: [
      'اختر "FIB — مصرف العراق الأول" كطريقة إيداع',
      'سجّل دخولك لتطبيق FIB لتأكيد التحويل',
      'أدخل المبلغ وأكّد العملية من التطبيق',
      'الرصيد يظهر بحسابك خلال دقائق',
    ],
    tip: 'مناسب للمبالغ الأكبر التي تفضّل تحويلها من حساب مصرفي.',
  },
  {
    id: 'fastpay',
    name: 'الفاست بي',
    min: 'منخفض',
    speed: 'فوري',
    steps: [
      'اشحن رصيدك عبر وكيل الفاست بي القريب منك',
      'اختر "الفاست بي" من طرق الإيداع بالموقع',
      'أدخل كود الشحن والمبلغ',
      'تأكيد فوري وإضافة الرصيد',
    ],
    tip: 'خيار جيد إذا كنت تفضّل الشحن عبر الوكلاء المحليين.',
  },
  {
    id: 'usdt',
    name: 'USDT',
    min: 'مرن حسب رغبتك',
    speed: '5–15 دقيقة',
    steps: [
      'انسخ عنوان محفظة USDT الخاص بحسابك من صفحة الإيداع',
      'أرسل المبلغ من حساب OKX أو Binance لنفس العنوان',
      'انتظر تأكيد الشبكة (عادة دقائق قليلة)',
      'الرصيد يُضاف تلقائياً بعد التأكيد',
    ],
    tip: 'الأنسب للمبالغ الكبيرة — بلا حدود مصرفية أو رقابة تحويل.',
  },
];

/* ------------------------------ مبدّل الطرق ------------------------------ */

function MethodSwitcher() {
  const [active, setActive] = useState(methods[0].id);
  const current = methods.find((m) => m.id === active)!;
  const reduce = useReducedMotion();

  return (
    <div>
      {/* شرائح الاختيار */}
      <div className="flex flex-wrap gap-2.5" role="tablist">
        {methods.map((m) => {
          const isActive = m.id === active;
          return (
            <button
              key={m.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(m.id)}
              className={`focus-ring rounded-xl border px-5 py-2.5 text-sm font-bold transition-colors duration-200 ${
                isActive
                  ? 'border-[var(--lime)] bg-[oklch(71%_0.165_128/0.15)] text-[var(--lime-bright)]'
                  : 'border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              {m.name}
            </button>
          );
        })}
      </div>

      {/* اللوحة النشطة */}
      <div className="relative mt-6 min-h-[360px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-7"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="font-[var(--font-display)] text-2xl font-bold text-[var(--ink)]">{current.name}</h3>
              <div className="flex gap-2">
                <span className="rounded-full bg-[var(--raised)] px-3 py-1 text-xs font-medium text-[var(--muted)]">
                  أقل إيداع: {current.min}
                </span>
                <span className="rounded-full bg-[oklch(71%_0.165_128/0.15)] px-3 py-1 text-xs font-bold text-[var(--lime-bright)]">
                  {current.speed}
                </span>
              </div>
            </div>

            <ol className="mt-6 space-y-4">
              {current.steps.map((s, i) => (
                <li key={i} className="flex gap-3.5">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--raised)] text-sm font-bold text-[var(--ink)]">
                    {i + 1}
                  </span>
                  <span className="leading-[1.6] text-[var(--muted)]">{s}</span>
                </li>
              ))}
            </ol>

            <p className="mt-6 border-r-2 border-[var(--sky)] pr-4 text-sm text-[var(--muted)]">{current.tip}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ----------------------------------- FAQ ----------------------------------- */

const faqs = [
  { q: 'شكد الحد الأدنى للإيداع؟', a: 'يبدأ من حوالي 1,400 دينار لبعض الطرق، لكن لتفعيل المكافأة الترحيبية الكاملة تحتاج إيداعاً لا يقل عن 14,000 دينار تقريباً.' },
  { q: 'شلون أسوي إيداع بزين كاش؟', a: 'من حسابك اختر "الإيداع" ← "زين كاش"، أدخل رقم محفظتك والمبلغ، وأكّد من تطبيق زين كاش. الرصيد يضاف خلال ثوانٍ.' },
  { q: 'ليش الإيداع ما يوصل لحسابي؟', a: 'أغلب الحالات سببها اختلاف رقم المحفظة عن رقم الهاتف المسجّل بالحساب، أو تأخر مؤقت من مزود الدفع. تأكد من تطابق الأرقام، وإذا استمرت المشكلة تواصل مع الدعم المباشر بالموقع.' },
  { q: 'أقدر أسوي إيداع بعملات رقمية؟', a: 'نعم، عبر USDT من محفظة OKX أو Binance مباشرة لعنوان محفظتك بالموقع — يستغرق عادة من 5 إلى 15 دقيقة حسب سرعة تأكيد الشبكة.' },
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
              <motion.div
                initial={false}
                animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.28, ease: EASE }}
                style={{ overflow: 'hidden' }}
                aria-hidden={!isOpen}
              >
                <p className="px-5 pb-5 leading-[1.6] text-[var(--muted)]">{item.a}</p>
              </motion.div>
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

          <div className="mx-auto max-w-3xl pb-16 pt-8 text-center md:pb-20 md:pt-12">
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05, ease: EASE }}
              className="flex flex-wrap justify-center gap-2">
              {['زين كاش', 'آسيا سيل', 'FIB', 'USDT'].map((tag) => (
                <span key={tag} className="rounded-full border border-[var(--line)] bg-[oklch(97%_0.01_250/0.04)] px-3.5 py-1.5 text-sm font-medium text-[var(--muted)]">
                  {tag}
                </span>
              ))}
            </motion.div>

            <motion.h1
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: 0.1, ease: EASE }}
              className="mt-6 font-[var(--font-display)] text-[clamp(2.3rem,6vw,3.75rem)] font-bold leading-[1.08] tracking-[-0.03em]">
              طرق الإيداع في 1xBet
              <br />
              <span className="text-[var(--lime-bright)]">خطوة بخطوة</span>
              <span className="text-[var(--muted)]"> — لكل طريقة دفع</span>
            </motion.h1>

            <motion.p
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.16, ease: EASE }}
              className="mx-auto mt-5 max-w-xl text-lg leading-[1.6] text-[var(--muted)]">
              اختر طريقتك بالأسفل واتبع الخطوات — زين كاش وآسيا سيل فوريان، وFIB وUSDT لمن يفضّل التحويل المصرفي أو العملات الرقمية.
            </motion.p>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.22, ease: EASE }}
              className="mt-8 flex justify-center">
              <PrimaryCTA big>سجّل وابدأ الإيداع ←</PrimaryCTA>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================= مبدّل طرق الإيداع ========================= */}
      <section className="mx-auto max-w-4xl px-6 py-16 md:py-24">
        <Reveal>
          <p className="text-sm font-medium tracking-[0.18em] text-[var(--sky)]">اختر طريقتك</p>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em] md:text-4xl">شلون تسوي الإيداع؟</h2>
        </Reveal>
        <div className="mt-10"><MethodSwitcher /></div>
      </section>

      {/* ========================= ليش الإيداع ما يوصل؟ ========================= */}
      <section className="border-t border-[var(--line)] bg-[var(--bg-deep)]/40">
        <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
          <Reveal>
            <p className="text-sm font-medium tracking-[0.18em] text-[var(--amber)]">مشكلة شائعة</p>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em] md:text-4xl">ليش الإيداع أحياناً ما يوصل؟</h2>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { t: 'اختلاف رقم المحفظة', d: 'أشهر سبب — رقم زين كاش أو آسيا سيل يجب يطابق رقم هاتفك المسجّل بالضبط.' },
              { t: 'تأخر مؤقت من المزود', d: 'أحياناً يتأخر التأكيد دقائق قليلة بسبب ازدحام الشبكة — انتظر قبل إعادة المحاولة.' },
              { t: 'مبلغ أقل من الحد الأدنى', d: 'تأكد أن المبلغ يفوق الحد الأدنى للطريقة المختارة قبل الإرسال.' },
            ].map((c, i) => (
              <Reveal key={c.t} delay={i * 0.07}>
                <div className="h-full rounded-[20px] border border-[var(--line)] bg-[var(--surface)] p-6">
                  <h3 className="font-bold text-[var(--ink)]">{c.t}</h3>
                  <p className="mt-2 leading-[1.6] text-[var(--muted)]">{c.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.2}>
            <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-[var(--faint)]">
              إذا استمرت المشكلة رغم التحقق من كل ما سبق، تواصل مع الدعم المباشر داخل حسابك — عادة يُحل خلال دقائق.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ================================ FAQ ================================ */}
      <section className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <Reveal>
          <p className="text-sm font-medium tracking-[0.18em] text-[var(--sky)]">أسئلة سريعة</p>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em] md:text-4xl">قبل ما تودّع</h2>
        </Reveal>
        <div className="mt-10"><FAQ /></div>
      </section>

      {/* =============================== خاتمة CTA =============================== */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <Reveal>
          <h2 className="font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em] md:text-4xl">جاهز تودّع وتبدأ؟</h2>
          <div className="mt-8 flex justify-center"><PrimaryCTA big>سجّل الآن ←</PrimaryCTA></div>
          <p className="mt-4 text-sm text-[var(--faint)]">زين كاش وآسيا سيل: إيداع فوري خلال ثوانٍ</p>
        </Reveal>
      </section>

      <RelatedLinks current="/1xbet/idaa" />

      {/* =============================== الفوتر =============================== */}
      <footer className="border-t border-[var(--line)] bg-[var(--bg-deep)] px-6 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 text-center">
          <BrandLogo className="scale-90 opacity-70" />
          <p className="max-w-3xl text-sm leading-[1.6] text-[var(--faint)]">
            ⚠️ إخلاء مسؤولية: موقع معلوماتي مستقل لأغراض المراجعة، لا يمثل العلامة التجارية 1xBet رسمياً. المراهنات لمن هم 18 عاماً فأكثر. المراهنة تنطوي على مخاطر مالية — لا تراهن بأموال لا تتحمل خسارتها. للعب المسؤول: حدد ميزانيتك والتزم بها.
          </p>
          <a href="/about" className="text-xs text-[var(--faint)] underline underline-offset-4 hover:text-[var(--muted)]">
            من نحن وسياسة الإفصاح
          </a>
        </div>
      </footer>
    </main>
  );
}
