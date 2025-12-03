


// app/api/destinations/random/route.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function GET(request: NextRequest) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    

    // Strict format enforcement
    const prompt = `You are a travel content generator.
Give me a random tourist destination or city from anywhere in the world.
Avoid repeating popular cities from EVERY COUNTRY THE OTHER COUNTREY AND THE OTHER SUB CONTINENT AND THE OTHER COUNTRY...I WANT U REALLY TO RANDOMIZE THE COUNTRY AND LOCATIONS..SO THE CURRENT TIMES SECONDS WLL BE A DIFFERENT COUNTRY.. Here is a random number for variety: ${Math.random()*10000}.

Output must follow this EXACT format:
Line 1: City, Country
Line 2: One sentence description.
Line 3: One sentence description.
Line 4: One sentence description.
Line 5: One sentence description.
Line 6: One sentence description.

Rules:
- No bold text, no markdown, no numbering, no extra lines, no lists.
- Each sentence should be engaging, informative, and under 25 words.
- Do not include any headings or introductions before the city name.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log("Gemini raw output:", text);

    // Parse into destination + description
    const lines = text.trim().split('\n').filter(line => line.trim());
    const destinationName = lines[0];
    const description = lines.slice(1).join('\n');

    return NextResponse.json({
      destination: destinationName,
      description: description
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json(
      { error: 'Failed to get destination suggestion' },
      { status: 500 }
    );
  }
}
