'use client';

/**
 * ArabTips — صفحة "من نحن"  (/about)
 * Next.js 15 (App Router) + Tailwind + Framer Motion
 *
 * صفحة E-E-A-T: هوية الموقع + سياسة التحرير + الإفصاح التسويقي.
 * صفحة صادقة عمداً — لا فريق وهمي، لا شهادات مُختلقة. الشفافية
 * نفسها هي مصدر الثقة هنا، لا الادّعاءات.
 */

import { motion, useReducedMotion } from 'framer-motion';
import { Changa, IBM_Plex_Sans_Arabic } from 'next/font/google';

const display = IBM_Plex_Sans_Arabic({ subsets: ['arabic'], weight: ['500', '600', '700'], variable: '--font-display' });
const body = Changa({ subsets: ['arabic'], weight: ['400', '500', '600'], variable: '--font-body' });

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
    <span dir="ltr" aria-label="ArabTips" role="img" className={`relative inline-flex select-none items-baseline leading-none ${className}`}>
      <span className="font-[var(--font-display)] text-2xl font-bold tracking-[-0.03em] text-[var(--ink)]">Arab</span>
      <span className="font-[var(--font-display)] text-2xl font-bold tracking-[-0.03em] text-[var(--lime-bright)]">Tips</span>
    </span>
  );
}

export default function Page() {
  const reduce = useReducedMotion();

  return (
    <main dir="rtl" lang="ar"
      className={`${display.variable} ${body.variable} min-h-screen bg-[var(--bg)] font-[var(--font-body)] text-[var(--ink)] antialiased`}>
      <style dangerouslySetInnerHTML={{ __html: tokens }} />

      {/* ================================ HERO ================================ */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 right-[-8%] h-[400px] w-[560px] rounded-full bg-[oklch(40%_0.082_248/0.4)] blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-3xl px-6">
          <motion.header
            initial={reduce ? false : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="flex items-center justify-between py-6">
            <BrandLogo />
            <a href="/1xbet" className="focus-ring rounded-lg px-4 py-2 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--ink)]">
              ← مراجعة 1xBet
            </a>
          </motion.header>

          <div className="pb-14 pt-8 md:pb-20 md:pt-12">
            <motion.h1
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: 0.08, ease: EASE }}
              className="font-[var(--font-display)] text-[clamp(2rem,5.5vw,3.25rem)] font-bold leading-[1.1] tracking-[-0.03em]">
              من نحن، وليش نكتب هالمحتوى
            </motion.h1>
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15, ease: EASE }}
              className="mt-5 text-lg leading-[1.65] text-[var(--muted)]">
              ArabTips منصة معلوماتية مستقلة موجّهة للجمهور العراقي والعربي المهتم بمتابعة الرياضة ومراجعة منصات المراهنات
              الرياضية. هذه الصفحة تشرح بصراحة كيف نعمل، ومن أين نكسب، وكيف نتحقق مما نكتبه.
            </motion.p>
          </div>
        </div>
      </section>

      {/* ============================ سياسة التحرير ============================ */}
      <section className="border-t border-[var(--line)] bg-[var(--bg-deep)]/40">
        <div className="mx-auto max-w-3xl px-6 py-14 md:py-20">
          <Reveal>
            <p className="text-sm font-medium tracking-[0.18em] text-[var(--sky)]">كيف نعمل</p>
            <h2 className="mt-3 font-[var(--font-display)] text-2xl font-bold tracking-[-0.02em] md:text-3xl">سياسة التحرير</h2>
          </Reveal>
          <Reveal delay={0.1} className="mt-6 space-y-4 leading-[1.7] text-[var(--muted)]">
            <p>
              كل معلومة تقنية بمقالاتنا — حدود الإيداع والسحب، خطوات التسجيل، شروط المكافآت — نتحقق منها بالاستخدام
              الفعلي للتطبيق أو الموقع محل المراجعة، لا بنسخها من مصادر أخرى أو تخمينها.
            </p>
            <p>
              حين تتغيّر منصة ما (حدود جديدة، طرق دفع مضافة، شروط مختلفة)، نحدّث المقال المعني. إن لاحظت معلومة قديمة
              أو غير دقيقة، تواصل معنا عبر القنوات الموضحة أسفل الموقع ونصحّحها.
            </p>
            <p>
              لا ننشر أرقاماً أو ادّعاءات لا نملك مصدراً حقيقياً لها. حيث تكون معلومة تقريبية بطبيعتها (مثل أوقات
              معالجة الدفع)، نوضّح ذلك صراحة بدل تقديمها كحقيقة مطلقة.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ========================= الإفصاح التسويقي ========================= */}
      <section className="mx-auto max-w-3xl px-6 py-14 md:py-20">
        <Reveal>
          <p className="text-sm font-medium tracking-[0.18em] text-[var(--amber)]">شفافية كاملة</p>
          <h2 className="mt-3 font-[var(--font-display)] text-2xl font-bold tracking-[-0.02em] md:text-3xl">
            الإفصاح عن العلاقة التسويقية
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-6 rounded-[20px] border-2 border-[oklch(78%_0.14_75/0.3)] bg-[oklch(78%_0.14_75/0.05)] p-6 leading-[1.7] text-[var(--muted)]">
            <p>
              نستخدم روابط أفلييت (تسويق بالعمولة) داخل مقالاتنا. إذا سجّلت بمنصة عبر رابط من موقعنا، قد نحصل على
              عمولة من تلك المنصة — <strong className="text-[var(--ink)]">بدون أي تكلفة إضافية عليك</strong>.
            </p>
            <p className="mt-3">
              هذا لا يغيّر ما نكتبه. لا نبالغ في مزايا منصة لمجرد أنها تدفع عمولة أعلى، ولا نخفي عيوباً حقيقية. عمولتنا
              مرتبطة بتسجيلك، لا برأينا — فلا حافز لدينا للتضليل.
            </p>
          </div>
        </Reveal>
      </section>

      {/* =============================== الفوتر =============================== */}
      <footer className="border-t border-[var(--line)] bg-[var(--bg-deep)] px-6 py-10">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
          <BrandLogo className="scale-90 opacity-70" />
          <p className="max-w-2xl text-sm leading-[1.6] text-[var(--faint)]">
            المحتوى على ArabTips لأغراض معلوماتية. المراهنات لمن هم 18 عاماً فأكثر وتنطوي على مخاطر مالية — راهن بمسؤولية.
          </p>
        </div>
      </footer>
    </main>
  );
}
