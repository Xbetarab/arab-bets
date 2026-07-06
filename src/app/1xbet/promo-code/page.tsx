'use client';

/**
 * 1xBet العراق — صفحة الرمز الترويجي  (/1xbet/promo-code)
 * Next.js 15 (App Router) + Tailwind + Framer Motion
 *
 * العنصر المميز: قسيمة عمودية (Voucher Stub) بتثقيب علوي — رابع تنويع
 * بصري بالسيلو (قسيمة أفقية / بطاقة حالة / بطاقة تطبيق / تبويبات).
 * لا تواريخ أو أرقام متغيّرة مكتوبة يدوياً — صياغات دائمة الصحة فقط.
 */

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
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

/* ---------------------- قسيمة الرمز العمودية (العنصر المميز) ---------------------- */

function VoucherStub() {
  const [copied, setCopied] = useState(false);
  const reduce = useReducedMotion();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PROMO_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch { /* clipboard غير متاح */ }
  };

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 24, rotate: 0 }}
      animate={{ opacity: 1, y: 0, rotate: 1.5 }}
      transition={{ duration: 0.4, delay: 0.2, ease: EASE }}
      whileHover={reduce ? undefined : { rotate: 0, y: -4 }}
      className="relative mx-auto w-full max-w-[300px]"
    >
      <div aria-hidden className="absolute -inset-3 rounded-[30px] bg-[oklch(71%_0.165_128/0.18)] blur-2xl" />

      <div className="relative overflow-hidden rounded-[26px] border border-[oklch(97%_0.01_250/0.16)] bg-[oklch(97%_0.01_250/0.07)] backdrop-blur-2xl shadow-[0_1px_2px_oklch(0%_0_0/0.3),0_24px_60px_oklch(0%_0_0/0.4)]">
        {/* تثقيب علوي — اتجاه عمودي، عكس القسيمة الأفقية بالـ pillar */}
        <div className="relative flex justify-center" aria-hidden>
          <span className="absolute -top-3.5 h-7 w-7 rounded-full bg-[var(--bg)]" />
        </div>

        <div className="px-7 pb-4 pt-8 text-center">
          <span className="rounded-full bg-[oklch(71%_0.165_128/0.15)] px-3.5 py-1.5 text-xs font-bold text-[var(--lime-bright)]">
            فعّال الآن · يُتحقق منه باستمرار
          </span>

          <p className="mt-6 text-xs tracking-[0.22em] text-[var(--faint)]">الرمز الترويجي الحصري</p>
          <p
            className="mt-2 select-all font-[var(--font-display)] text-[64px] font-bold leading-none tracking-[0.18em] text-[var(--lime-bright)]"
            style={{ textShadow: '0 0 32px oklch(80% 0.18 128 / 0.55)' }}
          >
            {PROMO_CODE}
          </p>

          <div className="mx-auto mt-6 w-full border-t-2 border-dashed border-[var(--line)]" aria-hidden />

          <div className="space-y-2.5 py-5 text-right">
            {[
              ['مكافأة رياضية', '100% على أول إيداع'],
              ['مكافأة الكازينو', 'حتى 2,100,000 IQD'],
              ['لفات مجانية', '150 لفة على 4 إيداعات'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between text-sm">
                <span className="text-[var(--faint)]">{k}</span>
                <span className="font-bold text-[var(--ink)]">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 border-t border-[var(--line)] p-4">
          <motion.button
            onClick={copy}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            aria-live="polite"
            className={`focus-ring min-h-[46px] rounded-xl border py-2.5 text-sm font-bold transition-colors duration-200 ${
              copied
                ? 'border-[var(--lime)] bg-[oklch(71%_0.165_128/0.18)] text-[var(--lime-bright)]'
                : 'border-[oklch(97%_0.01_250/0.2)] text-[var(--ink)] hover:bg-[oklch(97%_0.01_250/0.06)]'
            }`}
          >
            {copied ? 'تم النسخ ✅' : 'نسخ الكود'}
          </motion.button>
          <PrimaryCTA className="!min-h-[46px] !rounded-xl !px-3 !py-2.5 !text-sm">فعّله الآن ←</PrimaryCTA>
        </div>
      </div>
    </motion.div>
  );
}

/* ----------------------------------- FAQ ----------------------------------- */

const faqs = [
  { q: 'وين أدخل كود الخصم بالضبط؟', a: 'أثناء التسجيل فقط — في خانة "الرمز الترويجي" أسفل نموذج إنشاء الحساب. بعد إتمام التسجيل لا يمكن إضافته نهائياً، فلا تنسَه.' },
  { q: 'سجّلت بدون الكود، أقدر أضيفه هسه؟', a: 'للأسف لا — الكود يُدخل مرة واحدة أثناء إنشاء الحساب فقط. الحل الوحيد لمن فاته: التواصل مع الدعم المباشر، وأحياناً يساعدون بالحالات الحديثة جداً، لكن بدون ضمان.' },
  { q: 'شنو الفرق بين الكود وبدونه؟', a: 'بدون الكود تحصل على المكافأة القياسية فقط. مع الكود تُفعَّل النسخة المضاعفة: المكافأة الرياضية الكاملة 100% ومكافأة الكازينو الموزعة على أول 4 إيداعات مع اللفات المجانية.' },
  { q: 'المكافأة تنسحب فوراً؟', a: 'لا — يجب "تدويرها" 5 مرات برهانات تراكمية تتضمن 3 أحداث على الأقل باحتمالات 1.40 فأعلى، خلال المدة المحددة بالشروط. اقرأ شرط الرهان قبل الإيداع حتى لا تتفاجأ.' },
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

  const applySteps = [
    { title: 'اضغط "سجّل الآن"', desc: 'تفتح صفحة إنشاء الحساب في 1xBet مباشرة' },
    { title: 'أدخل الكود بخانة "الرمز الترويجي"', desc: `اكتب ${PROMO_CODE} في الخانة المخصصة أسفل نموذج التسجيل — قبل الضغط على "تسجيل"` },
    { title: 'أكمل التسجيل وأودِع', desc: 'المكافأة المضاعفة تتفعّل تلقائياً على أول إيداع (14,000 دينار فأكثر لتفعيلها كاملة)' },
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

          {/* هيرو لا متماثل: نص يمين / قسيمة عمودية يسار */}
          <div className="grid items-center gap-12 pb-20 pt-8 md:grid-cols-[1.2fr_0.8fr] md:pb-24 md:pt-12">
            <div>
              <motion.h1
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32, delay: 0.08, ease: EASE }}
                className="font-[var(--font-display)] text-[clamp(2.3rem,6vw,3.75rem)] font-bold leading-[1.08] tracking-[-0.03em]">
                كود خصم 1xBet
                <br />
                <span className="text-[var(--lime-bright)]">للاعب العراقي</span>
              </motion.h1>

              <motion.p
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15, ease: EASE }}
                className="mt-5 max-w-lg text-lg leading-[1.6] text-[var(--muted)]">
                انسخ الرمز الترويجي <strong className="font-bold text-[var(--lime-bright)]">{PROMO_CODE}</strong> وأدخله{' '}
                <strong className="font-bold text-[var(--ink)]">أثناء التسجيل</strong> — يضاعف مكافأتك الترحيبية على القسمين
                الرياضي والكازينو. تنبيه مهم: لا يمكن إضافته بعد إنشاء الحساب.
              </motion.p>

              <motion.div
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.22, ease: EASE }}
                className="mt-8 flex flex-wrap gap-4">
                <PrimaryCTA big>سجّل وفعّل الكود ←</PrimaryCTA>
              </motion.div>
            </div>

            <VoucherStub />
          </div>
        </div>
      </section>

      {/* ============================ خطوات التفعيل ============================ */}
      <section className="border-t border-[var(--line)] bg-[var(--bg-deep)]/40">
        <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
          <Reveal>
            <p className="text-sm font-medium tracking-[0.18em] text-[var(--sky)]">ثلاث خطوات فقط</p>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em] md:text-4xl">شلون تفعّل الكود؟</h2>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {applySteps.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.07}>
                <div className={`flex h-full flex-col rounded-[20px] border p-6 ${i === 1 ? 'border-[oklch(71%_0.165_128/0.35)] bg-[var(--surface)]' : 'border-[var(--line)]'}`}>
                  <span className={`grid h-9 w-9 place-items-center rounded-xl text-sm font-bold ${i === 1 ? 'bg-[var(--lime)] text-[var(--bg-deep)]' : 'bg-[var(--raised)] text-[var(--ink)]'}`}>
                    {i + 1}
                  </span>
                  <h3 className="mt-4 font-bold text-[var(--ink)]">{s.title}</h3>
                  <p className="mt-2 flex-1 leading-[1.6] text-[var(--muted)]">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.2}>
            <p className="mt-8 border-r-2 border-[var(--amber)] pr-4 text-[var(--muted)]">
              <strong className="text-[var(--ink)]">⚠ الخطأ الأكثر شيوعاً:</strong> إتمام التسجيل بدون الكود ثم محاولة
              إضافته لاحقاً — غير ممكن. الخانة تظهر مرة واحدة فقط أثناء إنشاء الحساب.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ============================ شرط الرهان ============================ */}
      <section className="mx-auto max-w-4xl px-6 py-16 md:py-24">
        <div className="grid items-start gap-8 md:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <p className="text-sm font-medium tracking-[0.18em] text-[var(--sky)]">اقرأ قبل الإيداع</p>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em]">شلون تحرر المكافأة؟</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="rounded-[20px] border border-[var(--line)] bg-[var(--surface)] p-7">
              <p className="leading-[1.65] text-[var(--muted)]">
                المكافأة ليست قابلة للسحب فوراً — يجب &quot;تدويرها&quot; <strong className="text-[var(--ink)]">5 مرات</strong> برهانات
                تراكمية تتضمن <strong className="text-[var(--ink)]">3 أحداث على الأقل باحتمالات 1.40 فأعلى</strong>. الحد
                الأدنى لتفعيل المكافأة الكاملة: <strong className="text-[var(--ink)]">14,000 دينار تقريباً</strong>. الشروط
                الكاملة على صفحة العرض داخل حسابك.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================================ FAQ ================================ */}
      <section className="border-t border-[var(--line)] bg-[var(--bg-deep)]/40">
        <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
          <Reveal>
            <p className="text-sm font-medium tracking-[0.18em] text-[var(--sky)]">أسئلة الكود</p>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em] md:text-4xl">قبل ما تسجّل</h2>
          </Reveal>
          <div className="mt-10"><FAQ /></div>
        </div>
      </section>

      {/* =============================== خاتمة CTA =============================== */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <Reveal>
          <h2 className="font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em] md:text-4xl">
            الكود بيدك — لا تسجّل بدونه
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[var(--muted)]">
            انسخ <span className="font-bold text-[var(--lime-bright)]">{PROMO_CODE}</span>، سجّل، وألصقه بخانة الرمز الترويجي.
          </p>
          <div className="mt-8 flex justify-center"><PrimaryCTA big>سجّل وفعّل الكود الآن ←</PrimaryCTA></div>
        </Reveal>
      </section>

      <RelatedLinks current="/1xbet/promo-code" />

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
