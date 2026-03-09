import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import Image from 'next/image';
import { getPlaceholderImage } from '@/lib/placeholder-images';
import { createContactRequest } from '@/actions/landing-actions';

export default function ContactPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow pt-32">
                <section className="py-20 bg-background overflow-hidden">
                    <div className="container mx-auto px-4">
                        <div className="grid lg:grid-cols-2 gap-20">
                            <div>
                                <h1 className="text-5xl lg:text-7xl font-black font-headline mb-10 leading-tight">
                                    Estamos <br />
                                    <span className="text-primary italic">Conectados</span>
                                </h1>
                                <p className="text-2xl text-muted-foreground mb-16 leading-relaxed">
                                    Ya sea para un nuevo desarrollo o una consulta técnica, nuestro equipo está listo para atenderle con la máxima celeridad y profesionalismo.
                                </p>

                                <div className="grid gap-12">
                                    <div className="flex gap-6">
                                        <div className="bg-primary/10 p-4 rounded-xl text-primary h-fit">
                                            <Mail size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold mb-2 uppercase tracking-widest text-foreground">Email Corporativo</h4>
                                            <p className="text-lg text-muted-foreground">contacto@dmre.com.co</p>
                                            <p className="text-lg text-muted-foreground">licitaciones@dmre.com.co</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-6">
                                        <div className="bg-primary/10 p-4 rounded-xl text-primary h-fit">
                                            <Phone size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold mb-2 uppercase tracking-widest text-foreground">Teléfonos</h4>
                                            <p className="text-lg text-muted-foreground">+57 (601) 123 4567</p>
                                            <p className="text-lg text-muted-foreground">+57 300 000 0000</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-6">
                                        <div className="bg-primary/10 p-4 rounded-xl text-primary h-fit">
                                            <MapPin size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold mb-2 uppercase tracking-widest text-foreground">Sede Principal</h4>
                                            <p className="text-lg text-muted-foreground">Barandillas-San Miguel #5A-36 INT 3, Zipaquirá</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-card p-12 lg:p-16 rounded-3xl border border-border shadow-premium relative">
                                <h2 className="text-3xl font-bold font-headline mb-8">Solicitud de <span className="text-primary italic">Información</span></h2>
                                <form action={async (formData) => {
                                    'use server';
                                    await createContactRequest(null, formData);
                                }} className="space-y-6 relative z-10">
                                    <div className="space-y-4">
                                        <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-2">Su Nombre</label>
                                        <Input name="name" className="h-16 bg-background rounded-xl border-border focus:ring-primary text-lg" placeholder="Nombre completo" required />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-2">Email de Contacto</label>
                                        <Input name="email" type="email" className="h-16 bg-background rounded-xl border-border focus:ring-primary text-lg" placeholder="email@ejemplo.com" required />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-2">Mensaje o Requerimiento</label>
                                        <Textarea name="message" className="min-h-[150px] bg-background rounded-xl border-border focus:ring-primary text-lg p-6" placeholder="Escriba su mensaje..." required />
                                    </div>
                                    <Button type="submit" size="lg" className="w-full h-20 text-xl font-bold shadow-neon mt-4">
                                        Enviar Consulta Corporativa
                                    </Button>
                                </form>
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <Clock size={120} />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="h-[500px] relative w-full grayscale opacity-50 contrast-125">
                    <Image
                        src={getPlaceholderImage('contact-map')?.imageUrl || ''}
                        alt="Mapa"
                        fill
                        className="object-cover"
                        style={{ filter: 'invert(1)' }}
                    />
                    <div className="absolute inset-0 bg-primary/20 mix-blend-multiply"></div>
                </section>
            </main>
            <Footer />
        </div >
    );
}
