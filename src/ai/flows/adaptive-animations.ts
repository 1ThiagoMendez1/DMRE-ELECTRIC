'use server';
/**
 * @fileOverview Un flujo que controla las animaciones del sitio web según la carga del servidor.
 *
 * - adaptAnimations - Una función que ajusta la intensidad de la animación según la carga del servidor.
 * - AdaptAnimationsInput - El tipo de entrada para la función adaptAnimations.
 * - AdaptAnimationsOutput - El tipo de retorno para la función adaptAnimations.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdaptAnimationsInputSchema = z.object({
  serverLoad: z
    .number()
    .describe("La carga actual del servidor, como un porcentaje (0-100)."),
});
export type AdaptAnimationsInput = z.infer<typeof AdaptAnimationsInputSchema>;

const AdaptAnimationsOutputSchema = z.object({
  animationIntensity: z
    .number()
    .describe("La intensidad de animación sugerida, como un porcentaje (0-100)."),
  reasoning: z
    .string()
    .describe("El razonamiento de la IA para la intensidad de animación sugerida."),
});
export type AdaptAnimationsOutput = z.infer<typeof AdaptAnimationsOutputSchema>;

export async function adaptAnimations(input: AdaptAnimationsInput): Promise<AdaptAnimationsOutput> {
  return adaptAnimationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adaptAnimationsPrompt',
  input: {schema: AdaptAnimationsInputSchema},
  output: {schema: AdaptAnimationsOutputSchema},
  prompt: `Eres un asistente de IA que ajusta dinámicamente la intensidad de la animación de un sitio web en función de la carga actual del servidor.

  El objetivo es mejorar la experiencia del usuario aumentando las animaciones durante los períodos de inactividad y reduciéndolas durante la alta carga para mantener el rendimiento.

  Carga actual del servidor: {{serverLoad}}%

  Instrucciones:
  1. Analiza la carga actual del servidor.
  2. Determina la intensidad de animación apropiada (0-100%).
  3. Proporciona un breve razonamiento para tu decisión.

  Salida:
  - animationIntensity: La intensidad de animación sugerida como un porcentaje (0-100).
  - reasoning: Una breve explicación de por qué se eligió este nivel de intensidad, considerando la carga del servidor y la experiencia del usuario.
  Salida en formato JSON.
  `,
});

const adaptAnimationsFlow = ai.defineFlow(
  {
    name: 'adaptAnimationsFlow',
    inputSchema: AdaptAnimationsInputSchema,
    outputSchema: AdaptAnimationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
