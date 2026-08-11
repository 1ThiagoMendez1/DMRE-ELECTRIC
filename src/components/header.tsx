'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { name: 'Soluciones', href: '/solutions' },
  { name: 'Portafolio', href: '/portfolio' },
  { name: 'Sobre Nosotros', href: '/about' },
  { name: 'Ubicación', href: '/location' },
  { name: 'Contacto', href: '/contact' },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header
      className="absolute top-0 left-0 right-0 z-50 bg-transparent"
    >
      <div className="w-full flex min-h-[100px] items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 sm:gap-4 text-xl sm:text-2xl xl:text-3xl font-black font-headline group shrink-0">
          <Image
            src="/logo.png"
            alt="D.M.R.E Logo"
            width={200}
            height={200}
            quality={100}
            priority
            className="w-[100px] sm:w-[120px] lg:w-[160px] 2xl:w-[200px] h-auto transition-transform duration-500 group-hover:scale-105 object-contain drop-shadow-2xl shrink-0"
          />
          <span className="hidden sm:inline transition-colors duration-500 whitespace-nowrap text-foreground">
            D.M.R.E
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex flex-1 justify-end items-center gap-4 xl:gap-8 2xl:gap-10 pl-4 lg:pl-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-xs xl:text-sm 2xl:text-base font-bold uppercase tracking-wide 2xl:tracking-widest text-foreground/80 transition-all hover:text-primary hover:tracking-[0.1em]"
            >
              {link.name}
            </Link>
          ))}
          <Button asChild size="lg" className="rounded-full px-6 xl:px-8 font-bold shadow-neon text-xs xl:text-sm ml-2">
            <Link href="/contact">Solicitar Cotización</Link>
          </Button>
        </nav>

        {/* Mobile Navigation */}
        <div className="lg:hidden flex items-center">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-foreground hover:text-primary">
                <Menu className="h-8 w-8" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-background/95 backdrop-blur-xl border-l-border">
              <SheetTitle className="sr-only">Menú de Navegación</SheetTitle>
              <nav className="flex flex-col gap-6 mt-12">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="text-lg font-bold uppercase tracking-widest text-foreground/80 hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="mt-8 pt-8 border-t border-border">
                  <Button asChild size="lg" className="w-full rounded-full font-bold shadow-neon" onClick={() => setIsOpen(false)}>
                    <Link href="/contact">Solicitar Cotización</Link>
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
