'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Cairo, Tajawal } from 'next/font/google';

const display = Cairo({ subsets: ['arabic'], weight: ['700', '800', '900'], variable: '--font-display' });
const body = Tajawal({ subsets: ['arabic'], weight: ['400', '500', '700'], variable: '--font-body' });

const AFF_LINK = '/go/1xbet-eg';
const PROMO_CODE = 'X9GO';
const BASE_URL = 'https://arabtips.com';
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
      <a href={AFF_LINK} target="_blank" rel="sponsored nofollow noopener" className="focus-ring rounded-full px-4 py-2.5 text-sm font-bold text-[var(--muted)] transition-colors hover:text-[var(--ink)]">حمّل التطبيق</a>
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

const LINKS = [
  { href: '/eg/1xbet/tahmil-apk', t: 'تحميل التطبيق APK', d: 'خطوات تحميل وتثبيت تطبيق 1xBet على الأندرويد.', icon: '⬇' },
  { href: '/eg/1xbet/promo-code', t: `البرومو كود ${PROMO_CODE}`, d: 'ضاعف مكافأتك الترحيبية بالبرومو كود وقت التسجيل.', icon: '🎟️' },
  { href: '/eg/1xbet/idaa', t: 'طرق الإيداع', d: 'فودافون كاش، فوري، انستاباي وطرق مصرية تانية.', icon: '💳' },
  { href: '/eg/1xbet/sahb', t: 'طرق السحب', d: 'حدود السحب بالجنيه المصري والبيانات المطلوبة.', icon: '🏦' },
  { href: '/eg/1xbet/bonus', t: 'المكافآت', d: 'مكافأة الكازينو والرياضة وشروط الرهان بالتفصيل.', icon: '🎁' },
  { href: '/eg/1xbet/aviator', t: 'لعبة الطيارة Aviator', d: 'شرح اللعبة والمخاطر الحقيقية قبل أي رهان.', icon: '✈️' },
];

const FAQS = [
  { q: 'إزاي أحمّل تطبيق 1xBet في مصر؟', a: 'ادخل صفحة تحميل التطبيق، فعّل "مصادر غير معروفة" من إعدادات الأمان، نزّل ملف الـAPK وثبّته، وبعدها سجّل حساب جديد. متنساش تكتب البرومو كود X9GO وقت التسجيل.' },
  { q: 'إيه هو البرومو كود بتاع 1xBet مصر؟', a: 'البرومو كود بتاع 1xBet في مصر هو X9GO. اكتبه في خانة البرومو كود أثناء إنشاء الحساب عشان تضاعف مكافأتك الترحيبية على أول إيداع.' },
  { q: 'أنهي طرق دفع مصرية مدعومة؟', a: 'الإيداع والسحب متاحين بطرق مصرية زي فودافون كاش، فوري، انستاباي، اتصالات كاش وأورنج كاش، بالإضافة للعملات الرقمية.' },
  { q: 'السحب من 1xBet بياخد وقت قد إيه؟', a: 'السحب عبر المحافظ المصرية زي فودافون كاش بيكون عادةً سريع، بس الوقت الفعلي ممكن يختلف حسب الطريقة وحالة التطبيق. راجع الحدود المعروضة جوه التطبيق قبل السحب.' },
];

