import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import Image from 'next/image';
import { getPlaceholderImage } from '@/lib/placeholder-images';

export default function AboutPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow pt-32">
                <section className="py-20 bg-background overflow-hidden">
                    <div className="container mx-auto px-4">
                        <div className="grid lg:grid-cols-2 gap-20 items-center">
                            <div>
                                <h1 className="text-5xl lg:text-7xl font-black font-headline mb-10 leading-tight">
                                    Valores que <br />
                                    <span className="text-primary italic">Conectan</span>
                                </h1>
                                <div className="space-y-8 text-xl text-muted-foreground leading-relaxed">
                                    <p>
                                        D.M.R.E. nació con la visión de transformar el panorama energético regional a través de soluciones de ingeniería que priorizan la eficiencia, la seguridad y la innovación tecnológica.
                                    </p>
                                    <p>
                                        Hoy, nos consolidamos como un aliado estratégico para empresas que buscan no solo instalaciones eléctricas, sino socios tecnológicos capaces de diseñar infraestructuras resilientes y preparadas para el futuro.
                                    </p>
                                </div>
                            </div>
                            <div className="relative">
                                <div className="absolute -inset-10 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
                                <div className="relative rounded-3xl overflow-hidden shadow-premium aspect-square">
                                    <Image
                                        src={getPlaceholderImage('about-us-image')?.imageUrl || ''}
                                        alt="Nuestra historia"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-24 bg-secondary/20">
                    <div className="container mx-auto px-4 text-center">
                        <div className="grid md:grid-cols-3 gap-16">
                            <div>
                                <h3 className="text-2xl font-bold font-headline mb-6 text-primary">Misión</h3>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    Proveer soluciones de ingeniería eléctrica de alta gama que impulsen la productividad y sostenibilidad de nuestros clientes.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold font-headline mb-6 text-primary">Visión</h3>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    Ser el referente nacional en ingeniería eléctrica avanzada, reconocidos por nuestra innovación constante y excelencia operacional.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold font-headline mb-6 text-primary">Valores</h3>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    Integridad, Precision, Innovación y Compromiso Absoluto con la Seguridad.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
