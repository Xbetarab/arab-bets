'use client';

/**
 * 1xBet العراق — Pillar / Landing Page (إعادة بناء كاملة)
 * Next.js 15 (App Router) + Tailwind + Framer Motion
 * التثبيت: npm i framer-motion
 *
 * نظام الألوان: مستخرج من الهوية الرسمية لـ 1xBet (لقطات irq.1xbet.com)
 * — كحلي عميق، أزرق الهيدر، أخضر ليموني للـ CTA، أزرق سماوي للشعار.
 * كل القيم OKLCH كمتغيرات CSS (توكنز) — لا ألوان صلبة مبعثرة في الكود.
 */

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Changa, IBM_Plex_Sans_Arabic } from 'next/font/google';

const display = Changa({ subsets: ['arabic'], weight: ['600', '700', '800'], variable: '--font-display' });
const body = IBM_Plex_Sans_Arabic({ subsets: ['arabic'], weight: ['400', '500', '700'], variable: '--font-body' });

const AFF_LINK = 'https://dub.sh/fP9V2WH';
const PROMO_CODE = 'X9GO';

/* ------------------------------ توكنز التصميم ------------------------------ */

const tokens = `
  :root {
    --bg:          oklch(24% 0.050 251);   /* الكحلي العميق للهيرو الرسمي */
    --bg-deep:     oklch(20% 0.045 252);
    --surface:     oklch(30% 0.060 250);   /* بطاقات */
    --raised:      oklch(41% 0.085 248);   /* أزرق الهيدر الرسمي */
    --ink:         oklch(96.5% 0.010 250);
    --muted:       oklch(80% 0.028 248);
    --lime:        oklch(71% 0.165 128);   /* أخضر أزرار 1xBet */
    --lime-bright: oklch(79% 0.180 128);
    --sky:         oklch(72% 0.120 242);   /* أزرق "BET" في الشعار */
    --line:        oklch(96% 0.01 250 / 0.09);
    --ease-enter:  cubic-bezier(0.23, 1, 0.32, 1);
  }
  @keyframes marquee {
    from { transform: translateX(0); }
    to   { transform: translateX(50%); } /* RTL: نتحرك يميناً */
  }
  .ticker-track { animation: marquee 28s linear infinite; }
  @media (prefers-reduced-motion: reduce) {
    .ticker-track { animation: none; }
  }
  .focus-ring:focus-visible {
    outline: 2px solid var(--lime-bright);
    outline-offset: 3px;
    border-radius: 12px;
  }
`;

/* --------------------------------- الحركة --------------------------------- */

const EASE = [0.23, 1, 0.32, 1] as const;

function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 20, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.45, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* Wordmark rebuilt as pure HTML/CSS — immune to RTL/SVG text issues.
   For production, prefer the official asset from the 1xBet partner dashboard. */
function BrandLogo({ className = '' }: { className?: string }) {
  return (
    <span
      dir="ltr"
      aria-label="1xBet"
      role="img"
      className={`relative inline-flex select-none items-baseline leading-none ${className}`}
    >
      <span className="font-[var(--font-display)] text-3xl font-extrabold italic tracking-[-0.02em] text-[var(--ink)] md:text-4xl">
        1X
      </span>
      <span className="font-[var(--font-display)] text-3xl font-extrabold italic tracking-[-0.02em] text-[var(--sky)] md:text-4xl">
        BET
      </span>
      {/* Green speed dash under "1X", skewed to match the italic angle */}
      <span
        aria-hidden
        className="absolute -bottom-1.5 right-auto left-[2px] h-[3px] w-9 -skew-x-[18deg] rounded-full bg-[var(--lime)]"
      />
    </span>
  );
}

/* ----------------------------------- CTA ----------------------------------- */
/* نص كحلي داكن فوق الأخضر الليموني = تباين AA حقيقي (الأبيض على هذا الأخضر يفشل) */