export default function Page() {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState<number | null>(0);

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: '1xBet مصر', item: `${BASE_URL}/eg/1xbet` },
    ],
  };

  return (
    <main dir="rtl" lang="ar" className={`${display.variable} ${body.variable} min-h-screen bg-[var(--paper)] font-[var(--font-body)] text-[var(--ink)] antialiased`}>
      <style dangerouslySetInnerHTML={{ __html: tokens }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* الهيرو */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 h-[360px] w-[640px] -translate-x-1/2 rounded-full bg-[oklch(74%_0.13_78/0.12)] blur-[120px]" />
        <div className="relative mx-auto max-w-5xl px-6">
          <Header />
          <div className="py-12 text-center md:py-16">
            <motion.p initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05, ease: EASE }}
              className="text-sm font-bold tracking-[0.15em] text-[var(--gold-deep)]">دليل 1xBet مصر 2026</motion.p>
            <motion.h1 initial={reduce ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34, delay: 0.1, ease: EASE }}
              className="mx-auto mt-4 max-w-3xl font-[var(--font-display)] text-[clamp(2.4rem,6.5vw,4rem)] font-black leading-[1.05] tracking-[-0.04em]">
              كل حاجة عن <span className="text-[var(--nile)]">1xBet في مصر</span>
            </motion.h1>
            <motion.p initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.18, ease: EASE }}
              className="mx-auto mt-5 max-w-xl text-lg leading-[1.6] text-[var(--muted)]">التحميل، الإيداع والسحب بالطرق المصرية، والمكافآت — كله في مكان واحد. البرومو كود <strong className="text-[var(--gold-deep)]">{PROMO_CODE}</strong> بيضاعف مكافأتك الترحيبية.</motion.p>
            <motion.div initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.24, ease: EASE }} className="mt-8 flex justify-center"><DownloadCTA big>حمّل التطبيق دلوقتي</DownloadCTA></motion.div>
          </div>
        </div>
      </section>

      {/* البرومو كود السريع */}
      <section className="mx-auto max-w-2xl px-6 pb-4">
        <Reveal>
          <div className="rounded-[24px] border-2 border-dashed border-[var(--gold)] bg-[var(--card)] p-6 text-center shadow-[0_12px_40px_oklch(26%_0.03_250/0.08)]">
            <p className="text-sm font-bold tracking-[0.12em] text-[var(--gold-deep)]">البرومو كود الحصري</p>
            <p className="mt-3 font-[var(--font-display)] text-5xl font-black tracking-[0.12em] text-[var(--nile)]">{PROMO_CODE}</p>
            <p className="mt-3 text-sm leading-[1.6] text-[var(--muted)]">اكتبه في خانة البرومو كود وقت التسجيل عشان تضاعف مكافأتك على أول إيداع.</p>
          </div>
        </Reveal>
      </section>

      {/* روابط الأقسام */}
      <section className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <Reveal><h2 className="font-[var(--font-display)] text-2xl font-black tracking-[-0.02em] md:text-3xl">استكشف أقسام الدليل</h2></Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LINKS.map((l, i) => (
            <Reveal key={l.href} delay={i * 0.05}>
              <a href={l.href} className="focus-ring group flex h-full flex-col rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 transition-all hover:border-[var(--gold)] hover:shadow-[0_8px_24px_oklch(26%_0.03_250/0.08)]">
                <span aria-hidden className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-[oklch(42%_0.11_245/0.1)] text-xl text-[var(--nile)]">{l.icon}</span>
                <h3 className="font-bold text-[var(--ink)] group-hover:text-[var(--nile)]">{l.t}</h3>
                <p className="mt-1.5 leading-[1.5] text-[var(--muted)]">{l.d}</p>
                <span aria-hidden className="mt-4 text-sm font-bold text-[var(--gold-deep)]">اعرف أكتر ←</span>
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      {/* الأسئلة الشائعة */}
      <section className="bg-[var(--paper-2)]">
        <div className="mx-auto max-w-3xl px-6 py-14 md:py-18">
          <Reveal><h2 className="font-[var(--font-display)] text-2xl font-black tracking-[-0.02em] md:text-3xl">أسئلة شائعة</h2></Reveal>
          <div className="mt-8 space-y-3">
            {FAQS.map((item, i) => {
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
          <Reveal delay={0.15}><div className="mt-10 text-center"><DownloadCTA big>حمّل واستخدم {PROMO_CODE}</DownloadCTA></div></Reveal>
        </div>
      </section>
      <Footer />
    </main>
  );
}
