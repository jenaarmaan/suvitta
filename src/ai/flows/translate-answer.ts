// src/ai/flows/translate-answer.ts


/**
 * @fileOverview Translates the AI's response into the user's selected language.
 *
 * - translateAnswer - A function that translates the given text to a specified language.
 * - TranslateAnswerInput - The input type for the translateAnswer function.
 * - TranslateAnswerOutput - The return type for the translateAnswer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateAnswerInputSchema = z.object({
  text: z.string().describe('The text to translate.'),
  targetLanguage: z.string().describe('The target language to translate the text to.'),
});

export type TranslateAnswerInput = z.infer<typeof TranslateAnswerInputSchema>;

const TranslateAnswerOutputSchema = z.object({
  translatedText: z.string().describe('The translated text.'),
});

export type TranslateAnswerOutput = z.infer<typeof TranslateAnswerOutputSchema>;

export async function translateAnswer(input: TranslateAnswerInput): Promise<TranslateAnswerOutput> {
  return translateAnswerFlow(input);
}

const translateAnswerPrompt = ai.definePrompt({
  name: 'translateAnswerPrompt',
  input: {schema: TranslateAnswerInputSchema},
  output: {schema: TranslateAnswerOutputSchema},
  prompt: `Translate the following text to {{targetLanguage}}:

{{{text}}}`,
});

const translateAnswerFlow = ai.defineFlow(
  {
    name: 'translateAnswerFlow',
    inputSchema: TranslateAnswerInputSchema,
    outputSchema: TranslateAnswerOutputSchema,
  },
  async input => {
    const {output} = await translateAnswerPrompt(input);
    return output!;
  }
);
