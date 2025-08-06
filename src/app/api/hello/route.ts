import { NextRequest, NextResponse } from 'next/server';
import { hello, HelloInputSchema } from '@/ai/flows/hello-flow';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate the request body against the Zod schema
    const parsedInput = HelloInputSchema.safeParse(body);

    if (!parsedInput.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsedInput.error.format() }, { status: 400 });
    }

    const result = await hello(parsedInput.data);
    
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    const error = e instanceof Error ? e.message : 'An unknown error occurred';
    return NextResponse.json({ error }, { status: 500 });
  }
}
