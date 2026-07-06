'use client';

/**
 * 1xBet العراق — صفحة طرق السحب  (/1xbet/sahb)
 * Next.js 15 (App Router) + Tailwind + Framer Motion
 *
 * البيانات (الحد الأدنى/الأقصى والحقول المطلوبة) مأخوذة مباشرة من
 * نماذج السحب الفعلية داخل التطبيق — لا أرقام مُخمَّنة.
 * العنصر المميز: شريط مقارنة سريع + بطاقات تحقق قابلة للتوسيع
 * (تنويع خامس عن السيلو — مختلف عن تبويبات idaa وقسيمة promo-code)
 */

import { useState } from 'react';
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

/* --------------------------- بيانات طرق السحب (حقيقية) --------------------------- */

const methods = [
  {
    id: 'zaincash',
    name: 'زين كاش',
    min: '7,000 IQD تقريباً',
    max: 'حتى 1,500,000 IQD',
    fields: ['رقم هاتفك المسجّل بزين كاش'],
    nameMatch: false,
    speed: 'من الأسرع — دقائق إلى ساعة',
  },
  {
    id: 'fastpay',
    name: 'الفاست بي',
    min: '7,000 IQD',
    max: '1,500,000 IQD',
    fields: ['رقم هاتفك فاست باي'],
    nameMatch: false,
    speed: 'سريع',
  },
  {
    id: 'fib',
    name: 'FIB',
    min: '5,000 IQD',
    max: '2,000,000 IQD',
    fields: ['رقم الهاتف المرتبط بحساب FIB', 'اسمك في FIB (يجب مطابقة اسم حسابك بالضبط)', 'رمز QR الخاص بحسابك على FIB'],
    nameMatch: true,
    speed: 'متوسط — يعتمد على مطابقة البيانات',
  },
  {
    id: 'asiacell',
    name: 'آسيا سيل',
    min: '7,000 IQD',
    max: '10,000 IQD فقط',
    fields: ['رقم هاتفك آسيا سيل (11 رقماً)'],
    nameMatch: false,
    speed: 'سريع، لكن بحد أقصى منخفض جداً',
    warning: true,
  },
  {
    id: 'qi',
    name: 'كي كارد (Qi)',
    min: '10,000 IQD',
    max: '1,500,000 IQD',
    fields: ['اسم صاحب البطاقة', 'رقم حساب كي', 'رقم الهاتف المرتبط بحساب كي', 'رمز QR الخاص بمحفظتك'],
    nameMatch: true,
    speed: 'متوسط — يتطلب توثيقاً إضافياً',
  },
];

/* ------------------------------ شريط المقارنة السريع ------------------------------ */

