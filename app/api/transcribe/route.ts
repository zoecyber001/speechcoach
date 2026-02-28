import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const TRANSCRIBE_PROMPT = `
You are a precise speech transcription engine. Listen to the provided audio and return a JSON object with:

1. "transcription" - An accurate, complete transcription of the speech. Include EVERY filler word exactly as spoken (um, uh, like, you know, basically, literally, actually, right, so).
2. "fillerWords" - An array of every filler word instance found, preserving order. Each entry is the exact filler word spoken.
3. "fillerCount" - The total integer count of filler words detected.

Be ruthlessly accurate with filler detection. Even partial "um"s and trailing "uh"s count.

Return ONLY valid JSON matching this schema:
{
  "transcription": "<full transcription with fillers included>",
  "fillerWords": ["um", "uh", "like", ...],
  "fillerCount": <integer>
}
`;

export async function POST(request: NextRequest) {
    try {
        const { audioBase64, mimeType } = await request.json();

        if (!audioBase64 || !mimeType) {
            return NextResponse.json(
                { error: 'Missing required fields: audioBase64, mimeType' },
                { status: 400 }
            );
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    inlineData: {
                        data: audioBase64,
                        mimeType,
                    },
                },
                { text: TRANSCRIBE_PROMPT },
            ],
            config: {
                responseMimeType: 'application/json',
            },
        });

        const rawText = response.text?.trim() ?? '';
        const result = JSON.parse(rawText);

        return NextResponse.json(result);
    } catch (err) {
        console.error('[/api/transcribe]', err);
        return NextResponse.json(
            { error: 'Transcription failed. Check server logs.' },
            { status: 500 }
        );
    }
}
