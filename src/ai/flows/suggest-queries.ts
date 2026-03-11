


'use server';

/**
 * @fileOverview Suggests relevant questions based on the uploaded document.
 *
 * - suggestQueries - A function that suggests relevant questions.
 * - SuggestQueriesInput - The input type for the suggestQueries function.
 * - SuggestQueriesOutput - The return type for the suggestQueries function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestQueriesInputSchema = z.object({
  documentContent: z.string().describe('The content of the uploaded document.'),
});
export type SuggestQueriesInput = z.infer<typeof SuggestQueriesInputSchema>;

const SuggestQueriesOutputSchema = z.object({
  suggestedQueries: z.array(z.string()).describe('An array of suggested questions based on the document content.'),
});
export type SuggestQueriesOutput = z.infer<typeof SuggestQueriesOutputSchema>;

export async function suggestQueries(input: SuggestQueriesInput): Promise<SuggestQueriesOutput> {
  return suggestQueriesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestQueriesPrompt',
  input: {schema: SuggestQueriesInputSchema},
  output: {schema: SuggestQueriesOutputSchema},
  prompt: `Given the following document content, suggest 3 relevant questions that a user might ask to understand the document better.\n\nDocument Content:\n{{{documentContent}}}\n\nSuggested Questions:\n`,
});

const suggestQueriesFlow = ai.defineFlow(
  {
    name: 'suggestQueriesFlow',
    inputSchema: SuggestQueriesInputSchema,
    outputSchema: SuggestQueriesOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      return output!;
    } catch(e) {
      console.error('Error suggesting queries:', e);
      // Return an empty list if there's an error, so it doesn't break the UI
      return { suggestedQueries: [] };
    }
  }
);
