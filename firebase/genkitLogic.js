
'use server';
/**
 * @fileOverview A flow to generate answers from financial documents based on user questions.
 * This file is designed to be imported by the Vercel serverless function.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'genkit';

// Initialize Genkit and the Google AI plugin
const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});

const GenerateAnswerInputSchema = z.object({
  documentDataUri: z.string().describe("The document content as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  question: z.string().describe('The question asked by the user in natural language.'),
});

const GenerateAnswerOutputSchema = z.object({
  decision: z.string().describe('The decision based on the document content (e.g., Covered, Not Covered).'),
  summary: z.string().describe('A quick summary of the answer.'),
  explanation: z.string().describe('A detailed explanation of the reasoning behind the decision.'),
  clauseQuote: z.string().describe('A quote from the document clause that supports the decision.'),
  amount: z.number().optional().describe('The payout or coverage amount, if specified in the document.'),
});

const generateAnswerFromDocumentPrompt = ai.definePrompt({
  name: 'generateAnswerFromDocumentPrompt',
  model: 'googleai/gemini-2.0-flash',
  input: {
    schema: GenerateAnswerInputSchema,
    media: { url: '{{documentDataUri}}' }
  },
  output: { schema: GenerateAnswerOutputSchema },
  prompt: `You are an AI assistant specialized in analyzing financial documents and answering user questions.
  Analyze the entire document content to answer the user's Question. Provide a clear decision, a concise summary, a detailed explanation, and a relevant clause quote from the document text.
  Question: {{{question}}}
  Follow these instructions carefully:
  1.  **Decision**: Provide a definitive decision (e.g., "Covered", "Not Covered").
  2.  **Summary**: Give a brief summary of the answer.
  3.  **Explanation**: Explain the reasoning behind your decision.
  4.  **Clause Quote**: Quote the exact document clause that supports your decision.
  5.  **Amount**: If a specific amount is mentioned, extract it. Omit if not found.
  `,
});

export const generateAnswerFlow = ai.defineFlow(
  {
    name: 'generateAnswerFlow',
    inputSchema: GenerateAnswerInputSchema,
    outputSchema: GenerateAnswerOutputSchema,
  },
  async (input) => {
    const { output } = await generateAnswerFromDocumentPrompt(input);
    if (!output) {
      throw new Error('The AI model could not generate an answer.');
    }
    return output;
  }
);
