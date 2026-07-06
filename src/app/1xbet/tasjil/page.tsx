'use client';

/**
 * 1xBet العراق — صفحة التسجيل خطوة بخطوة  (/1xbet/tasjil)
 * Next.js 15 (App Router) + Tailwind + Framer Motion
 *
 * ملاحظة مصطلحات: "الرمز الترويجي" / "البرومو كود" فقط — أبداً "كود الخصم".
 * العنصر المميز: بطاقات اختيار طريقة كبيرة (2×2) + خطوات ديناميكية
 * تتبدّل حسب الاختيار — سادس تنويع بصري في السيلو.
 */

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Changa, IBM_Plex_Sans_Arabic } from 'next/font/google';
import RelatedLinks from '../RelatedLinks';

const display = IBM_Plex_Sans_Arabic({ subsets: ['arabic'], weight: ['500', '600', '700'], variable: '--font-display' });
const body = Changa({ subsets: ['arabic'], weight: ['400', '500', '600'], variable: '--font-body' });

const AFF_LINK = 'https://dub.sh/fP9V2WH';
const PROMO_CODE = 'X9GO';
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

/* --------------------------- بيانات طرق التسجيل (حقيقية) --------------------------- */

const methods = [
  {
    id: 'code',
    name: 'عن طريق الرمز',
    tag: 'الأسرع',
    featured: true,
    steps: [
      'اضغط "التسجيل" ← اختر "عن طريق الرمز"',
      'اختر الدولة: العراق — والعملة: الدينار (IQD)',
      `أدخل الرمز الترويجي ${PROMO_CODE} في الخانة المخصصة`,
      'يُنشئ الموقع رقم حساب وكلمة مرور تلقائياً — احفظهما فوراً بلقطة شاشة',
    ],
  },
  {
    id: 'phone',
    name: 'عن طريق الهاتف',
    tag: 'الأكثر أماناً',
    featured: false,
    steps: [
      'أدخل رقمك العراقي (آسيا سيل، زين، أو كورك)',
      'أكّد رمز SMS الذي يصلك خلال ثوانٍ',
      'اختر العملة IQD وأدخل الرمز الترويجي',
      'حسابك جاهز — يسهل استرجاعه لاحقاً بنفس الرقم',
    ],
  },
  {
    id: 'email',
    name: 'عبر البريد الإلكتروني',
    tag: 'تحكم كامل',
    featured: false,
    steps: [
      'أدخل بريدك الإلكتروني وكلمة مرور من اختيارك',
      'اختر الدولة والعملة (IQD)',
      'أدخل الرمز الترويجي بالخانة المخصصة قبل التأكيد',
      'فعّل حسابك عبر رابط التأكيد المُرسَل لبريدك',
    ],
  },
  {
    id: 'social',
    name: 'الشبكات الاجتماعية',
    tag: 'بدون كلمة مرور',
    featured: false,
    steps: [
      'اختر "التسجيل عبر الشبكات الاجتماعية"',
      'حدد حسابك وامنح الإذن',
      'اختر الدولة والعملة (IQD)',
      'حسابك جاهز فوراً — لا حاجة لتذكّر كلمة مرور جديدة',
    ],
  },
];

/* ------------------------------ بطاقات اختيار الطريقة ------------------------------ */

