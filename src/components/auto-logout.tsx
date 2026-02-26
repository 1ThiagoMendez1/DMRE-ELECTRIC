'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/hooks/use-toast';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

export function AutoLogout() {
    const router = useRouter();
    const { toast } = useToast();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const supabase = createClient();

        const handleLogout = async () => {
            // Sign out from Supabase
            await supabase.auth.signOut();

            // Show a toast message to the user
            toast({
                title: 'Sesión cerrada',
                description: 'Tu sesión ha sido cerrada por inactividad.',
                variant: 'destructive',
            });

            // Redirect to the login page
            router.push('/login');
            router.refresh();
        };

        const resetTimer = () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(handleLogout, INACTIVITY_TIMEOUT);
        };

        // Initialize the timer
        resetTimer();

        // List of events that reset the timer
        const events = [
            'mousemove',
            'mousedown',
            'keypress',
            'touchmove',
            'scroll'
        ];

        // Add event listeners to the window
        events.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        // Cleanup function
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            events.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [router, toast]);

    return null; // This component doesn't render anything
}
