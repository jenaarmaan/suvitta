import { config } from 'dotenv';
config();

import '@/ai/flows/translate-answer.ts';
import '@/ai/flows/suggest-queries.ts';
import '@/ai/flows/generate-answer.ts';
import '@/ai/flows/hello-flow.ts';
