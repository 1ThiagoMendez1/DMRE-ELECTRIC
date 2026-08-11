'use client';

import { motion } from 'framer-motion';
import { Zap, ShieldCheck, Cpu, Layout, Workflow, Users } from 'lucide-react';

const steps = [
    {
        title: 'Consultoría Estratégica',
        description: 'Analizamos sus necesidades energéticas para diseñar la solución más eficiente y escalable.',
        icon: Layout,
    },
    {
        title: 'Ingeniería de Detalle',
        description: 'Nuestros ingenieros expertos crean planos y especificaciones técnicas de alta precisión.',
        icon: Cpu,
    },
    {
        title: 'Gestión de Suministros',
        description: 'Seleccionamos los mejores componentes y materiales certificados para garantizar durabilidad.',
        icon: ShieldCheck,
    },
    {
        title: 'Ejecución y Montaje',
        description: 'Implementamos el proyecto siguiendo los más altos estándares de seguridad y calidad.',
        icon: Zap,
    },
    {
        title: 'Control de Calidad',
        description: 'Realizamos pruebas rigurosas para asegurar que todo funcione a la perfección.',
        icon: Workflow,
    },
    {
        title: 'Soporte y Operación',
        description: 'Brindamos acompañamiento continuo para mantener su infraestructura en óptimas condiciones.',
        icon: Users,
    },
];

export function ProcessSection() {
    return (
        <section className="py-16 md:py-24 lg:py-32 bg-background relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-3xl mb-16">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-headline text-foreground mb-4 md:mb-6">
                        Nuestra Metodología de Éxito
                    </h2>
                    <p className="text-lg md:text-xl text-muted-foreground">
                        Desde la concepción hasta la operación, aplicamos un proceso riguroso para asegurar la excelencia en cada kilovatio.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-12 relative">
                    {/* Decorative lines for "process" flow could be added here */}
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="relative p-8 rounded-2xl border border-border bg-card/50 backdrop-blur-sm hover:shadow-premium transition-all duration-300 group"
                        >
                            <div className="mb-6 inline-flex p-4 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                                <step.icon size={32} />
                            </div>
                            <h3 className="text-2xl font-bold font-headline mb-4 text-foreground">
                                {String(index + 1).padStart(2, '0')}. {step.title}
                            </h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {step.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