function CTA({
  children,
  variant = 'solid',
  className = '',
}: {
  children: React.ReactNode;
  variant?: 'solid' | 'ghost';
  className?: string;
}) {
  return (
    <motion.a
      href={AFF_LINK}
      target="_blank"
      rel="sponsored noopener"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      className={`focus-ring inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-lg font-bold transition-shadow duration-200 ${
        variant === 'solid'
          ? 'bg-[var(--lime)] text-[var(--bg-deep)] shadow-[0_1px_2px_oklch(0%_0_0/0.2),0_6px_20px_oklch(71%_0.165_128/0.35)] hover:bg-[var(--lime-bright)] hover:shadow-[0_1px_2px_oklch(0%_0_0/0.2),0_8px_32px_oklch(79%_0.18_128/0.55)]'
          : 'border border-[var(--line)] text-[var(--ink)] hover:border-[oklch(96%_0.01_250/0.25)] hover:bg-[oklch(96%_0.01_250/0.04)]'
      } ${className}`}
    >
      {children}
    </motion.a>
  );
}

/* ---------------------------- تسمية قسم (Eyebrow) ---------------------------- */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-medium tracking-[0.18em] text-[var(--sky)]">{children}</p>
  );
}

/* --------------------------------- البيانات --------------------------------- */

const tickerItems = [
  'سحب بزين كاش خلال دقائق',
  'آسيا حوالة',
  'مصرف العراق الأول FIB',
  'الفاست بي',
  'USDT عبر OKX و Binance',
  'الدوري العراقي الممتاز',
  'مكافأة حتى 2,100,000 IQD',
  'إيداع بالدينار العراقي',
];

const registrationMethods = [
  {
    title: 'بنقرة واحدة',
    tag: 'الأسرع — 60 ثانية',
    featured: true,
    steps: [
      'ادخل عبر رابط 1xbet الشغال في موقعنا',
      'اختر: العراق — الدينار العراقي (IQD)',
      `أدخل كود الخصم ${PROMO_CODE} لمضاعفة المكافأة`,
      'احفظ رقم الحساب وكلمة المرور بلقطة شاشة فوراً',
    ],
  },
  {
    title: 'برقم الهاتف',
    tag: 'الأكثر أماناً',
    featured: false,
    steps: [
      'أدخل رقمك العراقي (آسيا سيل، زين، كورك)',
      'أكّد رمز SMS واختر العملة IQD',
      'أدخل الكود الترويجي — وحسابك جاهز',
    ],
  },
];

const paymentMethods = [
  { name: 'زين كاش', min: '14,000 IQD', speed: 'دقائق – ساعة', note: 'الأكثر استخداماً في العراق', top: true },
  { name: 'آسيا سيل — آسيا حوالة', min: '14,000 IQD', speed: 'دقائق – ساعة', note: 'مثالي لمستخدمي آسيا سيل', top: false },
  { name: 'FIB مصرف العراق الأول', min: 'حسب الحساب', speed: 'سريع', note: 'مناسب للمبالغ الأكبر', top: false },
  { name: 'الفاست بي / الشحن السريع', min: 'منخفض', speed: 'سريع', note: 'متوفر عبر الوكلاء المحليين', top: false },
  { name: 'USDT — OKX / Binance', min: 'مرن', speed: '5–15 دقيقة', note: 'الأسرع للمبالغ الكبيرة، بلا حدود مصرفية', top: false },
];

