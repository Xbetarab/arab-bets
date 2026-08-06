import type { Metadata } from 'next';

const BASE_URL = 'https://arabtips.com';

export const metadata: Metadata = {
  title: "Pariland العراق 2026 | المراجعة الكاملة والرمز الترويجي",
  description:
    "مراجعة Pariland العراق 2026: التسجيل، تحميل التطبيق، طرق الإيداع والسحب، والمكافآت. استخدم الرمز الترويجي X9GO أثناء التسجيل لمضاعفة مكافأتك الترحيبية.",
  alternates: { canonical: `${BASE_URL}/pariland` },
  openGraph: {
    title: "Pariland العراق 2026 | المراجعة الكاملة والرمز الترويجي",
    description: "مراجعة Pariland العراق 2026: التسجيل، تحميل التطبيق، طرق الإيداع والسحب، والمكافآت. استخدم الرمز الترويجي X9GO أثناء التسجيل لمضاعفة مكافأتك الترحيبية.",
    url: `${BASE_URL}/pariland`,
    siteName: 'ArabTips',
    locale: 'ar_IQ',
    type: 'article',
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
};

export default function ParilandLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
