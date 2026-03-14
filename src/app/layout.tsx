import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Psycho.Box',
  description: 'Frontend for psycho.pizza API',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
