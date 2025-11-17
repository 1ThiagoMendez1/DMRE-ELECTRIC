import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { AnimationProvider } from '@/contexts/animation-provider';

export const metadata: Metadata = {
  title: 'D.M.R.E',
  description: 'Soluciones futuristas de ingeniería eléctrica y cableado estructurado',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AnimationProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </AnimationProvider>
        <Toaster />
      </body>
    </html>
  );
}
