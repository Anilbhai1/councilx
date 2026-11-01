import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { NextResponse } from 'next/server';

// Remove runtime='edge' ONLY IF you are importing yahoo-finance2 directly in this file. Otherwise, keep it edge.

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    // 1. FORCEFUL CHECK
    if (!apiKey) {
      console.error("CRITICAL ERROR: GEMINI_API_KEY is missing from environment variables.");
      return NextResponse.json({ error: "Server Configuration Error: API Key missing." }, { status: 500 });
    }

    // 2. EXPLICIT INITIALIZATION
    const google = createGoogleGenerativeAI({ apiKey: apiKey });
    
    const body = await req.json().catch(() => ({}));
    const { data } = body;
    const messages = (Array.isArray(body.messages) && body.messages.length > 0)
      ? body.messages
      : [{ role: 'user', content: body.userMessage || body.userQuery || body.prompt || 'Provide Oracle market intelligence.' }];

    // 3. AI GENERATION
    const result = await streamText({
      model: google('models/gemini-1.5-pro-latest'), // Or your specific model
      messages,
      system: "You are Council X, an elite financial oracle featuring 216 historical masterminds. Provide brutal, deep, cinematic A-to-Z financial intelligence based strictly on real market data. Never use markdown tables.",
    });

    return result.toDataStreamResponse();

  } catch (error: any) {
    console.error("FATAL AI ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
