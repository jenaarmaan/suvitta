// src/ai/flows/generate-answer.ts

/**
 * @fileOverview A flow to generate answers from financial documents based on user questions.
 *
 * - generateAnswer - A function that handles the answer generation process.
 * - GenerateAnswerInput - The input type for the generateAnswer function.
 * - GenerateAnswerOutput - The return type for the generateAnswer function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateAnswerInputSchema = z.object({
  documentDataUri: z.string().describe("The document content as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  question: z.string().describe('The question asked by the user in natural language.'),
});
export type GenerateAnswerInput = z.infer<typeof GenerateAnswerInputSchema>;

const GenerateAnswerOutputSchema = z.object({
  decision: z.string().describe('The decision based on the document content (e.g., Covered, Not Covered).'),
  summary: z.string().describe('A quick summary of the answer.'),
  explanation: z.string().describe('A detailed explanation of the reasoning behind the decision.'),
  clauseQuote: z.string().describe('A quote from the document clause that supports the decision.'),
  amount: z.number().optional().describe('The payout or coverage amount, if specified in the document.'),
});
export type GenerateAnswerOutput = z.infer<typeof GenerateAnswerOutputSchema>;

export async function generateAnswer(input: GenerateAnswerInput): Promise<GenerateAnswerOutput> {
  console.log("📥 generateAnswer() called for data URI and question '", input.question, "'");
  const result = await generateAnswerFlow(input);
  console.log("✅ JSON Output:\n", JSON.stringify(result, null, 2));
  return result;
}

const generateAnswerFromDocumentPrompt = ai.definePrompt({
  name: 'generateAnswerFromDocumentPrompt',
  // Use a powerful vision-capable model to handle various document types.
  model: 'googleai/gemini-2.0-flash',
  input: { 
    schema: GenerateAnswerInputSchema,
    // Note: Genkit automatically handles the data URI in the `media` field.
    // The '{{documentDataUri}}' handlebar is a placeholder for the media content.
    media: { url: '{{documentDataUri}}' }
  },
  output: { schema: GenerateAnswerOutputSchema },
  // This single, powerful prompt handles both OCR and Q&A.
  prompt: `You are an AI assistant specialized in analyzing financial documents and answering user questions.

  First, perform a thorough OCR and text extraction on the provided document. The document can be a PDF, DOCX, or an image.
  
  Once you have extracted the full text, analyze the entire document content to answer the user's Question. Provide a clear decision, a concise summary, a detailed explanation, and a relevant clause quote from the document text.

  Question: {{{question}}}

  Follow these instructions carefully:
  1.  **Decision**: Provide a definitive decision (e.g., "Covered", "Not Covered", "Partially Covered"). Avoid vague answers like "Unable to Determine" unless the document is completely irrelevant or unreadable.
  2.  **Summary**: Give a brief summary of the answer in one or two sentences.
  3.  **Explanation**: Explain the reasoning behind your decision in a clear and understandable manner, citing the logic from the document.
  4.  **Clause Quote**: Quote the exact document clause that is the primary support for your decision.
  5.  **Amount**: If the document specifies a payout or coverage amount relevant to the question, extract it as a number. If no amount is found, omit this field.

  Ensure your response is accurate, directly based on the provided document, and helpful to the user.
  `,
});


// The main flow now uses the single, powerful prompt.
const generateAnswerFlow = ai.defineFlow(
  {
    name: 'generateAnswerFlow',
    inputSchema: GenerateAnswerInputSchema,
    outputSchema: GenerateAnswerOutputSchema,
  },
  async (input) => {
    
    // Step 1: Generate answer directly from the document.
    const { output } = await generateAnswerFromDocumentPrompt(input);

    if (!output) {
      console.error("Analysis failed: The AI model did not return a valid output.");
      throw new Error('The AI model could not generate an answer. Please try again.');
    }
    
    return output;
  }
);
