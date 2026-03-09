'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MoveRight } from 'lucide-react';
import { AnimatedBackground } from './animated-background';

export function InteractiveHero() {
    return (
        <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden bg-background">
            <div className="absolute inset-0 z-0">
                <AnimatedBackground />
            </div>

            <div className="container mx-auto px-4 z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="inline-block mb-6 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-semibold tracking-wider uppercase backdrop-blur-md"
                >
                    líderes en ingeniería eléctrica de alta precisión
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-5xl md:text-7xl lg:text-8xl font-black font-headline tracking-tighter mb-8 leading-[0.9] text-foreground uppercase"
                >
                    Diseño y Montaje <br />
                    de <span className="text-primary italic">Redes</span> Eléctricas
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed"
                >
                    En D.M.R.E. diseñamos, construimos y operamos infraestructuras eléctricas inteligentes para los sectores más exigentes del país.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="flex flex-col sm:flex-row gap-6 justify-center items-center"
                >
                    <Button size="lg" asChild className="h-16 px-10 rounded-full text-xl font-bold shadow-neon hover:shadow-premium transition-all duration-300">
                        <Link href="/solutions">
                            Nuestras Soluciones <MoveRight className="ml-2 h-6 w-6" />
                        </Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild className="h-16 px-10 rounded-full text-xl font-bold border-2 hover:bg-primary/5 transition-all duration-300">
                        <Link href="/portfolio">
                            Ver Portafolio
                        </Link>
                    </Button>
                </motion.div>
            </div>

            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-50">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Explora</span>
                <div className="w-0.5 h-8 bg-gradient-to-b from-primary to-transparent rounded-full"></div>
            </div>
        </section>
    );
}
