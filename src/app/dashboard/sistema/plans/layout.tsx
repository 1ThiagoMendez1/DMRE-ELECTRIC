'use client';

import { PlansProvider } from '@/components/providers/plans-provider';

export default function PlansLayout({ children }: { children: React.ReactNode }) {
    return (
        <PlansProvider>
            {children}
        </PlansProvider>
    );
}
