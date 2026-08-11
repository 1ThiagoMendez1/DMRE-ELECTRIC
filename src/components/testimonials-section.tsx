'use client';

import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import Image from 'next/image';

const testimonials = [
    {
        quote: "La precisión técnica y el cumplimiento de los cronogramas por parte de DMRE superó todas nuestras expectativas en el proyecto de la subestación industrial.",
        author: "Ing. Carlos Mendoza",
        role: "Director de Infraestructura, Enel Colombia",
        avatar: "https://i.pravatar.cc/150?u=carlos"
    },
    {
        quote: "Es poco común encontrar una empresa con tal nivel de detalle en la ingeniería de MT. Son verdaderos aliados estratégicos para cualquier operación crítica.",
        author: "Dra. Elena Rivas",
        role: "Gerente de Operaciones, Celsia",
        avatar: "https://i.pravatar.cc/150?u=elena"
    },
    {
        quote: "Desde el diseño hasta el montaje final, el profesionalismo del equipo DMRE fue impecable. Definitivamente líderes en el sector.",
        author: "Arq. Roberto Gómez",
        role: "Socio Principal, Constructora Bolívar",
        avatar: "https://i.pravatar.cc/150?u=roberto"
    }
];

export function TestimonialsSection() {
    return (
        <section className="py-16 md:py-24 lg:py-32 bg-background relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-12 md:mb-16">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-headline text-foreground mb-4 md:mb-6">Voces de <span className="text-primary italic">Confianza</span></h2>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                        El testimonio de nuestros aliados corporativos es el mejor aval de nuestra excelencia técnica.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
                    {testimonials.map((t, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="p-10 rounded-3xl bg-card border border-border shadow-sm hover:shadow-premium transition-all duration-500 flex flex-col justify-between"
                        >
                            <div>
                                <Quote className="text-primary/20 mb-6" size={48} />
                                <p className="text-xl italic text-muted-foreground leading-relaxed mb-8">
                                    "{t.quote}"
                                </p>
                            </div>
                            <div className="flex items-center gap-4 border-t border-border pt-8">
                                <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-primary/20">
                                    <Image src={t.avatar} alt={t.author} fill className="object-cover" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-foreground text-lg">{t.author}</h4>
                                    <p className="text-sm text-primary uppercase tracking-widest font-black leading-tight">{t.role}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
