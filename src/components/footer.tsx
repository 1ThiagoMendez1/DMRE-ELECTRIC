import { Twitter, Linkedin, Github } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-secondary/30 border-t border-border/50 py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="flex flex-col">
             <Link href="/" className="flex items-center gap-2 text-2xl font-bold font-headline text-glow-primary mb-4">
              <Image src="https://i.ibb.co/MFtSVtR/dmreLogo.png" alt="D.M.R.E Logo" width={64} height={64} className="h-16 w-16" />
              <span>D.M.R.E</span>
            </Link>
            <p className="text-foreground/60 max-w-xs">
              Diseñando el mundo electrificado e inteligente del mañana.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-primary mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              <li><Link href="#about" className="text-foreground/80 hover:text-primary">Sobre Nosotros</Link></li>
              <li><Link href="#services" className="text-foreground/80 hover:text-primary">Servicios</Link></li>
              <li><Link href="#projects" className="text-foreground/80 hover:text-primary">Proyectos</Link></li>
              <li><Link href="#contact" className="text-foreground/80 hover:text-primary">Contacto</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-primary mb-4">Conecta</h3>
            <div className="flex space-x-4">
              <Link href="#" className="text-foreground/80 hover:text-primary"><Twitter /></Link>
              <Link href="#" className="text-foreground/80 hover:text-primary"><Linkedin /></Link>
              <Link href="#" className="text-foreground/80 hover:text-primary"><Github /></Link>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border/50 text-center text-foreground/50">
          <p>&copy; {new Date().getFullYear()} D.M.R.E. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
