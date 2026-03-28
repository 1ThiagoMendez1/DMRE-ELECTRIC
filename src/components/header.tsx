'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

const navLinks = [
  { name: 'Soluciones', href: '/solutions' },
  { name: 'Portafolio', href: '/portfolio' },
  { name: 'Sobre Nosotros', href: '/about' },
  { name: 'Ubicación', href: '/location' },
  { name: 'Contacto', href: '/contact' },
];

export function Header() {
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        hasScrolled
          ? 'bg-background/90 backdrop-blur-xl border-b border-border shadow-premium'
          : 'bg-transparent'
      )}
    >
      <div className="w-full flex min-h-[100px] items-center justify-between px-6 lg:px-12 xl:px-20 py-4">
        <Link href="/" className="flex items-center gap-8 lg:gap-10 text-3xl font-black font-headline group shrink-0">
          <Image
            src="/logo.png"
            alt="D.M.R.E Logo"
            width={200}
            height={200}
            quality={100}
            priority
            className="w-[120px] md:w-[200px] h-auto transition-transform duration-500 group-hover:scale-105 object-contain drop-shadow-2xl"
          />
          <span className={cn(
            "hidden sm:inline transition-colors duration-500 whitespace-nowrap",
            hasScrolled ? "text-foreground" : "text-foreground" // Adjust if needed
          )}>
            D.M.R.E
          </span>
        </Link>
        <nav className="hidden xl:flex flex-1 justify-end items-center gap-6 2xl:gap-10 pl-16">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-base font-bold uppercase tracking-widest text-foreground/70 transition-all hover:text-primary hover:tracking-[0.2em]"
            >
              {link.name}
            </Link>
          ))}
          <Button asChild size="lg" className="rounded-full px-8 font-bold shadow-neon">
            <Link href="/contact">Solicitar Cotización</Link>
          </Button>
        </nav>

        {/* Mobile menu could be added here */}
      </div>
    </header>
  );
}
