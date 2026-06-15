import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kennis Shop · Doelgroep analyse',
  description: 'Hoe concreet en visualiseerbaar is jouw ideale klant?',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body className="min-h-screen bg-cream font-brogi" suppressHydrationWarning>
        <main className="max-w-3xl mx-auto px-4 py-8 pb-16">{children}</main>
      </body>
    </html>
  );
}
