'use client';

import RelatedLinks from '../RelatedLinks';

/**
 * 1xBet العراق — صفحة تحميل تطبيق APK  (/1xbet/tahmil-apk)
 * Next.js 15 (App Router) + Tailwind + Framer Motion
 *
 * ملاحظة: تجنّبنا عرض رقم إصدار أو حجم ملف ثابت لأنهما يتغيّران مع كل
 * تحديث من 1xBet — أي رقم ثابت يصبح خاطئاً وقديماً. نستخدم "آخر إصدار"
 * و"يُحدَّث تلقائياً" بدلاً منهما: دائم الصحة، بلا صيانة يدوية.
 */

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
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

/* ------------------------------ بطاقة التطبيق (العنصر المميز) ------------------------------ */

function AppCard() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 20, rotate: 0 }}
      animate={{ opacity: 1, y: 0, rotate: -1.5 }}
      transition={{ duration: 0.4, delay: 0.2, ease: EASE }}
      whileHover={reduce ? undefined : { rotate: 0, y: -4 }}
      className="relative mx-auto w-full max-w-xs"
    >
      <div aria-hidden className="absolute -inset-3 rounded-[28px] bg-[oklch(71%_0.165_128/0.15)] blur-2xl" />
      <div className="relative rounded-[24px] border border-[var(--line)] bg-[oklch(97%_0.01_250/0.06)] p-6 backdrop-blur-xl shadow-[0_1px_2px_oklch(0%_0_0/0.3),0_20px_50px_oklch(0%_0_0/0.35)]">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[var(--lime)] to-[var(--lime-bright)] font-[var(--font-display)] text-2xl font-bold italic text-[var(--bg-deep)]">
            1x
          </div>
          <div>
            <p className="font-[var(--font-display)] text-lg font-bold text-[var(--ink)]">1xBet</p>
            <p className="text-sm text-[var(--muted)]">مراهنات رياضية وكازينو</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-[var(--bg-deep)]/50 p-3 text-center">
          <div className="border-l border-[var(--line)]">
            <p className="text-xs text-[var(--faint)]">الإصدار</p>
            <p className="mt-0.5 text-sm font-bold text-[var(--lime-bright)]">آخر إصدار</p>
          </div>
          <div>
            <p className="text-xs text-[var(--faint)]">أندرويد</p>
            <p className="mt-0.5 text-sm font-bold text-[var(--ink)]">6.0+</p>
          </div>
        </div>

        <PrimaryCTA className="mt-5 w-full">تحميل APK ←</PrimaryCTA>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-[var(--faint)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--lime)]" />
          يُحدَّث تلقائياً · لا يتطلب Google Play
        </p>
      </div>
    </motion.div>
  );
}

/* ----------------------------------- خطوات التثبيت ----------------------------------- */

const installSteps = [
  { title: 'حمّل الملف', desc: 'اضغط زر "تحميل APK" أعلاه — الملف يبدأ التحميل مباشرة بصيغة .apk' },
  { title: 'فعّل "مصادر غير معروفة"', desc: 'من إعدادات الهاتف ← الأمان، فعّل السماح بالتثبيت من مصادر خارج Google Play (خطوة تظهر مرة واحدة فقط)' },
  { title: 'افتح الملف المُحمَّل', desc: 'من إشعارات الهاتف أو مجلد "التنزيلات"، اضغط على ملف 1xBet.apk' },
  { title: 'اضغط "تثبيت"', desc: 'التثبيت يستغرق أقل من دقيقة على أغلب الأجهزة' },
  { title: 'افتح التطبيق وسجّل دخولك', desc: 'استخدم حسابك الحالي أو سجّل جديداً — نفس بيانات الموقع تماماً' },
];

function InstallTimeline() {
  return (
    <div className="relative">
      <div aria-hidden className="absolute right-[19px] top-2 bottom-2 w-px bg-[var(--line)]" />
      <div className="space-y-6">
        {installSteps.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.06}>
            <div className="relative flex gap-5">
              <span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--raised)] font-bold text-[var(--ink)]">
                {i + 1}
              </span>
              <div className="pt-1.5">
                <h3 className="font-bold text-[var(--ink)]">{s.title}</h3>
                <p className="mt-1 leading-[1.6] text-[var(--muted)]">{s.desc}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------- FAQ ----------------------------------- */