function MethodSelector() {
  const [active, setActive] = useState(methods[0].id);
  const current = methods.find((m) => m.id === active)!;
  const reduce = useReducedMotion();

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {methods.map((m) => {
          const isActive = m.id === active;
          return (
            <button
              key={m.id}
              onClick={() => setActive(m.id)}
              className={`focus-ring rounded-2xl border p-4 text-right transition-colors duration-200 ${
                isActive
                  ? 'border-[var(--lime)] bg-[oklch(71%_0.165_128/0.12)]'
                  : 'border-[var(--line)] hover:bg-[oklch(97%_0.01_250/0.03)]'
              }`}
            >
              {m.featured && (
                <span className="mb-2 inline-block rounded-full bg-[oklch(71%_0.165_128/0.18)] px-2.5 py-0.5 text-xs font-bold text-[var(--lime-bright)]">
                  {m.tag}
                </span>
              )}
              <p className={`font-bold ${isActive ? 'text-[var(--lime-bright)]' : 'text-[var(--ink)]'}`}>{m.name}</p>
              {!m.featured && <p className="mt-1 text-xs text-[var(--faint)]">{m.tag}</p>}
            </button>
          );
        })}
      </div>

      <div className="relative mt-6 min-h-[300px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-7"
          >
            <h3 className="font-[var(--font-display)] text-xl font-bold text-[var(--ink)]">{current.name}</h3>
            <ol className="mt-6 space-y-4">
              {current.steps.map((s, i) => (
                <li key={i} className="flex gap-3.5">
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-sm font-bold ${
                      current.featured ? 'bg-[var(--lime)] text-[var(--bg-deep)]' : 'bg-[var(--raised)] text-[var(--ink)]'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="leading-[1.6] text-[var(--muted)]">{s}</span>
                </li>
              ))}
            </ol>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ----------------------------------- FAQ ----------------------------------- */

const faqs = [
  { q: 'وين أدخل الرمز الترويجي أثناء التسجيل؟', a: 'يظهر خانة "الرمز الترويجي" أسفل نموذج التسجيل في أغلب الطرق (الرمز، الهاتف، البريد الإلكتروني). أدخل X9GO فيها قبل الضغط على "تسجيل" — لا يمكن إضافته بعد إنشاء الحساب. تفاصيل كاملة على صفحة الرمز الترويجي.' },
  { q: 'ليش التسجيل يفشل ويرفض بياناتي؟', a: 'أشهر الأسباب: رقم الهاتف أو البريد الإلكتروني مستخدم مسبقاً بحساب آخر، أو إدخال عمر أقل من 18 عاماً. تأكد من صحة بياناتك وعدم وجود حساب سابق بنفس الرقم أو البريد.' },
  { q: 'أي طريقة تسجيل الأسرع؟', a: '"عن طريق الرمز" هي الأسرع — يُنشئ الموقع رقم حساب وكلمة مرور تلقائياً خلال ثوانٍ. الطرق الأخرى (هاتف، بريد إلكتروني) تستغرق دقيقة أو دقيقتين إضافيتين للتحقق.' },
  { q: 'أقدر أغيّر طريقة الدخول لاحقاً؟', a: 'نعم، يمكنك لاحقاً من إعدادات الحساب ربط بريد إلكتروني أو رقم هاتف إضافي حتى لو سجّلت بطريقة "الرمز" بالبداية — يساعد هذا على استرجاع الحساب بسهولة أكبر مستقبلاً.' },
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
                التسجيل في 1xBet
                <br />
                <span className="text-[var(--lime-bright)]">بأربع طرق مختلفة</span>
              </motion.h1>
              <motion.p
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15, ease: EASE }}
                className="mt-5 max-w-lg text-lg leading-[1.6] text-[var(--muted)]">
                اختر الطريقة المناسبة لك — كلها تأخذ أقل من دقيقتين. لا تنسَ الرمز الترويجي{' '}
                <strong className="font-bold text-[var(--lime-bright)]">{PROMO_CODE}</strong> أثناء التسجيل لمضاعفة مكافأتك.
              </motion.p>
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.22, ease: EASE }}
                className="mt-8">
                <PrimaryCTA big>سجّل الآن ←</PrimaryCTA>
              </motion.div>
            </div>

            <Reveal delay={0.2}>
              <MethodSelector />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line)] bg-[var(--bg-deep)]/40">
        <div className="mx-auto max-w-4xl px-6 py-14 text-center md:py-20">
          <Reveal>
            <p className="text-sm font-medium tracking-[0.18em] text-[var(--sky)]">لا تنسَ هذه الخطوة</p>
            <h2 className="mt-3 font-[var(--font-display)] text-2xl font-bold tracking-[-0.02em] md:text-3xl">
              أدخل الرمز الترويجي <span className="text-[var(--lime-bright)]">{PROMO_CODE}</span> قبل إتمام التسجيل
            </h2>
            <p className="mx-auto mt-4 max-w-xl leading-[1.6] text-[var(--muted)]">
              الخانة تظهر مرة واحدة فقط أثناء إنشاء الحساب — بعدها لا يمكن إضافته. شرح تفصيلي وشروط المكافأة{' '}
              <a href="/1xbet/promo-code" className="font-bold text-[var(--sky)] underline decoration-[oklch(72%_0.12_242/0.4)] underline-offset-4 hover:text-[var(--lime-bright)]">
                على صفحة الرمز الترويجي
              </a>.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <Reveal>
          <p className="text-sm font-medium tracking-[0.18em] text-[var(--amber)]">تجنّب هذه الأخطاء</p>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em] md:text-4xl">ليش التسجيل يفشل أحياناً؟</h2>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            { t: 'رقم أو بريد مُستخدم مسبقاً', d: 'كل رقم هاتف وبريد إلكتروني يُستخدم لحساب واحد فقط — تأكد أنك لم تسجّل من قبل.' },
            { t: 'العمر أقل من 18', d: 'المنصة تتطلب إثبات عمر 18 عاماً فأكثر — أدخل تاريخ ميلادك الحقيقي.' },
            { t: 'نسيان الرمز الترويجي', d: 'إذا أتممت التسجيل بدون الرمز، لا يمكن إضافته لاحقاً — راجع الخطوات أعلاه بعناية.' },
          ].map((c, i) => (
            <Reveal key={c.t} delay={i * 0.07}>
              <div className="h-full rounded-[20px] border border-[var(--line)] bg-[var(--surface)] p-6">
                <h3 className="font-bold text-[var(--ink)]">{c.t}</h3>
                <p className="mt-2 leading-[1.6] text-[var(--muted)]">{c.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-t border-[var(--line)] bg-[var(--bg-deep)]/40">
        <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
          <Reveal>
            <p className="text-sm font-medium tracking-[0.18em] text-[var(--sky)]">أسئلة التسجيل</p>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em] md:text-4xl">قبل ما تبدأ</h2>
          </Reveal>
          <div className="mt-10"><FAQ /></div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <Reveal>
          <h2 className="font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em] md:text-4xl">جاهز تسجّل؟</h2>
          <div className="mt-8 flex justify-center"><PrimaryCTA big>سجّل الآن ←</PrimaryCTA></div>
          <p className="mt-4 text-sm text-[var(--faint)]">لا تنسَ الرمز الترويجي {PROMO_CODE}</p>
        </Reveal>
      </section>

      <RelatedLinks current="/1xbet/tasjil" />

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
