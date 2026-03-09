import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { services } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

export default function SolutionsPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow pt-32">
                <section className="py-20 bg-primary text-primary-foreground">
                    <div className="container mx-auto px-4">
                        <h1 className="text-5xl lg:text-7xl font-black font-headline mb-8">Soluciones <span className="italic opacity-50">Enterprise</span></h1>
                        <p className="text-2xl max-w-3xl opacity-80 leading-relaxed">
                            Ingeniería eléctrica de alta precisión diseñada para los sectores industrial, comercial y residencial más exigentes.
                        </p>
                    </div>
                </section>

                <section className="py-24 bg-background">
                    <div className="container mx-auto px-4">
                        <div className="grid gap-16">
                            {services.map((service, index) => (
                                <div key={index} className="grid lg:grid-cols-2 gap-12 items-center border-b border-border pb-16 last:border-0">
                                    <div className={index % 2 === 0 ? '' : 'lg:order-2'}>
                                        <div className="bg-primary/10 w-20 h-20 rounded-2xl flex items-center justify-center text-primary mb-8">
                                            <service.icon size={40} />
                                        </div>
                                        <h2 className="text-4xl font-bold font-headline mb-6">{service.title}</h2>
                                        <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                                            {service.description}
                                        </p>
                                        <ul className="space-y-4">
                                            {['Diseño conceptual avanzada', 'Cumplimiento normativo RETIE/NTC 2050', 'Eficiencia energética garantizada'].map((item, i) => (
                                                <li key={i} className="flex items-center gap-3 text-lg">
                                                    <CheckCircle2 className="text-primary" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className={`aspect-video rounded-3xl bg-secondary/30 relative overflow-hidden shadow-premium ${index % 2 === 0 ? 'lg:order-2' : ''}`}>
                                        {/* Placeholder for service image */}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
