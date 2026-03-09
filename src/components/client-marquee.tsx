'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

const logos = [
    { name: 'Enel', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Enel_logo.svg/1200px-Enel_logo.svg.png' },
    { name: 'EPM', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Logo_EPM.svg/1200px-Logo_EPM.svg.png' },
    { name: 'Celsia', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Logo-celsia.svg/2560px-Logo-celsia.svg.png' },
    { name: 'ISA', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Logo_ISA.svg/1200px-Logo_ISA.svg.png' },
    { name: 'Siemens', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Siemens-logo.svg/2560px-Siemens-logo.svg.png' },
    { name: 'ABB', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/ABB_logo.svg/2560px-ABB_logo.svg.png' },
];

export function ClientMarquee() {
    return (
        <div className="py-12 bg-background/50 border-y border-border/50 overflow-hidden">
            <div className="container mx-auto px-4 mb-8 text-center">
                <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                    Empresas que confían en nosotros
                </p>
            </div>
            <div className="relative flex overflow-x-hidden">
                <div className="animate-marquee whitespace-nowrap flex items-center gap-16 py-4">
                    {[...logos, ...logos].map((logo, index) => (
                        <div key={index} className="flex items-center justify-center w-40 h-20 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                            <Image
                                src={logo.url}
                                alt={logo.name}
                                width={160}
                                height={80}
                                className="max-w-full max-h-full object-contain"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