const faqs = [
  {
    q: 'شكد يطول السحب من 1xbet بزين كاش؟',
    a: 'في أغلب الحالات من 15 دقيقة إلى ساعة. إذا كان سحبك الأول أو المبلغ كبيراً، قد يستغرق حتى 24 ساعة بسبب المراجعة الأمنية — وهذا يحدث مرة واحدة عادة.',
  },
  {
    q: 'هل الحساب يطلب توثيق؟',
    a: 'ليس عند التسجيل ولا عند الإيداع. التوثيق يُطلب أحياناً عند سحب مبالغ كبيرة أو عند اختلاف بيانات الدفع عن بيانات الحساب. سجّل ببياناتك الحقيقية وأودع واسحب بنفس الطريقة، وغالباً لن تمر بالتوثيق أبداً.',
  },
  {
    q: 'هل يوجد حد أدنى للإيداع؟',
    a: 'نعم، وهو منخفض جداً: يبدأ من حوالي 1,400 دينار لبعض الطرق، و14,000 دينار لتفعيل المكافأة الترحيبية الكاملة.',
  },
  {
    q: 'التطبيق ما موجود بكوكل بلي، شلون أنزّله؟',
    a: 'متجر Google Play لا يقبل تطبيقات المراهنات في المنطقة. الحل: تنزيل تطبيق 1xbet بصيغة APK من الرابط في موقعنا، ثم تفعيل "السماح بالتثبيت من مصادر غير معروفة" من إعدادات الهاتف.',
  },
];

/* ------------------------- قسيمة الرهان (العنصر المميز) ------------------------- */

function BetSlip() {
  const [copied, setCopied] = useState(false);
  const reduce = useReducedMotion();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PROMO_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard غير متاح */
    }
  };

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 24, rotate: 0 }}
      animate={{ opacity: 1, y: 0, rotate: -1.5 }}
      transition={{ duration: 0.5, delay: 0.25, ease: EASE }}
      whileHover={reduce ? undefined : { rotate: 0, y: -4 }}
      className="relative w-full max-w-md"
    >
      {/* توهج خلف القسيمة */}
      <div aria-hidden className="absolute -inset-4 rounded-[32px] bg-[oklch(71%_0.165_128/0.22)] blur-3xl" />

      <div className="relative overflow-hidden rounded-[28px] border border-[oklch(96%_0.01_250/0.16)] bg-[oklch(96%_0.01_250/0.07)] shadow-[0_1px_2px_oklch(0%_0_0/0.3),0_24px_64px_oklch(0%_0_0/0.4)] backdrop-blur-2xl">
        {/* رأس القسيمة */}
        <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4">
          <span className="text-sm font-medium tracking-[0.15em] text-[var(--sky)]">قسيمة المكافأة</span>
          <span className="rounded-full bg-[oklch(71%_0.165_128/0.15)] px-3 py-1 text-xs font-bold text-[var(--lime-bright)]">
            فعّالة اليوم
          </span>
        </div>

        <div className="px-6 py-7 text-center">
          <p className="text-sm text-[var(--muted)]">مكافأة ترحيبية تصل إلى</p>
          <p className="mt-1 font-[var(--font-display)] text-4xl font-extrabold leading-[1.05] tracking-[-0.02em] text-[var(--ink)]">
            2,100,000 <span className="text-2xl text-[var(--sky)]">IQD</span>
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">+ 150 لفة مجانية على أول 4 إيداعات</p>

          {/* الكود */}
          <div className="mt-6 rounded-2xl border border-dashed border-[oklch(79%_0.18_128/0.5)] bg-[var(--bg-deep)]/60 py-4">
            <p className="text-xs tracking-[0.2em] text-[var(--muted)]">الرمز الترويجي</p>
            <p
              className="mt-1 select-all font-[var(--font-display)] text-5xl font-extrabold tracking-[0.22em] text-[var(--lime-bright)]"
              style={{ textShadow: '0 0 28px oklch(79% 0.18 128 / 0.55)' }}
            >
              {PROMO_CODE}
            </p>
          </div>
        </div>

        {/* خط التثقيب */}
        <div className="relative flex items-center" aria-hidden>
          <span className="absolute -right-3.5 h-7 w-7 rounded-full bg-[var(--bg)]" />
          <span className="mx-5 w-full border-t-2 border-dashed border-[var(--line)]" />
          <span className="absolute -left-3.5 h-7 w-7 rounded-full bg-[var(--bg)]" />
        </div>

        {/* الأفعال */}
        <div className="flex gap-3 p-5">
          <motion.button
            onClick={copy}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className={`focus-ring min-h-[48px] flex-1 rounded-xl border py-3 font-bold transition-colors duration-200 ${
              copied
                ? 'border-[var(--lime)] bg-[oklch(71%_0.165_128/0.18)] text-[var(--lime-bright)]'
                : 'border-[oklch(96%_0.01_250/0.2)] text-[var(--ink)] hover:bg-[oklch(96%_0.01_250/0.06)]'
            }`}
            aria-live="polite"
          >
            {copied ? 'تم النسخ ✅' : 'نسخ الكود'}
          </motion.button>
          <CTA className="flex-1 !px-4 !py-3 !text-base">فعّل الآن ←</CTA>
        </div>
      </div>
    </motion.div>
  );
}

