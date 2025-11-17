'use server';

import { adaptAnimations } from '@/ai/flows/adaptive-animations';

/**
 * Obtiene la intensidad de animación sugerida del flujo de GenAI.
 * En una aplicación real, serverLoad provendría de un servicio de monitoreo.
 */
export async function getAnimationIntensity() {
  try {
    const serverLoad = Math.random() * 100;
    const result = await adaptAnimations({ serverLoad });
    return result;
  } catch (error) {
    console.error('Error al adaptar las animaciones:', error);
    // Volver a una intensidad predeterminada en caso de error
    return {
      animationIntensity: 50,
      reasoning: 'Se volvió al valor predeterminado debido a un error.',
    };
  }
}
