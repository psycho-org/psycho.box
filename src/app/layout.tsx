import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { AuthProvider } from '@/components/auth-provider';

export const metadata: Metadata = {
  title: 'Psycho.Box',
  description: 'Frontend for psycho.pizza API',
};

const themeScript = `(function(){var t=localStorage.getItem('psycho-theme');if(t==='light')document.documentElement.setAttribute('data-theme','light');})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeScript }} />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