function CompareStrip() {
  return (
    <div className="-mx-6 overflow-x-auto px-6 pb-2">
      <div className="flex min-w-max gap-3">
        {methods.map((m) => (
          <div
            key={m.id}
            className={`min-w-[150px] rounded-2xl border p-4 ${
              m.warning ? 'border-[oklch(78%_0.14_75/0.4)] bg-[oklch(78%_0.14_75/0.08)]' : 'border-[var(--line)] bg-[var(--surface)]'
            }`}
          >
            <p className="font-bold text-[var(--ink)]">{m.name}</p>
            <p className="mt-2 text-xs text-[var(--faint)]">من {m.min}</p>
            <p className={`text-sm font-bold ${m.warning ? 'text-[var(--amber)]' : 'text-[var(--lime-bright)]'}`}>حتى {m.max}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ بطاقات التحقق القابلة للتوسيع ------------------------------ */

function VerificationCards() {
  const [open, setOpen] = useState<string | null>('zaincash');
  return (
    <div className="space-y-3">
      {methods.map((m) => {
        const isOpen = open === m.id;
        return (
          <div
            key={m.id}
            className={`overflow-hidden rounded-2xl border transition-colors duration-200 ${
              isOpen ? 'border-[oklch(72%_0.12_242/0.4)] bg-[var(--surface)]' : 'border-[var(--line)]'
            }`}
          >
            <button
              onClick={() => setOpen(isOpen ? null : m.id)}
              aria-expanded={isOpen}
              className="focus-ring flex min-h-[64px] w-full items-center justify-between gap-4 px-5 py-4 text-right"
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-[var(--ink)]">{m.name}</span>
                {m.nameMatch && (
                  <span className="rounded-full bg-[oklch(78%_0.14_75/0.15)] px-2.5 py-0.5 text-xs font-bold text-[var(--amber)]">
                    يتطلب مطابقة الاسم
                  </span>
                )}
              </div>
              <motion.span
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--raised)] text-lg font-bold text-[var(--ink)]"
                aria-hidden
              >
                +
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: EASE }}
                >
                  <div className="space-y-4 px-5 pb-5">
                    <div className="grid grid-cols-2 gap-3 rounded-xl bg-[var(--bg-deep)]/50 p-4 text-sm">
                      <div>
                        <p className="text-[var(--faint)]">الحد الأدنى</p>
                        <p className="font-bold text-[var(--ink)]">{m.min}</p>
                      </div>
                      <div>
                        <p className="text-[var(--faint)]">الحد الأقصى</p>
                        <p className={`font-bold ${m.warning ? 'text-[var(--amber)]' : 'text-[var(--ink)]'}`}>{m.max}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--faint)]">البيانات المطلوبة عند السحب:</p>
                      <ul className="mt-2 space-y-1.5">
                        {m.fields.map((f) => (
                          <li key={f} className="flex gap-2 text-sm leading-[1.6] text-[var(--muted)]">
                            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--lime)]" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <p className="text-sm text-[var(--faint)]">⏱ {m.speed}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/* ----------------------------------- FAQ ----------------------------------- */

const faqs = [
  { q: 'ليش آسيا سيل يحدد السحب بـ10,000 دينار بس؟', a: 'هذا حد أقصى مفروض من مزود الخدمة نفسه لآسيا سيل تحديداً، ولا علاقة له بحسابك أو رصيدك. إذا تريد سحب مبلغ أكبر، استخدم طريقة ثانية مثل زين كاش أو الفاست بي (حد أقصى 1,500,000 دينار) أو FIB (حتى 2,000,000 دينار).' },
  { q: 'شنو أسوي إذا الاسم ما يطابق بطلب السحب؟', a: 'مع FIB وكي كارد، الاسم المُدخل يجب يطابق اسم صاحب الحساب بالضبط — أي اختلاف بسيط (حتى بالتشكيل أو المسافات) قد يؤخر أو يرفض الطلب. تأكد من كتابة الاسم كما هو مسجّل بالضبط في حسابك المصرفي أو المحفظة قبل الإرسال.' },
  { q: 'أقدر أسحب لطريقة مختلفة عن اللي أودعت فيها؟', a: 'تقنياً ممكن، لكن أغلب المنصات تفضّل السحب بنفس طريقة الإيداع لتجنّب طلب توثيق إضافي. إذا أودعت بزين كاش مثلاً، السحب لزين كاش نفسها أسرع وأقل تعقيداً من التبديل لطريقة أخرى.' },
  { q: 'شكد يستغرق السحب عادة؟', a: 'يختلف حسب الطريقة: زين كاش والفاست بي من الأسرع (دقائق إلى ساعة)، بينما FIB وكي كارد قد يستغرقان وقتاً أطول بسبب خطوة التحقق من مطابقة الاسم والمستندات المرفقة.' },
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

          <div className="mx-auto max-w-3xl pb-10 pt-8 text-center md:pb-14 md:pt-12">
            <motion.h1
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: 0.08, ease: EASE }}
              className="font-[var(--font-display)] text-[clamp(2.3rem,6vw,3.75rem)] font-bold leading-[1.08] tracking-[-0.03em]">
              طرق السحب من 1xBet
              <br />
              <span className="text-[var(--lime-bright)]">بالتفصيل والحدود الحقيقية</span>
            </motion.h1>
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15, ease: EASE }}
              className="mx-auto mt-5 max-w-xl text-lg leading-[1.6] text-[var(--muted)]">
              كل طريقة سحب لها حد أدنى وأقصى مختلف، وبعضها يتطلب مطابقة الاسم بدقة. تفاصيل كل طريقة بالأسفل — بلا مفاجآت.
            </motion.p>
          </div>

          <Reveal delay={0.2}>
            <CompareStrip />
          </Reveal>

          <div className="pb-16 pt-6 text-center md:pb-24">
            <PrimaryCTA big>سجّل وابدأ السحب بسهولة ←</PrimaryCTA>
          </div>
        </div>
      </section>

      {/* ========================= بطاقات التحقق التفصيلية ========================= */}
      <section className="border-t border-[var(--line)] bg-[var(--bg-deep)]/40">
        <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
          <Reveal>
            <p className="text-sm font-medium tracking-[0.18em] text-[var(--sky)]">التفاصيل الكاملة</p>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em] md:text-4xl">شنو تحتاج لكل طريقة؟</h2>
          </Reveal>
          <div className="mt-10">
            <VerificationCards />
          </div>
        </div>
      </section>

      {/* ========================= ليش السحب يتأخر أو يُرفض؟ ========================= */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <Reveal>
          <p className="text-sm font-medium tracking-[0.18em] text-[var(--amber)]">تجنّب هذه الأخطاء</p>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em] md:text-4xl">ليش السحب يتأخر أو يُرفض؟</h2>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            { t: 'اختلاف الاسم', d: 'مع FIB وكي كارد تحديداً — الاسم يجب يطابق حسابك المصرفي بالضبط، حرفاً بحرف.' },
            { t: 'تجاوز الحد الأقصى', d: 'خصوصاً آسيا سيل (10,000 دينار فقط) — تحقق من الحد قبل طلب السحب.' },
            { t: 'رمز QR غير واضح', d: 'لـFIB وكي كارد — تأكد أن صورة الرمز واضحة وحجمها أقل من 20 ميغابايت.' },
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

      {/* ================================ FAQ ================================ */}
      <section className="border-t border-[var(--line)] bg-[var(--bg-deep)]/40">
        <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
          <Reveal>
            <p className="text-sm font-medium tracking-[0.18em] text-[var(--sky)]">أسئلة السحب</p>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em] md:text-4xl">قبل ما تطلب السحب</h2>
          </Reveal>
          <div className="mt-10"><FAQ /></div>
        </div>
      </section>

      {/* =============================== خاتمة CTA =============================== */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <Reveal>
          <h2 className="font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em] md:text-4xl">جاهز تسحب أرباحك؟</h2>
          <div className="mt-8 flex justify-center"><PrimaryCTA big>سجّل الآن ←</PrimaryCTA></div>
          <p className="mt-4 text-sm text-[var(--faint)]">اختر طريقة السحب المناسبة لك من الأعلى</p>
        </Reveal>
      </section>

      <RelatedLinks current="/1xbet/sahb" />

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
