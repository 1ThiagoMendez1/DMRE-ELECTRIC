'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

interface Stat {
    label: string;
    value: number;
    suffix?: string;
}

const stats: Stat[] = [
    { label: 'Años de Experiencia', value: 15, suffix: '+' },
    { label: 'Proyectos Completados', value: 450, suffix: '+' },
    { label: 'Ciudades Alcanzadas', value: 24 },
    { label: 'Ingenieros Expertos', value: 35 },
];

export function StatsSection() {
    return (
        <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            </div>
            <div className="container mx-auto px-4 relative z-10">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
                    {stats.map((stat, index) => (
                        <StatItem key={index} stat={stat} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function StatItem({ stat, index }: { stat: Stat; index: number }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (isInView) {
            let start = 0;
            const end = stat.value;
            const duration = 2000;
            let startTime: number | null = null;

            const animate = (timestamp: number) => {
                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / duration, 1);
                setCount(Math.floor(progress * (end - start) + start));
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };

            requestAnimationFrame(animate);
        }
    }, [isInView, stat.value]);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="flex flex-col gap-2"
        >
            <span className="text-5xl lg:text-7xl font-bold font-headline tracking-tighter">
                {count}{stat.suffix}
            </span>
            <span className="text-primary-foreground/70 uppercase tracking-widest text-sm font-semibold">
                {stat.label}
            </span>
        </motion.div>
    );
}
