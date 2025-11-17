'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAnimationIntensity } from '@/app/actions';

type AnimationContextType = {
  intensity: number; // 0-100
  reasoning: string;
};

const AnimationContext = createContext<AnimationContextType | null>(null);

export function AnimationProvider({ children }: { children: ReactNode }) {
  const [animationConfig, setAnimationConfig] = useState({ intensity: 50, reasoning: 'Inicializando...' });

  useEffect(() => {
    let isMounted = true;
    
    const fetchIntensity = async () => {
      try {
        const result = await getAnimationIntensity();
        if (isMounted) {
          setAnimationConfig({ intensity: result.animationIntensity, reasoning: result.reasoning });
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
  }, []);

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
