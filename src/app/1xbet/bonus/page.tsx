'use client';

/**
 * 1xBet العراق — صفحة المكافآت بالتفصيل  (/1xbet/bonus)
 * Next.js 15 (App Router) + Tailwind + Framer Motion
 *
 * العنصر المميز: مسار تدرّج المكافأة عبر 4 إيداعات (Unlock Progression)
 * — سابع تنويع بصري في السيلو، مختلف عن كل الأنماط السابقة.
 * يعالج فجوة حقيقية: promo-code تشرح "الكود"، هذه الصفحة تشرح
 * "الشروط والحساب الفعلي" بعمق — مثال محسوب حقيقي، لا تعميم.
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

/* --------------------------- مسار تدرّج المكافأة (العنصر المميز) --------------------------- */

const deposits = [
  { n: 1, pct: '100%', note: 'الإيداع الأول' },
  { n: 2, pct: '50%', note: 'الإيداع الثاني' },
  { n: 3, pct: '25%', note: 'الإيداع الثالث' },
  { n: 4, pct: '25%', note: 'الإيداع الرابع' },
];

function DepositProgression() {
  const reduce = useReducedMotion();
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-[560px] items-start gap-2 md:min-w-0">
        {deposits.map((d, i) => (
          <div key={d.n} className="flex flex-1 flex-col items-center">
            <motion.div
              initial={reduce ? false : { opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.08, ease: EASE }}
              className="grid h-16 w-16 place-items-center rounded-2xl border-2 border-[var(--lime)] bg-[oklch(71%_0.165_128/0.12)] font-[var(--font-display)] text-xl font-bold text-[var(--lime-bright)]"
            >
              {d.pct}
            </motion.div>
            <p className="mt-3 text-center text-sm font-bold text-[var(--ink)]">إيداع {d.n}</p>
            <p className="text-center text-xs text-[var(--faint)]">{d.note}</p>
            {i < deposits.length - 1 && (
              <div aria-hidden className="absolute mt-8 h-0.5 w-full max-w-[80px] translate-x-[calc(50%+40px)] bg-[var(--line)]" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------- FAQ ----------------------------------- */

const faqs = [
  { q: 'شنو الفرق بين مكافأة الرياضة ومكافأة الكازينو؟', a: 'مكافأة الرياضة 100% على الإيداع الأول فقط وتُستخدم للمراهنات الرياضية. مكافأة الكازينو موزعة على أول 4 إيداعات (100%، 50%، 25%، 25%) وتُستخدم لألعاب الكازينو مع 150 لفة مجانية.' },
  { q: 'إيش يعتبر "رهان تراكمي" لتحرير المكافأة؟', a: 'رهان تراكمي (Accumulator) يعني اختيار 3 أحداث أو أكثر في تذكرة واحدة، وكل حدث يجب أن يكون باحتمالية (Odds) لا تقل عن 1.40. رهان واحد بمفرده (Single) لا يُحسب ضمن شرط الرهان مهما كررته.' },
  { q: 'استخدمت رهاناً باحتمال أقل من 1.40، شنو يصير؟', a: 'ذلك الرهان لا يُحتسب ضمن التدوير الخمسة، حتى لو ربحته. تأكد أن كل الأحداث الثلاثة (أو أكثر) بالتذكرة الواحدة تحقق الحد الأدنى 1.40 لكل حدث.' },
  { q: 'إذا سحبت رهاني قبل انتهاء المباراة (Cash Out)، هل يُحسب؟', a: 'لا — الرهانات التي تُسحب مبكراً (Cash Out) قبل تحديد نتيجتها الطبيعية عادة لا تُحسب ضمن شرط تدوير المكافأة.' },
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

        <div className="relative mx-auto max-w-5xl px-6">
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

          <div className="mx-auto max-w-2xl pb-10 pt-8 text-center md:pb-14 md:pt-12">
            <motion.h1
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: 0.08, ease: EASE }}
              className="font-[var(--font-display)] text-[clamp(2.3rem,6vw,3.75rem)] font-bold leading-[1.08] tracking-[-0.03em]">
              مكافآت 1xBet
              <br />
              <span className="text-[var(--lime-bright)]">بالتفصيل والشروط الحقيقية</span>
            </motion.h1>
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15, ease: EASE }}
              className="mx-auto mt-5 max-w-xl text-lg leading-[1.6] text-[var(--muted)]">
              مكافأة الكازينو موزعة على 4 إيداعات، ومكافأة الرياضة على الإيداع الأول. افهم الأرقام الحقيقية وشرط الرهان قبل ما تبدأ.
            </motion.p>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.22, ease: EASE }}
              className="mt-8 flex justify-center">
              <PrimaryCTA big>سجّل واستلم مكافأتك ←</PrimaryCTA>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================= مسار الإيداعات الأربعة ========================= */}
      <section className="border-t border-[var(--line)] bg-[var(--bg-deep)]/40">
        <div className="mx-auto max-w-4xl px-6 py-16 md:py-24">
          <Reveal>
            <p className="text-sm font-medium tracking-[0.18em] text-[var(--sky)]">مكافأة الكازينو</p>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em] md:text-4xl">تتوزع على 4 إيداعات</h2>
            <p className="mt-3 max-w-xl text-[var(--muted)]">
              حتى <strong className="text-[var(--ink)]">2,100,000 دينار عراقي</strong> + <strong className="text-[var(--ink)]">150 لفة مجانية</strong> —
              موزعة تدريجياً بدل دفعة واحدة.
            </p>
          </Reveal>
          <Reveal delay={0.15} className="relative mt-12">
            <DepositProgression />
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-10 rounded-[20px] border border-[var(--line)] bg-[var(--surface)] p-6">
              <p className="text-sm text-[var(--muted)]">
                <strong className="text-[var(--ink)]">مكافأة الرياضة</strong> منفصلة تماماً: 100% على الإيداع الأول فقط،
                لاستخدامها بالمراهنات الرياضية لا الكازينو. لتفعيل أي منهما، أدخل الرمز الترويجي{' '}
                <strong className="text-[var(--lime-bright)]">{PROMO_CODE}</strong> أثناء{' '}
                <a href="/1xbet/tasjil" className="font-bold text-[var(--sky)] underline decoration-[oklch(72%_0.12_242/0.4)] underline-offset-4 hover:text-[var(--lime-bright)]">
                  التسجيل
                </a>.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ========================= مثال محسوب لشرط الرهان ========================= */}
      <section className="mx-auto max-w-4xl px-6 py-16 md:py-24">
        <Reveal>
          <p className="text-sm font-medium tracking-[0.18em] text-[var(--sky)]">مثال حقيقي</p>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em] md:text-4xl">شلون يُحسب شرط الرهان؟</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-8 rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-7">
            <p className="leading-[1.7] text-[var(--muted)]">
              لنفترض حصلت على مكافأة <strong className="text-[var(--ink)]">50,000 دينار</strong>. شرط "تدوير 5 مرات" يعني
              يجب تراهن بمجموع <strong className="text-[var(--lime-bright)]">250,000 دينار</strong> (50,000 × 5) برهانات
              تراكمية صحيحة قبل أن تصبح المكافأة (وأرباحها) قابلة للسحب.
            </p>
            <p className="mt-4 leading-[1.7] text-[var(--muted)]">
              كل رهان يجب أن يحتوي <strong className="text-[var(--ink)]">3 أحداث على الأقل</strong> بتذكرة واحدة، وكل حدث
              احتماليته <strong className="text-[var(--ink)]">1.40 فأعلى</strong>. مثال صحيح: 3 مباريات بتذكرة واحدة،
              كل مباراة احتمالها 1.50 فأعلى — هذا يُحسب. أما 3 رهانات منفصلة (Single) على نفس المباريات — لا تُحسب أبداً
              مهما كان مبلغها.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ========================= أخطاء شائعة ========================= */}
      <section className="border-t border-[var(--line)] bg-[var(--bg-deep)]/40">
        <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
          <Reveal>
            <p className="text-sm font-medium tracking-[0.18em] text-[var(--amber)]">تجنّب هذه الأخطاء</p>
            <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em] md:text-4xl">ليش المكافأة ما تتحرر؟</h2>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { t: 'رهانات مفردة لا تراكمية', d: 'رهان واحد (Single) لا يُحسب أبداً — يجب 3 أحداث فأكثر بتذكرة واحدة.' },
              { t: 'احتمالية أقل من 1.40', d: 'أي حدث بالتذكرة احتماليته أقل من 1.40 يُبطل احتساب التذكرة كاملة.' },
              { t: 'السحب المبكر (Cash Out)', d: 'الرهانات المسحوبة قبل انتهاء المباراة طبيعياً عادة لا تُحتسب.' },
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
          <p className="text-sm font-medium tracking-[0.18em] text-[var(--sky)]">أسئلة المكافأة</p>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em] md:text-4xl">قبل ما تراهن</h2>
        </Reveal>
        <div className="mt-10"><FAQ /></div>
      </section>

      {/* =============================== خاتمة CTA =============================== */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <Reveal>
          <h2 className="font-[var(--font-display)] text-3xl font-bold tracking-[-0.02em] md:text-4xl">جاهز تستلم مكافأتك؟</h2>
          <div className="mt-8 flex justify-center"><PrimaryCTA big>سجّل بالرمز {PROMO_CODE} ←</PrimaryCTA></div>
        </Reveal>
      </section>

      <RelatedLinks current="/1xbet/bonus" />

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
