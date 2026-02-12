import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '../lib/amplify';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Doce25 Events',
  description: 'Event management system for Doce25 Foundation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

