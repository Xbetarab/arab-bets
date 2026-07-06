import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'من نحن | ArabTips',
  description: 'من نحن، سياسة التحرير، والإفصاح عن العلاقة التسويقية لموقع ArabTips.',
  alternates: { canonical: 'https://arabtips.com/about' },
  robots: { index: true, follow: true },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
