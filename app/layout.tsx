import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Global styles
import Navigation from '@/components/Navigation';
import { ThemeProvider } from '@/components/ThemeProvider';
import OnboardingGate from '@/components/OnboardingGate';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Speech Coach',
  description: 'An AI-powered app to help you improve your speaking skills through real-time feedback.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Speech Coach',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="font-sans antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 sm:pb-0" suppressHydrationWarning>
        <ThemeProvider>
          <OnboardingGate>
            <Navigation />
            {children}
          </OnboardingGate>
        </ThemeProvider>
      </body>
    </html>
  );
}
