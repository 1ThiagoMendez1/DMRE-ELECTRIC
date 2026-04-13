'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const navLinks = [
  { name: 'Soluciones', href: '/solutions' },
  { name: 'Portafolio', href: '/portfolio' },
  { name: 'Sobre Nosotros', href: '/about' },
  { name: 'Ubicación', href: '/location' },
  { name: 'Contacto', href: '/contact' },
];

export function Header() {
  return (
    <header
      className="absolute top-0 left-0 right-0 z-50 bg-transparent"
    >
      <div className="w-full flex min-h-[100px] items-center justify-center lg:justify-between px-4 lg:px-6 xl:px-12 2xl:px-20 py-4">
        <Link href="/" className="flex items-center justify-center gap-4 lg:gap-6 xl:gap-8 text-2xl xl:text-3xl font-black font-headline group shrink-0">
          <Image
            src="/logo.png"
            alt="D.M.R.E Logo"
            width={200}
            height={200}
            quality={100}
            priority
            className="w-[120px] lg:w-[160px] 2xl:w-[200px] h-auto transition-transform duration-500 group-hover:scale-105 object-contain drop-shadow-2xl shrink-0"
          />
          <span className="hidden sm:inline transition-colors duration-500 whitespace-nowrap text-foreground">
            D.M.R.E
          </span>
        </Link>
        <nav className="hidden lg:flex flex-1 justify-end items-center gap-3 xl:gap-6 2xl:gap-10 pl-4 lg:pl-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-[10px] xl:text-xs 2xl:text-base font-bold uppercase tracking-wide 2xl:tracking-widest text-foreground/70 transition-all hover:text-primary hover:tracking-[0.2em]"
            >
              {link.name}
            </Link>
          ))}
          <Button asChild size="lg" className="rounded-full px-4 xl:px-8 font-bold shadow-neon text-[10px] xl:text-sm">
            <Link href="/contact">Solicitar Cotización</Link>
          </Button>
        </nav>

        {/* Mobile menu could be added here */}
      </div>
    </header>
  );
}
