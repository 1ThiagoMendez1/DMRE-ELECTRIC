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
      <div className="container mx-auto flex h-24 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3 text-3xl font-black font-headline group">
          <Image
            src="https://i.ibb.co/MFtSVtR/dmreLogo.png"
            alt="D.M.R.E Logo"
            width={64}
            height={64}
            className="h-16 w-16 transition-transform duration-500 group-hover:rotate-12"
          />
          <span className={cn(
            "hidden sm:inline transition-colors duration-500",
            hasScrolled ? "text-foreground" : "text-foreground" // Adjust if needed
          )}>
            D.M.R.E
          </span>
        </Link>
        <nav className="hidden xl:flex items-center gap-10">
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
