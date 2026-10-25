'use client';

/**
 * روابط السيلو الداخلية — تُعرض أسفل كل صفحة قبل الفوتر.
 * تمرر link equity بين صفحات /1xbet وتساعد الزحف والزائر معاً.
 */

const links = [
  { href: '/1xbet', title: 'مراجعة 1xBet العراق الشاملة', desc: 'التسجيل، المكافأة، وكل ما تحتاجه في دليل واحد' },
  { href: '/1xbet/rabit-jadid', title: 'رابط 1xbet الشغّال المحدّث', desc: 'الموقع محجوب عندك؟ الرابط البديل هنا دائماً' },
  { href: '/1xbet/tahmil-apk', title: 'تحميل تطبيق 1xBet APK', desc: 'آخر إصدار للأندرويد — يتجاوز الحجب نهائياً' },
  { href: '/1xbet/idaa', title: 'طرق الإيداع بزين كاش وآسيا سيل', desc: 'خطوات كل طريقة دفع عراقية بالتفصيل' },
  { href: '/1xbet/promo-code', title: 'كود خصم 1xBet الترويجي', desc: 'الرمز الحصري لمضاعفة المكافأة — أدخله أثناء التسجيل' },
  { href: '/1xbet/tasjil', title: 'التسجيل في 1xBet خطوة بخطوة', desc: 'أربع طرق للتسجيل — اختر الأسرع لك' },
  { href: '/1xbet/bonus', title: 'مكافآت 1xBet بالتفصيل', desc: 'شرط الرهان بمثال محسوب حقيقي وأخطاء شائعة' },
  { href: '/1xbet/aviator', title: 'لعبة الطيارة Aviator شرح كامل', desc: 'الآلية، العدالة، والمخاطر الحقيقية قبل ما تلعب' },
];

export default function RelatedLinks({ current }: { current: string }) {
  const items = links.filter((l) => l.href !== current);
  return (
    <section className="border-t border-[var(--line)]">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <p className="text-sm font-medium tracking-[0.18em] text-[var(--sky)]">من نفس الدليل</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="group rounded-2xl border border-[var(--line)] p-5 transition-colors duration-200 hover:border-[oklch(72%_0.12_242/0.45)] hover:bg-[var(--surface)]"
            >
              <h3 className="font-bold text-[var(--ink)] transition-colors duration-200 group-hover:text-[var(--lime-bright)]">
                {l.title}
              </h3>
              <p className="mt-1.5 text-sm leading-[1.55] text-[var(--muted)]">{l.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
