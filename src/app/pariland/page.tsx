'use client';

/**
 * Pariland العراق — الصفحة الرئيسية (pillar)  (/pariland)
 * Next.js 15 (App Router) + Tailwind + Framer Motion
 *
 * Pariland = منصة من نفس عائلة 1xbet (محرك مطابق). الفرق: الاسم
 * والهوية البصرية (أخضر نيون + أسود بدل أزرق). نفس البرومو X9GO.
 *
 * ملاحظة مصطلحات: "الرمز الترويجي" / "البرومو كود" فقط — أبداً "كود الخصم".
 */

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Changa, IBM_Plex_Sans_Arabic } from 'next/font/google';

const display = IBM_Plex_Sans_Arabic({ subsets: ['arabic'], weight: ['500', '600', '700'], variable: '--font-display' });
const body = Changa({ subsets: ['arabic'], weight: ['400', '500', '600'], variable: '--font-body' });

const AFF_LINK = '/go/pariland';
const PROMO_CODE = 'X9GO';
const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

/* هوية Pariland: أخضر نيون + أسود عميق (بدل أزرق 1xbet) */
const tokens = `
  :root {
    --bg:          oklch(18% 0.02 155);
    --bg-deep:     oklch(14% 0.018 155);
    --surface:     oklch(23% 0.03 155);
    --raised:      oklch(31% 0.05 152);
    --ink:         oklch(97% 0.01 150);
    --muted:       oklch(80% 0.025 150);
    --faint:       oklch(80% 0.025 150 / 0.55);
    --neon:        oklch(83% 0.22 145);
    --neon-bright: oklch(90% 0.24 143);
    --neon-dim:    oklch(70% 0.17 147);
    --amber:       oklch(80% 0.14 78);
    --line:        oklch(97% 0.01 150 / 0.1);
  }
  .focus-ring:focus-visible { outline: 2px solid var(--neon-bright); outline-offset: 3px; border-radius: 12px; }
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
    <span dir="ltr" aria-label="Pariland" role="img" className={`relative inline-flex select-none items-baseline leading-none ${className}`}>
      <span className="font-[var(--font-display)] text-3xl font-bold italic tracking-[-0.03em] text-[var(--ink)]">Pari</span>
      <span className="font-[var(--font-display)] text-3xl font-bold italic tracking-[-0.03em] text-[var(--neon)]">land</span>
      <span aria-hidden className="absolute -bottom-1.5 left-[2px] h-[3px] w-9 -skew-x-[18deg] rounded-full bg-[var(--neon)] shadow-[0_0_12px_var(--neon)]" />
    </span>
  );
}

function PrimaryCTA({ children, className = '', big = false }: { children: React.ReactNode; className?: string; big?: boolean }) {
  return (
    <motion.a
      href={AFF_LINK}
      target="_blank"
      rel="sponsored nofollow noopener"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      className={`focus-ring inline-flex items-center justify-center gap-2.5 rounded-2xl bg-[var(--neon)] font-bold text-[var(--bg-deep)]
        shadow-[0_1px_2px_oklch(0%_0_0/0.3),0_8px_28px_oklch(83%_0.22_145/0.45)]
        transition-shadow duration-200 hover:bg-[var(--neon-bright)]
        hover:shadow-[0_1px_2px_oklch(0%_0_0/0.3),0_10px_44px_oklch(90%_0.24_143/0.65)]
        ${big ? 'min-h-[64px] px-10 py-5 text-2xl' : 'min-h-[48px] px-6 py-3 text-base'} ${className}`}
    >
      {children}
    </motion.a>
  );
}

/* ------------------------------ روابط السيلو الداخلية ------------------------------ */

const siloLinks = [
  { href: '/pariland/tasjil', title: 'التسجيل في Pariland', desc: 'خطوة بخطوة بأربع طرق مختلفة' },
  { href: '/pariland/tahmil-apk', title: 'تحميل تطبيق Pariland APK', desc: 'آخر إصدار للأندرويد' },
  { href: '/pariland/promo-code', title: 'الرمز الترويجي Pariland', desc: `استخدم ${PROMO_CODE} لمضاعفة مكافأتك` },
  { href: '/pariland/idaa', title: 'طرق الإيداع', desc: 'زين كاش، آسيا سيل، FIB وغيرها' },
  { href: '/pariland/sahb', title: 'طرق السحب', desc: 'الحدود والشروط الحقيقية' },
  { href: '/pariland/bonus', title: 'مكافآت Pariland', desc: 'شروط الرهان بالتفصيل' },
];

function RelatedLinks() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16 md:py-20">
      <Reveal>
        <h2 className="font-[var(--font-display)] text-2xl font-bold tracking-[-0.02em] text-[var(--ink)] md:text-3xl">من نفس الدليل</h2>
      </Reveal>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {siloLinks.map((link, i) => (
          <Reveal key={link.href} delay={i * 0.05}>
            <a href={link.href}
              className="focus-ring group block h-full rounded-[20px] border border-[var(--line)] bg-[var(--surface)] p-5 transition-colors duration-200 hover:border-[oklch(83%_0.22_145/0.4)]">
              <h3 className="font-bold text-[var(--ink)] transition-colors group-hover:text-[var(--neon-bright)]">{link.title}</h3>
              <p className="mt-1.5 text-sm leading-[1.5] text-[var(--faint)]">{link.desc}</p>
            </a>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------- FAQ ----------------------------------- */

const faqs = [
  { q: 'شنو هو Pariland؟ وهل هو آمن؟', a: 'Pariland منصة مراهنات رياضية وكازينو أونلاين مرخّصة، تعمل بنفس تقنية المنصات العالمية المعروفة وتقبل اللاعبين من الدول العربية بما فيها العراق، مع دعم كامل للغة العربية والدينار العراقي.' },
  { q: 'وين أدخل الرمز الترويجي؟', a: `أدخل الرمز الترويجي ${PROMO_CODE} في الخانة المخصصة أثناء التسجيل — يظهر مرة واحدة فقط عند إنشاء الحساب، ولا يمكن إضافته بعد ذلك. شرح تفصيلي على صفحة الرمز الترويجي.` },
  { q: 'شلون أسجّل وأبدأ؟', a: 'التسجيل يستغرق أقل من دقيقتين — اختر إحدى طرق التسجيل الأربع، أدخل بياناتك والرمز الترويجي، واختر العملة الدينار العراقي. راجع صفحة التسجيل للخطوات الكاملة.' },
  { q: 'شنو طرق الإيداع والسحب المتاحة للعراق؟', a: 'تدعم المنصة طرق الدفع الشائعة في العراق: زين كاش، آسيا سيل، FIB وغيرها. راجع صفحتي الإيداع والسحب للحدود والشروط الحقيقية لكل طريقة.' },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-2.5">
      {faqs.map((item, i) => {
        const isOpen = open === i;
        return (
          <Reveal key={i} delay={i * 0.05}>
            <div className={`overflow-hidden rounded-2xl border transition-colors duration-200 ${isOpen ? 'border-[oklch(83%_0.22_145/0.4)] bg-[var(--surface)]' : 'border-[var(--line)]'}`}>
              <button onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen}
                className="focus-ring flex min-h-[56px] w-full items-center justify-between gap-4 px-5 py-4 text-right">
                <span className="font-bold text-[var(--ink)]">{item.q}</span>
                <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--raised)] text-lg font-bold text-[var(--ink)]" aria-hidden>+</motion.span>
              </button>
              <motion.div initial={false} animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.28, ease: EASE }} style={{ overflow: 'hidden' }} aria-hidden={!isOpen}>
                <p className="px-5 pb-5 leading-[1.6] text-[var(--muted)]">{item.a}</p>
              </motion.div>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "شنو هو Pariland؟ وهل هو آمن؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Pariland منصة مراهنات رياضية وكازينو أونلاين مرخّصة، تعمل بنفس تقنية المنصات العالمية المعروفة وتقبل اللاعبين من الدول العربية بما فيها العراق، مع دعم كامل للغة العربية والدينار العراقي."
      }
    },
    {
      "@type": "Question",
      "name": "وين أدخل الرمز الترويجي؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "أدخل الرمز الترويجي X9GO في الخانة المخصصة أثناء التسجيل — يظهر مرة واحدة فقط عند إنشاء الحساب، ولا يمكن إضافته بعد ذلك."
      }
    },
    {
      "@type": "Question",
      "name": "شلون أسجّل وأبدأ؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "التسجيل يستغرق أقل من دقيقتين — اختر إحدى طرق التسجيل الأربع، أدخل بياناتك والرمز الترويجي، واختر العملة الدينار العراقي."
      }
    },
    {
      "@type": "Question",
      "name": "شنو طرق الإيداع والسحب المتاحة للعراق؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "تدعم المنصة طرق الدفع الشائعة في العراق: زين كاش، آسيا سيل، FIB وغيرها — راجع صفحتي الإيداع والسحب للحدود والشروط الحقيقية لكل طريقة."
      }
    }
  ]
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "الرئيسية",
      "item": "https://arabtips.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Pariland العراق",
      "item": "https://arabtips.com/pariland"
    }
  ]
};

/* ---------------------------------- الصفحة ---------------------------------- */

export default function Page() {
  const reduce = useReducedMotion();

  return (
    <main dir="rtl" lang="ar"
      className={`${display.variable} ${body.variable} min-h-screen bg-[var(--bg)] font-[var(--font-body)] text-[var(--ink)] antialiased`}>
      <style dangerouslySetInnerHTML={{ __html: tokens }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      {/* ================================ HERO ================================ */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 right-[-8%] h-[440px] w-[600px] rounded-full bg-[oklch(83%_0.22_145/0.12)] blur-[120px]" />
          <div className="absolute bottom-[-25%] left-[-8%] h-[360px] w-[480px] rounded-full bg-[oklch(70%_0.17_147/0.1)] blur-[110px]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6">
          <motion.header
            initial={reduce ? false : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="flex items-center justify-between py-6">
            <BrandLogo />
            <PrimaryCTA>سجّل الآن</PrimaryCTA>
          </motion.header>

          <div className="grid items-center gap-12 pb-16 pt-8 md:grid-cols-[1.1fr_0.9fr] md:pb-24 md:pt-12">
            <div>
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05, ease: EASE }}
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-[oklch(83%_0.22_145/0.3)] bg-[oklch(83%_0.22_145/0.08)] px-4 py-1.5 text-sm font-medium text-[var(--neon-bright)]">
                <span className="h-2 w-2 rounded-full bg-[var(--neon)] shadow-[0_0_8px_var(--neon)]" />
                مراجعة شاملة 2026
              </motion.div>
              <motion.h1
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32, delay: 0.08, ease: EASE }}
                className="font-[var(--font-display)] text-[clamp(2.3rem,6vw,3.75rem)] font-bold leading-[1.08] tracking-[-0.03em]">
                Pariland العراق
                <br />
                <span className="text-[var(--neon-bright)]">المراجعة الكاملة</span>
              </motion.h1>
              <motion.p
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15, ease: EASE }}
                className="mt-5 max-w-lg text-lg leading-[1.6] text-[var(--muted)]">
                كل ما تحتاج معرفته عن Pariland: التسجيل، الإيداع، السحب، والمكافآت. لا تنسَ الرمز الترويجي{' '}
                <strong className="font-bold text-[var(--neon-bright)]">{PROMO_CODE}</strong> لمضاعفة مكافأتك الترحيبية.
              </motion.p>
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.22, ease: EASE }}
                className="mt-8 flex flex-wrap gap-3">
                <PrimaryCTA big>سجّل بالرمز {PROMO_CODE} ←</PrimaryCTA>
              </motion.div>
            </div>

            {/* بطاقة قسيمة الرمز الترويجي — العنصر المميز */}
            <Reveal delay={0.2}>
              <div className="relative overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-7">
                <div aria-hidden className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[oklch(83%_0.22_145/0.1)] blur-2xl" />
                <p className="text-sm font-medium tracking-[0.15em] text-[var(--neon-bright)]">الرمز الترويجي الحصري</p>
                <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border-2 border-dashed border-[oklch(83%_0.22_145/0.4)] bg-[var(--bg-deep)] px-6 py-5">
                  <span className="font-[var(--font-display)] text-3xl font-bold tracking-[0.1em] text-[var(--neon-bright)]">{PROMO_CODE}</span>
                  <span className="rounded-lg bg-[oklch(83%_0.22_145/0.15)] px-3 py-1.5 text-xs font-bold text-[var(--neon-bright)]">فعّال ✓</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {['مكافأة ترحيبية مضاعفة على أول إيداع', 'أدخله مرة واحدة أثناء التسجيل', 'صالح للاعبين الجدد في العراق'].map((t) => (
                    <li key={t} className="flex items-start gap-2.5 text-sm leading-[1.5] text-[var(--muted)]">
                      <span className="mt-0.5 text-[var(--neon)]">◆</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================ نظرة سريعة ============================ */}
      <section className="border-t border-[var(--line)] bg-[var(--bg-deep)]/40">
        <div className="mx-auto max-w-5xl px-6 py-16 md:py-20">
          <Reveal>
            <p className="text-sm font-medium tracking-[0.18em] text-[var(--neon-dim)]">لماذا Pariland</p>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em] md:text-4xl">نظرة سريعة</h2>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { t: 'دعم عربي كامل', d: 'واجهة عربية بالكامل ودعم للدينار العراقي وطرق الدفع المحلية.' },
              { t: 'رياضة وكازينو', d: 'تغطية واسعة للمراهنات الرياضية وألعاب الكازينو المباشرة.' },
              { t: 'إيداع وسحب سريع', d: 'زين كاش، آسيا سيل، FIB وغيرها — إيداع وسحب بسهولة.' },
            ].map((c, i) => (
              <Reveal key={c.t} delay={i * 0.07}>
                <div className="h-full rounded-[20px] border border-[var(--line)] bg-[var(--surface)] p-6">
                  <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-[oklch(83%_0.22_145/0.12)] text-[var(--neon-bright)]">◆</div>
                  <h3 className="font-bold text-[var(--ink)]">{c.t}</h3>
                  <p className="mt-2 leading-[1.6] text-[var(--muted)]">{c.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================================ FAQ ================================ */}
      <section className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <Reveal>
          <p className="text-sm font-medium tracking-[0.18em] text-[var(--neon-dim)]">أسئلة شائعة</p>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em] md:text-4xl">قبل ما تبدأ</h2>
        </Reveal>
        <div className="mt-10"><FAQ /></div>
      </section>

      <RelatedLinks />

      {/* =============================== خاتمة CTA =============================== */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <Reveal>
          <h2 className="font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em] md:text-4xl">جاهز تبدأ؟</h2>
          <div className="mt-8 flex justify-center"><PrimaryCTA big>سجّل بالرمز {PROMO_CODE} ←</PrimaryCTA></div>
          <p className="mt-4 text-sm text-[var(--faint)]">لا تنسَ الرمز الترويجي {PROMO_CODE}</p>
        </Reveal>
      </section>

      {/* =============================== الفوتر =============================== */}
      <footer className="border-t border-[var(--line)] bg-[var(--bg-deep)] px-6 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 text-center">
          <BrandLogo className="scale-90 opacity-70" />
          <p className="max-w-3xl text-sm leading-[1.6] text-[var(--faint)]">
            ⚠️ إخلاء مسؤولية: موقع معلوماتي مستقل لأغراض المراجعة، لا يمثل العلامة التجارية Pariland رسمياً. المراهنات لمن هم 18 عاماً فأكثر. المراهنة تنطوي على مخاطر مالية — لا تراهن بأموال لا تتحمل خسارتها. للعب المسؤول: حدد ميزانيتك والتزم بها.
          </p>
          <a href="/about" className="inline-flex min-h-[44px] items-center text-xs text-[var(--faint)] underline underline-offset-4 hover:text-[var(--muted)]">
            من نحن وسياسة الإفصاح
          </a>
        </div>
      </footer>
    </main>
  );
}