/* ----------------------------------- FAQ ----------------------------------- */

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {faqs.map((item, i) => {
        const isOpen = open === i;
        return (
          <Reveal key={i} delay={i * 0.06}>
            <div
              className={`overflow-hidden rounded-2xl border transition-colors duration-200 ${
                isOpen ? 'border-[oklch(72%_0.12_242/0.4)] bg-[var(--surface)]' : 'border-[var(--line)] bg-transparent'
              }`}
            >
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="focus-ring flex min-h-[56px] w-full items-center justify-between gap-4 px-5 py-4 text-right"
              >
                <span className="text-lg font-bold text-[var(--ink)]">{item.q}</span>
                <motion.span
                  animate={{ rotate: isOpen ? 45 : 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--raised)] text-xl font-bold text-[var(--ink)]"
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
                    transition={{ duration: 0.3, ease: EASE }}
                  >
                    <p className="px-5 pb-5 leading-relaxed text-[var(--muted)]">{item.a}</p>
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
    <main
      dir="rtl"
      lang="ar"
      className={`${display.variable} ${body.variable} min-h-screen bg-[var(--bg)] font-[var(--font-body)] text-[var(--ink)] antialiased`}
    >
      <style dangerouslySetInnerHTML={{ __html: tokens }} />

      {/* ================================ HERO ================================ */}
      <section className="relative overflow-hidden border-b border-[var(--line)]">
        {/* عمق خلفي: توهجان بلون العلامة — لا تدرجات بنفسجية */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-48 right-[-10%] h-[480px] w-[640px] rounded-full bg-[oklch(41%_0.085_248/0.5)] blur-[130px]" />
          <div className="absolute bottom-[-30%] left-[-5%] h-[380px] w-[520px] rounded-full bg-[oklch(71%_0.165_128/0.12)] blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6">
          {/* الهيدر */}
          <motion.header
            initial={reduce ? false : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="flex items-center justify-between py-6"
          >
            <BrandLogo />
            <CTA className="!min-h-[44px] !px-5 !py-2 !text-base">التسجيل</CTA>
          </motion.header>

          {/* هيرو غير متماثل: نص يمين / قسيمة يسار */}
          <div className="grid items-center gap-12 pb-20 pt-10 md:grid-cols-[1.15fr_0.85fr] md:pb-28 md:pt-16">
            <div>
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.05, ease: EASE }}
              >
                <Eyebrow>مراجعة محدّثة · 2026 · للاعب العراقي</Eyebrow>
              </motion.div>

              <motion.h1
                initial={reduce ? false : { opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.12, ease: EASE }}
                className="mt-5 font-[var(--font-display)] text-[clamp(2.4rem,6vw,4rem)] font-extrabold leading-[1.08] tracking-[-0.02em]"
              >
                1xBet العراق
                <br />
                <span className="text-[var(--sky)]">سجّل، أودِع بالدينار،</span>
                <br />
                واسحب بزين كاش خلال دقائق
              </motion.h1>

              <motion.p
                initial={reduce ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.2, ease: EASE }}
                className="mt-6 max-w-xl text-lg leading-[1.6] text-[var(--muted)]"
              >
                منصة تدعم <strong className="font-bold text-[var(--ink)]">الدينار العراقي</strong> فعلياً — زين كاش،
                آسيا حوالة، FIB، والفاست بي. في هذه المراجعة: تسجيل 1xbet خطوة بخطوة، تفعيل المكافأة، ورابط 1xbet
                الشغال حتى لو كان الموقع محجوباً عندك.
              </motion.p>

              <motion.div
                initial={reduce ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.28, ease: EASE }}
                className="mt-8 flex flex-wrap gap-4"
              >
                <CTA>سجّل واستلم مكافأتك ←</CTA>
                <CTA variant="ghost">تحميل التطبيق APK</CTA>
              </motion.div>
            </div>

            {/* العنصر المميز: قسيمة الرهان */}
            <div className="flex justify-center md:justify-start">
              <BetSlip />
            </div>
          </div>
        </div>

        {/* شريط متحرك — لوحة معلومات على طريقة شاشات المراهنات */}
        <div className="relative border-t border-[var(--line)] bg-[var(--bg-deep)]/70 py-3.5" aria-hidden>
          <div className="flex overflow-hidden [mask-image:linear-gradient(to_left,transparent,black_8%,black_92%,transparent)]">
            <div className="ticker-track flex shrink-0 gap-10 pe-10">
              {[...tickerItems, ...tickerItems].map((t, i) => (
                <span key={i} className="flex items-center gap-3 whitespace-nowrap text-sm font-medium text-[var(--muted)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--lime)]" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================== التسجيل ============================== */}
      <section className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <Reveal>
          <Eyebrow>الخطوة الأولى</Eyebrow>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em] md:text-4xl">
            كيفية التسجيل في 1xBet
          </h2>
        </Reveal>

        {/* بطاقتان غير متساويتين — المميزة أعرض */}
        <div className="mt-10 grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
          {registrationMethods.map((m, i) => (
            <Reveal key={m.title} delay={i * 0.08}>
              <div
                className={`h-full rounded-[20px] border p-7 transition-colors duration-200 ${
                  m.featured
                    ? 'border-[oklch(71%_0.165_128/0.35)] bg-[var(--surface)] shadow-[0_1px_2px_oklch(0%_0_0/0.2),0_12px_40px_oklch(0%_0_0/0.25)]'
                    : 'border-[var(--line)] bg-transparent hover:bg-[oklch(96%_0.01_250/0.03)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-[var(--font-display)] text-2xl font-bold">{m.title}</h3>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      m.featured
                        ? 'bg-[oklch(71%_0.165_128/0.15)] text-[var(--lime-bright)]'
                        : 'bg-[oklch(72%_0.12_242/0.15)] text-[var(--sky)]'
                    }`}
                  >
                    {m.tag}
                  </span>
                </div>
                <ol className="mt-6 space-y-4">
                  {m.steps.map((s, j) => (
                    <li key={j} className="flex gap-3.5">
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-sm font-bold ${
                          m.featured ? 'bg-[var(--lime)] text-[var(--bg-deep)]' : 'bg-[var(--raised)] text-[var(--ink)]'
                        }`}
                      >
                        {j + 1}
                      </span>
                      <span className="leading-[1.6] text-[var(--muted)]">{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.15}>
          <p className="mt-6 border-r-2 border-[var(--lime)] pr-4 text-[var(--muted)]">
            سجّل ببياناتك الحقيقية من البداية — تطابق البيانات عند أي توثيق لاحق يعني سحباً بلا تأخير.
          </p>
        </Reveal>
      </section>

      {/* =========================== الإيداع والسحب =========================== */}
      <section className="border-y border-[var(--line)] bg-[var(--bg-deep)]/50">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <Reveal>
            <Eyebrow>أهم قسم في المراجعة</Eyebrow>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em] md:text-4xl">
              طرق الإيداع والسحب في العراق
            </h2>
            <p className="mt-3 max-w-xl text-[var(--muted)]">
              لا حاجة لفيزا أو حساب أجنبي — كل شيء بالطرق التي تستخدمها يومياً.
            </p>
          </Reveal>

          {/* لوحة بيانات: الصف الأول مميز، والبقية صفوف مضغوطة */}
          <div className="mt-10 overflow-hidden rounded-[20px] border border-[var(--line)]">
            {paymentMethods.map((p, i) => (
              <Reveal key={p.name} delay={i * 0.05}>
                <div
                  className={`grid grid-cols-2 gap-x-4 gap-y-2 px-6 py-5 md:grid-cols-[1.4fr_0.8fr_0.9fr_1.3fr] md:items-center ${
                    i > 0 ? 'border-t border-[var(--line)]' : ''
                  } ${p.top ? 'bg-[oklch(71%_0.165_128/0.07)]' : 'transition-colors duration-150 hover:bg-[oklch(96%_0.01_250/0.03)]'}`}
                >
                  <div className="col-span-2 flex items-center gap-3 md:col-span-1">
                    <span className={`h-2.5 w-2.5 rounded-full ${p.top ? 'bg-[var(--lime)]' : 'bg-[var(--sky)]'}`} aria-hidden />
                    <span className="text-lg font-bold">{p.name}</span>
                    {p.top && (
                      <span className="rounded-full bg-[oklch(71%_0.165_128/0.18)] px-2.5 py-0.5 text-xs font-bold text-[var(--lime-bright)]">
                        الأشهر
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs tracking-[0.1em] text-[oklch(80%_0.028_248/0.65)]">أقل إيداع</p>
                    <p className="font-medium">{p.min}</p>
                  </div>
                  <div>
                    <p className="text-xs tracking-[0.1em] text-[oklch(80%_0.028_248/0.65)]">سرعة السحب</p>
                    <p className="font-medium text-[var(--lime-bright)]">{p.speed}</p>
                  </div>
                  <p className="col-span-2 text-sm text-[var(--muted)] md:col-span-1">{p.note}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <p className="mt-6 border-r-2 border-[var(--sky)] pr-4 text-[var(--muted)]">
              <strong className="text-[var(--ink)]">قاعدة ذهبية:</strong> اسحب بنفس الطريقة التي أودعت بها — أودعت
              بزين كاش؟ اسحب بزين كاش. هذا يجنّبك التوثيق الإضافي ويجعل الحوالة أسرع بكثير.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ======================= المكافأة وشروط التحرير ======================= */}
      <section className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="grid items-start gap-10 md:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <Eyebrow>الرمز الترويجي</Eyebrow>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em] md:text-4xl">
              كيف تحرر المكافأة؟
            </h2>
            <p className="mt-4 leading-[1.6] text-[var(--muted)]">
              أدخل الكود <strong className="text-[var(--lime-bright)]">{PROMO_CODE}</strong> في خانة &quot;الرمز
              الترويجي&quot; <strong className="text-[var(--ink)]">أثناء التسجيل</strong> — لا يمكن إضافته بعد إنشاء
              الحساب. المكافأة الرياضية 100% على الإيداع الأول، ومكافأة الكازينو موزعة على أول 4 إيداعات.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="rounded-[20px] border border-[var(--line)] bg-[var(--surface)] p-7">
              <h3 className="font-[var(--font-display)] text-xl font-bold">شرط الرهان — اقرأه قبل الإيداع</h3>
              <p className="mt-3 leading-[1.6] text-[var(--muted)]">
                المكافأة ليست قابلة للسحب فوراً — يجب &quot;تدويرها&quot; <strong className="text-[var(--ink)]">5 مرات</strong>{' '}
                برهانات تراكمية تتضمن <strong className="text-[var(--ink)]">3 أحداث على الأقل باحتمالات 1.40
                فأعلى</strong>. الحد الأدنى لتفعيل المكافأة: 14,000 دينار تقريباً.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* =========================== الرابط البديل =========================== */}
      <section className="border-y border-[var(--line)] bg-[var(--raised)]/25">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center md:py-24">
          <Reveal>
            <Eyebrow>الموقع محجوب عندك؟</Eyebrow>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em] md:text-4xl">
              رابط 1xBet البديل — محدّث باستمرار
            </h2>
            <p className="mt-4 leading-[1.6] text-[var(--muted)]">
              بعض مزودي الإنترنت في العراق يحجبون الرابط الرئيسي من فترة لأخرى — المشكلة ليست في حسابك. نحن نحدّث{' '}
              <strong className="text-[var(--ink)]">رابط 1xbet الشغال</strong> في هذه الصفحة باستمرار، والحل الجذري
              هو <strong className="text-[var(--ink)]">تنزيل تطبيق 1xbet</strong> بصيغة APK: يتجاوز الحجب، وحسابك
              واحد في كل مكان.
            </p>
          </Reveal>
          <Reveal delay={0.12} className="mt-8 flex flex-wrap justify-center gap-4">
            <CTA>الرابط الشغال الآن ←</CTA>
            <CTA variant="ghost">تحميل APK — آخر إصدار 2026</CTA>
          </Reveal>
        </div>
      </section>

      {/* ================================ FAQ ================================ */}
      <section className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <Reveal>
          <Eyebrow>أسئلة اللاعب العراقي</Eyebrow>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em] md:text-4xl">
            الأسئلة الشائعة
          </h2>
        </Reveal>
        <div className="mt-10">
          <FAQ />
        </div>
      </section>

      {/* =============================== الخاتمة =============================== */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-[28px] border border-[oklch(71%_0.165_128/0.3)] bg-[var(--surface)] px-8 py-12 md:px-14">
            <div
              aria-hidden
              className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[oklch(71%_0.165_128/0.15)] blur-[90px]"
            />
            <div className="relative grid items-center gap-8 md:grid-cols-[1.3fr_0.7fr]">
              <div>
                <h2 className="font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em]">
                  هل يستحق التجربة في 2026؟
                </h2>
                <p className="mt-4 leading-[1.6] text-[var(--muted)]">
                  <strong className="text-[var(--lime-bright)]">نعم — خصوصاً للاعب العراقي.</strong> دعم حقيقي
                  للدينار وطرق الدفع المحلية، سحوبات من الأسرع في السوق، وتغطية الدوري العراقي الممتاز ومباريات
                  أسود الرافدين.
                </p>
              </div>
              <div className="md:justify-self-end">
                <CTA>سجّل وفعّل الكود ←</CTA>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* =============================== الفوتر =============================== */}
      <footer className="border-t border-[var(--line)] bg-[var(--bg-deep)] px-6 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 text-center">
          <BrandLogo className="scale-[0.8] opacity-70" />
          <p className="max-w-3xl text-sm leading-[1.6] text-[oklch(80%_0.028_248/0.6)]">
            ⚠️ إخلاء مسؤولية: هذا موقع معلوماتي مستقل لأغراض المراجعة، ولا يمثل العلامة التجارية 1xBet رسمياً.
            المراهنات مخصصة لمن هم بعمر 18 عاماً فأكثر. المراهنة تنطوي على مخاطر مالية — لا تراهن بأموال لا تتحمل
            خسارتها، وتأكد من توافق استخدامك مع القوانين المحلية. للعب المسؤول: حدد ميزانيتك مسبقاً والتزم بها.
          </p>
        </div>
      </footer>
    </main>
  );
}
