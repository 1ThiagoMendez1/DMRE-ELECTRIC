import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function LocationPage() {
    const address = "Barandillas-San Miguel #5A-36 INT 3, Barandillas, Zipaquirá, Cundinamarca";

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow pt-32 text-foreground">
                <section className="py-20 bg-primary text-primary-foreground">
                    <div className="container mx-auto px-4">
                        <h1 className="text-5xl lg:text-7xl font-black font-headline mb-8 uppercase tracking-tighter">Nuestra <span className="italic opacity-50">Ubicación</span></h1>
                        <p className="text-2xl max-w-3xl opacity-80 leading-relaxed font-medium">
                            Sede oficial de operaciones estratégicas en Cundinamarca.
                        </p>
                    </div>
                </section>

                <section className="py-24 bg-background">
                    <div className="container mx-auto px-4">
                        <div className="grid lg:grid-cols-2 gap-16 items-start">
                            <div className="space-y-12">
                                <div>
                                    <h2 className="text-4xl font-black font-headline mb-10 text-primary uppercase">Oficina Principal</h2>
                                    <div className="flex gap-6 items-start">
                                        <div className="bg-primary/10 p-4 rounded-2xl text-primary shrink-0">
                                            <MapPin size={32} />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold mb-4 leading-tight">{address}</p>
                                            <p className="text-xl text-muted-foreground uppercase tracking-widest font-bold">Zipaquirá, Colombia</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-8">
                                    <div className="p-8 rounded-3xl bg-secondary/30 border border-border">
                                        <Clock className="text-primary mb-4" size={32} />
                                        <h4 className="text-lg font-black uppercase mb-2">Horario de Atención</h4>
                                        <p className="text-muted-foreground font-medium">Lunes - Viernes: 8:00 AM - 6:00 PM</p>
                                        <p className="text-muted-foreground font-medium">Sábado: 8:00 AM - 1:00 PM</p>
                                    </div>
                                    <div className="p-8 rounded-3xl bg-secondary/30 border border-border">
                                        <Phone className="text-primary mb-4" size={32} />
                                        <h4 className="text-lg font-black uppercase mb-2">Línea Directa</h4>
                                        <p className="text-muted-foreground font-medium">+57 300 000 0000</p>
                                        <p className="text-muted-foreground font-medium">contacto@dmre.com.co</p>
                                    </div>
                                </div>
                            </div>

                            <div className="aspect-square lg:aspect-auto lg:h-[500px] rounded-3xl overflow-hidden shadow-premium border-4 border-primary/10 bg-muted relative">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3973.818!2d-73.9699!3d5.0252!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e4071ad528ac623%3A0x8d47a441ad0e3e46!2sDMRE-DISE%C3%91O%20Y%20MONTAJE%20DE%20REDES%20EL%C3%89CTRICAS!5e0!3m2!1ses!2sco!4v1710000000000!5m2!1ses!2sco"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0, filter: 'grayscale(1) contrast(1.2) opacity(0.8)' }}
                                    allowFullScreen={true}
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                ></iframe>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
