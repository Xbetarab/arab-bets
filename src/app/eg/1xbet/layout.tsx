import type { Metadata } from 'next';

const BASE_URL = 'https://arabtips.com';

export const metadata: Metadata = {
  title: "1xBet مصر 2026 | تحميل التطبيق والبرومو كود",
  description:
    "دليل 1xBet مصر الشامل: تحميل التطبيق APK، الإيداع والسحب بالطرق المصرية (فودافون كاش، فوري، انستاباي)، والمكافآت. استخدم البرومو كود X9GO لمضاعفة مكافأتك.",
  alternates: { canonical: `${BASE_URL}/eg/1xbet` },
  openGraph: {
    title: "1xBet مصر 2026 | تحميل التطبيق والبرومو كود",
    description: "دليل 1xBet مصر الشامل: التحميل، الإيداع والسحب المصري، والمكافآت مع البرومو كود X9GO.",
    url: `${BASE_URL}/eg/1xbet`,
    siteName: 'ArabTips',
    locale: 'ar_EG',
    type: 'website',
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
};

export default function Eg1xbetLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