const faqs = [
  { q: 'شلون أثبت 1xbet APK بجهازي؟', a: 'حمّل الملف من الزر أعلاه، فعّل "مصادر غير معروفة" من إعدادات الأمان، افتح الملف واضغط تثبيت. العملية كاملة تأخذ أقل من دقيقتين.' },
  { q: 'التطبيق آمن؟ ليش مو موجود بكوكل بلي؟', a: 'متجر Google Play لا يقبل تطبيقات المراهنات في المنطقة — هذا ينطبق على كل شركات المراهنات، مو خاص بـ1xBet. الملف نفسه من مصدر 1xBet الرسمي، وهذا هو الأسلوب المعتمد عالمياً لهذا النوع من التطبيقات.' },
  { q: 'شكد حجم التطبيق ويحتاج مساحة وايد؟', a: 'التطبيق خفيف نسبياً وأخف من تصفح الموقع عبر المتصفح باستمرار. تأكد إن عندك مساحة فارغة كافية بجهازك قبل التحميل — أغلب الأجهزة الحديثة تستوعبه بسهولة.' },
  { q: 'يشتغل على جميع أجهزة الأندرويد؟', a: 'يعمل على أندرويد 6.0 فما فوق — يعني أغلب الأجهزة المُصنَّعة خلال آخر 8 سنوات. إذا جهازك أقدم من هذا، يمكنك استخدام النسخة عبر المتصفح بدلاً من التطبيق.' },
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

          <div className="grid items-center gap-10 pb-20 pt-8 md:grid-cols-[1.25fr_0.75fr] md:pb-28 md:pt-14">
            <div>
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05, ease: EASE }}
                className="flex flex-wrap gap-2">
                {['نسخة 2026', 'لا يتطلب Google Play', 'تثبيت مباشر'].map((tag) => (
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
                تحميل تطبيق 1xBet
                <br />
                <span className="text-[var(--lime-bright)]">APK للأندرويد</span>
                <span className="text-[var(--muted)]"> — آخر إصدار</span>
              </motion.h1>

              <motion.p
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.16, ease: EASE }}
                className="mt-5 max-w-lg text-lg leading-[1.6] text-[var(--muted)]">
                تنزيل 1xBet مباشر بصيغة APK — أخف من الموقع، لا يتوقف بسبب الحجب، ويعمل على كل أجهزة الأندرويد. تثبيت كامل خلال دقيقتين.
              </motion.p>

              <motion.div
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.22, ease: EASE }}
                className="mt-9">
                <PrimaryCTA big>تحميل 1xBet APK الآن ←</PrimaryCTA>
                <p className="mt-3 text-sm text-[var(--faint)]">ملف مباشر من 1xBet · آخر إصدار محدّث</p>
              </motion.div>
            </div>

            <AppCard />
          </div>
        </div>
      </section>

      {/* ========================= خطوات التثبيت ========================= */}
      <section className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <Reveal>
          <p className="text-sm font-medium tracking-[0.18em] text-[var(--sky)]">خطوات بسيطة</p>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em] md:text-4xl">شلون أثبت التطبيق؟</h2>
        </Reveal>
        <div className="mt-10"><InstallTimeline /></div>
      </section>

      {/* ========================= ليش APK وليش أمان ========================= */}
      <section className="border-t border-[var(--line)] bg-[var(--bg-deep)]/40">
        <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
          <Reveal>
            <p className="text-sm font-medium tracking-[0.18em] text-[var(--sky)]">سؤال شائع</p>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em] md:text-4xl">ليش APK ومو من Google Play؟</h2>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { t: 'سياسة المتاجر', d: 'Google Play يمنع تطبيقات المراهنات في المنطقة — هذا ينطبق على كل الشركات، لا استثناء لـ1xBet.' },
              { t: 'نفس المصدر الرسمي', d: 'ملف APK يأتي مباشرة من 1xBet — نفس الشركة، نفس الحساب، نفس الأمان.' },
              { t: 'أداء أخف وأسرع', d: 'التطبيق أخف من تصفح الموقع عبر المتصفح، ولا يتأثر بحجب المتصفح.' },
            ].map((c, i) => (
              <Reveal key={c.t} delay={i * 0.07}>
                <div className="h-full rounded-[20px] border border-[var(--line)] bg-[var(--surface)] p-6">
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
          <p className="text-sm font-medium tracking-[0.18em] text-[var(--sky)]">أسئلة سريعة</p>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em] md:text-4xl">قبل ما تحمّل</h2>
        </Reveal>
        <div className="mt-10"><FAQ /></div>
      </section>

      {/* =============================== خاتمة CTA =============================== */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <Reveal>
          <h2 className="font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em] md:text-4xl">جاهز تحمّل التطبيق؟</h2>
          <div className="mt-8 flex justify-center"><PrimaryCTA big>تحميل 1xBet APK ←</PrimaryCTA></div>
          <p className="mt-4 text-sm text-[var(--faint)]">آخر إصدار · يُحدَّث تلقائياً · أندرويد 6.0+</p>
        </Reveal>
      </section>

      <RelatedLinks current="/1xbet/tahmil-apk" />

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
