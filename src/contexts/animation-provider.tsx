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
  const [animationConfig, setAnimationConfig] = useState({ intensity: 50, reasoning: 'Inicializando...' });
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
             // Si hay una notificación existente, descártala antes de mostrar una nueva
             const { dismiss } = useToast();
             dismiss(toastId);
          }

          const { id } = toast({
            title: (
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <span className="font-bold">Control de Animación IA</span>
              </div>
            ),
            description: (
              <div>
                <p>{result.reasoning}</p>
                <p className="font-medium mt-1">Intensidad ajustada a: <span className="text-accent font-bold">{result.animationIntensity.toFixed(0)}%</span></p>
              </div>
            ),
            duration: 5000,
          });
          toastId = id;
        }
      } catch (error) {
         console.error("No se pudo obtener la intensidad de la animación", error);
         if (isMounted) {
             setAnimationConfig({ intensity: 30, reasoning: 'Se volvió al valor predeterminado debido a un error.' });
         }
      }
    };

    // Búsqueda inicial
    fetchIntensity();

    // Actualizar cada 30 segundos
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
    // Respaldo para componentes de servidor o partes de la aplicación fuera del proveedor
    return { intensity: 50, reasoning: 'Valor predeterminado utilizado fuera del proveedor.' };
  }
  return context;
};
