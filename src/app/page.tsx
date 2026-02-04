import Image from 'next/image';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { services } from '@/lib/data';
import { getPlaceholderImage } from '@/lib/placeholder-images';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AnimatedBackground } from '@/components/animated-background';
import { LogIn, MoveRight } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CircularGallery, type GalleryItem } from '@/components/ui/circular-gallery';
import { getProjects, createContactRequest } from '@/actions/landing-actions';

// This is now a Server Component
export default async function Home() {
  const projectsData = await getProjects();

  // Transform DB projects to gallery items
  const galleryItems: GalleryItem[] = projectsData
    ? projectsData.filter((p: any) => p.is_active).map((p: any) => ({
      common: p.title,
      binomial: p.category,
      photo: {
        url: p.image_url || 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=600',
        text: p.description,
        by: 'DMRE',
      }
    }))
    : [];

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      <Header />
      {/* Sección Héroe */}
      <section id="home" className="relative h-screen flex items-center justify-center text-center overflow-hidden">
        <AnimatedBackground />
        <div className="z-10 flex flex-col items-center p-4">
          <h1 className="text-5xl md:text-7xl font-bold text-glow-primary tracking-tighter mb-4 font-headline">
            Diseño y montaje de redes electricas
          </h1>
          <p className="text-lg md:text-xl text-primary/80 max-w-3xl mx-auto mb-8">
            En D.M.R.E. diseñamos y construimos soluciones eléctricas completas e integrales
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild variant="outline" className="electric-button font-bold text-lg px-8 py-6 border-primary text-primary hover:bg-primary/10 hover:text-primary text-glow-primary">
              <Link href="#services">
                Explora Nuestros Servicios <MoveRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Sección Sobre Nosotros */}
      <section id="about" className="py-20 lg:py-32 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-primary mb-4 font-headline">Fusionando Electricidad con Inteligencia</h2>
              <p className="text-lg text-foreground/80 mb-4">
                En D.M.R.E, somos más que ingenieros eléctricos. Somos innovadores y arquitectos del futuro, dedicados a integrar la inteligencia artificial de vanguardia con los sistemas eléctricos fundamentales. Nuestra experiencia abarca instalaciones eléctricas complejas, cableado estructurado robusto y el diseño de redes eléctricas resilientes.
              </p>
              <p className="text-lg text-foreground/80">
                Creemos en la creación de infraestructuras sostenibles, eficientes e inteligentes que impulsen el mundo del mañana. El profundo conocimiento de nuestro equipo en ingeniería aplicada garantiza que cada proyecto sea un referente de calidad y diseño vanguardista.
              </p>
            </div>
            <div className="relative h-80 w-full">
              <Image
                src={getPlaceholderImage('about-us-image')?.imageUrl || ''}
                alt="Red eléctrica futurista"
                fill
                className="object-cover rounded-lg shadow-2xl shadow-primary/20"
                data-ai-hint="electrical grid"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Servicios */}
      <section id="services" className="py-20 lg:py-32 bg-secondary/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-primary mb-2 font-headline">Nuestra Experiencia</h2>
          <p className="text-lg text-foreground/80 mb-12 max-w-2xl mx-auto">
            Ofrecemos un conjunto completo de servicios para potenciar tu visión, desde el diseño inicial hasta el mantenimiento a largo plazo.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="bg-card/50 backdrop-blur-sm border-border/50 text-left transform transition-all duration-300 hover:scale-105 hover:border-primary hover:shadow-2xl hover:shadow-primary/20">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <service.icon className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-primary-foreground font-headline">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-foreground/70">{service.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Sección Galería */}
      <section id="gallery" className="py-20 lg:py-32 bg-background overflow-hidden relative">
        <div className="container mx-auto px-4 text-center h-[600px] relative">
          <h2 className="text-4xl font-bold text-primary mb-2 font-headline">Vitrina de Proyectos</h2>
          <p className="text-lg text-foreground/80 mb-12 max-w-2xl mx-auto">
            Explora nuestros proyectos más recientes y destacados.
          </p>
          {galleryItems.length > 0 ? (
            <CircularGallery items={galleryItems} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Pronto mostraremos nuestros proyectos aquí.</p>
            </div>
          )}
        </div>
      </section>

      {/* Sección de Contacto */}
      <section id="contact" className="py-20 lg:py-32 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-4xl font-bold text-primary mb-4 font-headline">Conecta con Nosotros</h2>
              <p className="text-lg text-foreground/80 mb-8">
                ¿Tienes un proyecto en mente o necesitas una consulta de expertos? Contáctanos y construyamos el futuro juntos.
              </p>
              <form action={async (formData) => {
                'use server';
                await createContactRequest(null, formData);
              }} className="space-y-6">
                <Input
                  name="name"
                  type="text"
                  placeholder="Tu Nombre"
                  required
                  className="bg-background/50 text-lg p-6 focus-visible:ring-offset-background focus-visible:shadow-[0_0_15px_hsl(var(--ring)/0.5)] transition-shadow"
                />
                <Input
                  name="email"
                  type="email"
                  placeholder="Tu Email"
                  required
                  className="bg-background/50 text-lg p-6 focus-visible:ring-offset-background focus-visible:shadow-[0_0_15px_hsl(var(--ring)/0.5)] transition-shadow"
                />
                <Input
                  name="phone"
                  type="tel"
                  placeholder="Tu Teléfono"
                  className="bg-background/50 text-lg p-6 focus-visible:ring-offset-background focus-visible:shadow-[0_0_15px_hsl(var(--ring)/0.5)] transition-shadow"
                />
                <Textarea
                  name="message"
                  placeholder="Tu Mensaje"
                  required
                  className="bg-background/50 text-lg p-6 min-h-[150px] focus-visible:ring-offset-background focus-visible:shadow-[0_0_15px_hsl(var(--ring)/0.5)] transition-shadow"
                />
                <Button type="submit" size="lg" className="w-full electric-button font-bold text-lg p-6">
                  Enviar Mensaje
                </Button>
              </form>
            </div>
            <div className="relative h-96 md:h-full w-full mt-8 md:mt-0">
              <Image
                src={getPlaceholderImage('contact-map')?.imageUrl || ''}
                alt="Mapa estilizado"
                fill
                className="object-cover rounded-lg"
                style={{
                  filter: 'grayscale(1) invert(1) sepia(1) saturate(5) hue-rotate(140deg) brightness(0.7) contrast(1.5)',
                }}
                data-ai-hint="map location"
              />
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
