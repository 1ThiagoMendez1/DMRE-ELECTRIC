'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAnimationIntensity } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Bot } from 'lucide-react';

type AnimationContextType = {
  intensity: number; // 0-100
  reasoning: string;
};

const AnimationContext = createContext<AnimationContextType | null>(null);

export function AnimationProvider({ children }: { children: ReactNode }) {
  const [animationConfig, setAnimationConfig] = useState({ intensity: 50, reasoning: 'Initializing...' });
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    let toastId: string | undefined;

    const fetchIntensity = async () => {
      try {
        const result = await getAnimationIntensity();
        if (isMounted) {
          setAnimationConfig({ intensity: result.animationIntensity, reasoning: result.reasoning });
          
          if (toastId) {
             // If there's an existing toast, dismiss it before showing a new one
             const { dismiss } = useToast();
             dismiss(toastId);
          }

          const { id } = toast({
            title: (
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <span className="font-bold">AI Animation Control</span>
              </div>
            ),
            description: (
              <div>
                <p>{result.reasoning}</p>
                <p className="font-medium mt-1">Intensity set to: <span className="text-accent font-bold">{result.animationIntensity.toFixed(0)}%</span></p>
              </div>
            ),
            duration: 5000,
          });
          toastId = id;
        }
      } catch (error) {
         console.error("Failed to fetch animation intensity", error);
         if (isMounted) {
             setAnimationConfig({ intensity: 30, reasoning: 'Fell back to default due to an error.' });
         }
      }
    };

    // Initial fetch
    fetchIntensity();

    // Refresh every 30 seconds
    const interval = setInterval(fetchIntensity, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [toast]);

  return (
    <AnimationContext.Provider value={animationConfig}>
      {children}
    </AnimationContext.Provider>
  );
}

export const useAnimation = () => {
  const context = useContext(AnimationContext);
  if (!context) {
    // Fallback for server components or parts of the app outside the provider
    return { intensity: 50, reasoning: 'Default value used outside of provider.' };
  }
  return context;
};
