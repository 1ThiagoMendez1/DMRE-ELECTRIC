// src/ai/flows/adaptive-animations.ts
'use server';
/**
 * @fileOverview A flow that controls website animations based on server load.
 *
 * - adaptAnimations - A function that adjusts animation intensity based on server load.
 * - AdaptAnimationsInput - The input type for the adaptAnimations function.
 * - AdaptAnimationsOutput - The return type for the adaptAnimations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdaptAnimationsInputSchema = z.object({
  serverLoad: z
    .number()
    .describe("The current server load, as a percentage (0-100)."),
});
export type AdaptAnimationsInput = z.infer<typeof AdaptAnimationsInputSchema>;

const AdaptAnimationsOutputSchema = z.object({
  animationIntensity: z
    .number()
    .describe("The suggested animation intensity, as a percentage (0-100)."),
  reasoning: z
    .string()
    .describe("The AI's reasoning for the suggested animation intensity."),
});
export type AdaptAnimationsOutput = z.infer<typeof AdaptAnimationsOutputSchema>;

export async function adaptAnimations(input: AdaptAnimationsInput): Promise<AdaptAnimationsOutput> {
  return adaptAnimationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adaptAnimationsPrompt',
  input: {schema: AdaptAnimationsInputSchema},
  output: {schema: AdaptAnimationsOutputSchema},
  prompt: `You are an AI assistant that dynamically adjusts the animation intensity of a website based on the current server load.

  The goal is to enhance the user experience by increasing animations during idle periods and reducing them during high load to maintain performance.

  Current Server Load: {{serverLoad}}%

  Instructions:
  1. Analyze the current server load.
  2. Determine the appropriate animation intensity (0-100%).
  3. Provide a brief reasoning for your decision.

  Output:
  - animationIntensity: The suggested animation intensity as a percentage (0-100).
  - reasoning: A brief explanation of why this intensity level was chosen, considering server load and user experience.
  Output in JSON format.
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
