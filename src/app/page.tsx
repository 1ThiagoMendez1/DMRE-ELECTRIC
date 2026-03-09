import { services } from '@/lib/data';
import { InteractiveHero } from '@/components/interactive-hero';
import { ClientMarquee } from '@/components/client-marquee';
import { StatsSection } from '@/components/stats-section';
import { ProcessSection } from '@/components/process-section';
import { TestimonialsSection } from '@/components/testimonials-section';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CircularGallery, type GalleryItem } from '@/components/ui/circular-gallery';
import { getProjects, createContactRequest } from '@/actions/landing-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { getPlaceholderImage } from '@/lib/placeholder-images';

export default async function Home() {
  const projectsData = await getProjects();

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
    <div className="flex flex-col min-h-screen">
      <Header />

      <main>
        {/* Héroe Interactivo */}
        <InteractiveHero />

        {/* Logos de Clientes */}
        <ClientMarquee />

        {/* Sección Sobre Nosotros (Refinada) */}
        <section id="about" className="py-24 lg:py-32 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="relative group">
                <div className="absolute -inset-4 bg-primary/10 rounded-2xl blur-2xl group-hover:bg-primary/20 transition-all duration-500"></div>
                <div className="relative rounded-2xl overflow-hidden shadow-premium">
                  <Image
                    src={getPlaceholderImage('about-us-image')?.imageUrl || ''}
                    alt="Ingeniería de vanguardia"
                    width={800}
                    height={600}
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="absolute bottom-10 right-10 bg-card p-6 rounded-xl shadow-premium border border-border hidden md:block animate-float">
                  <p className="text-4xl font-black text-primary font-headline">15+</p>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Años de Liderazgo</p>
                </div>
              </div>
              <div>
                <h2 className="text-4xl lg:text-5xl font-bold font-headline text-foreground mb-8 leading-tight">
                  Más que Ingeniería Eléctrica: <br />
                  <span className="text-primary">Arquitectura Energética</span>
                </h2>
                <div className="space-y-6 text-xl text-muted-foreground leading-relaxed">
                  <p>
                    En D.M.R.E, fusionamos la precisión de la ingeniería tradicional con las tecnologías más avanzadas para crear infraestructuras que no solo funcionan, sino que potencian el desarrollo de nuestros clientes.
                  </p>
                  <p>
                    Nuestra trayectoria nos ha permitido liderar proyectos de gran envergadura a nivel nacional, desde centros de datos de misión crítica hasta complejos industriales de alta demanda energética.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sección de Servicios / Soluciones */}
        <section id="services" className="py-24 lg:py-32 bg-secondary/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold font-headline text-foreground mb-6">Expertos en Alta Complejidad</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Ofrecemos soluciones integrales diseñadas para máxima confiabilidad y rendimiento energético.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {services.slice(0, 6).map((service, index) => (
                <Card key={index} className="bg-card hover:bg-card/80 border-border group transition-all duration-500 hover:shadow-premium hover:-translate-y-2">
                  <CardHeader className="p-8">
                    <div className="bg-primary/10 w-16 h-16 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 mb-6">
                      <service.icon size={32} />
                    </div>
                    <CardTitle className="text-2xl font-bold font-headline mb-4">{service.title}</CardTitle>
                    <CardDescription className="text-lg leading-relaxed text-muted-foreground">{service.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Estadísticas */}
        <StatsSection />

        {/* Nuestra Metodología */}
        <ProcessSection />

        {/* Testimonios */}
        <TestimonialsSection />

        {/* Sección Galería */}
        <section id="gallery" className="py-24 lg:py-32 bg-background overflow-hidden relative">
          <div className="container mx-auto px-4 text-center relative">
            <h2 className="text-4xl lg:text-5xl font-bold font-headline text-foreground mb-6">Proyectos Emblemáticos</h2>
            <p className="text-xl text-muted-foreground mb-16 max-w-2xl mx-auto">
              Testimonio visual de nuestra capacidad de ejecución y compromiso con la calidad superior.
            </p>
            <div className="h-[600px] relative">
              {galleryItems.length > 0 ? (
                <CircularGallery items={galleryItems} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Pronto mostraremos nuestros proyectos aquí.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Sección de Contacto */}
        <section id="contact" className="py-24 lg:py-32 bg-secondary/30 relative">
          <div className="container mx-auto px-4">
            <div className="bg-card rounded-3xl overflow-hidden shadow-premium border border-border">
              <div className="grid lg:grid-cols-2">
                <div className="p-12 lg:p-20">
                  <h2 className="text-4xl lg:text-5xl font-bold font-headline text-foreground mb-6">Inicie su <span className="text-primary italic">Transformación</span></h2>
                  <p className="text-xl text-muted-foreground mb-10">
                    Nuestros especialistas comerciales y técnicos están listos para asesorarle en su próximo gran reto de infraestructura.
                  </p>
                  <form action={async (formData) => {
                    'use server';
                    await createContactRequest(null, formData);
                  }} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <Input
                        name="name"
                        type="text"
                        placeholder="Nombre Completo"
                        required
                        className="h-14 bg-background border-border focus:ring-primary"
                      />
                      <Input
                        name="email"
                        type="email"
                        placeholder="Correo Corporativo"
                        required
                        className="h-14 bg-background border-border focus:ring-primary"
                      />
                    </div>
                    <Input
                      name="phone"
                      type="tel"
                      placeholder="Teléfono de Contacto"
                      className="h-14 bg-background border-border focus:ring-primary"
                    />
                    <Textarea
                      name="message"
                      placeholder="Describa brevemente su requerimiento..."
                      required
                      className="min-h-[150px] bg-background border-border focus:ring-primary text-lg"
                    />
                    <Button type="submit" size="lg" className="w-full h-16 text-xl font-bold shadow-neon">
                      Enviar Solicitud de Consulta
                    </Button>
                  </form>
                </div>
                <div className="relative min-h-[400px] lg:min-h-full">
                  <Image
                    src={getPlaceholderImage('contact-map')?.imageUrl || ''}
                    alt="Ubicación estratégica"
                    fill
                    className="object-cover"
                    style={{
                      filter: 'grayscale(1) invert(1) brightness(0.8) contrast(1.2)',
                    }}
                  />
                  <div className="absolute inset-0 bg-primary/20 mix-blend-multiply"></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
