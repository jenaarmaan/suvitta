'use server';

/**
 * @fileOverview A simple flow that returns a greeting.
 *
 * - hello - A function that takes a name and returns a greeting.
 * - HelloInput - The input type for the hello function.
 * - HelloOutput - The return type for the hello function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const HelloInputSchema = z.object({
  name: z.string().describe('The name to greet.'),
});
export type HelloInput = z.infer<typeof HelloInputSchema>;

export const HelloOutputSchema = z.object({
  greeting: z.string().describe('The greeting message.'),
});
export type HelloOutput = z.infer<typeof HelloOutputSchema>;

export async function hello(input: HelloInput): Promise<HelloOutput> {
  return helloFlow(input);
}

const helloFlow = ai.defineFlow(
  {
    name: 'helloFlow',
    inputSchema: HelloInputSchema,
    outputSchema: HelloOutputSchema,
  },
  async (input) => {
    return {
      greeting: `Hello, ${input.name}!`,
    };
  }
);
