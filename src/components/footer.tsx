import { Twitter, Linkedin, Github } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-background border-t border-border py-24">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
          <div className="flex flex-col col-span-1 lg:col-span-1">
            <Link href="/" className="flex items-center gap-3 text-3xl font-black font-headline mb-8">
              <Image src="/logo.png" alt="D.M.R.E Logo" width={200} height={200} quality={100} className="w-[150px] lg:w-[200px] h-auto object-contain" />
              <span>D.M.R.E</span>
            </Link>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8">
              Liderando la innovación en ingeniería eléctrica y servicios integrales para la industria 4.0.
            </p>
            <div className="flex space-x-6">
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors"><Twitter size={24} /></Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors"><Linkedin size={24} /></Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors"><Github size={24} /></Link>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-black uppercase tracking-widest text-foreground mb-8">Soluciones</h3>
            <ul className="space-y-4">
              <li><Link href="/solutions" className="text-lg text-muted-foreground hover:text-primary hover:pl-2 transition-all">Ingeniería Industrial</Link></li>
              <li><Link href="/solutions" className="text-lg text-muted-foreground hover:text-primary hover:pl-2 transition-all">Redes de MT y BT</Link></li>
              <li><Link href="/solutions" className="text-lg text-muted-foreground hover:text-primary hover:pl-2 transition-all">Energías Renovables</Link></li>
              <li><Link href="/solutions" className="text-lg text-muted-foreground hover:text-primary hover:pl-2 transition-all">Automatización</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-black uppercase tracking-widest text-foreground mb-8">Compañía</h3>
            <ul className="space-y-4">
              <li><Link href="/about" className="text-lg text-muted-foreground hover:text-primary hover:pl-2 transition-all">Sobre Nosotros</Link></li>
              <li><Link href="/portfolio" className="text-lg text-muted-foreground hover:text-primary hover:pl-2 transition-all">Portafolio</Link></li>
              <li><Link href="/location" className="text-lg text-muted-foreground hover:text-primary hover:pl-2 transition-all">Ubicación</Link></li>
              <li><Link href="/contact" className="text-lg text-muted-foreground hover:text-primary hover:pl-2 transition-all">Contacto</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-black uppercase tracking-widest text-foreground mb-8">Sede Principal</h3>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Barandillas-San Miguel #5A-36 INT 3<br />
              Barandillas, Zipaquirá<br />
              Cundinamarca, Colombia<br /><br />
              <span className="font-bold text-foreground">T:</span> +57 (601) 123 4567<br />
              <span className="font-bold text-foreground">E:</span> contacto@dmre.com.co
            </p>
          </div>
        </div>
        <div className="mt-24 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground">
          <p className="text-lg">&copy; {new Date().getFullYear()} D.M.R.E. Ingeniería Eléctrica S.A.S. Todos los derechos reservados.</p>
          <div className="flex gap-8 text-lg">
            <Link href="#" className="hover:text-primary">Privacidad</Link>
            <Link href="#" className="hover:text-primary">Términos</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
