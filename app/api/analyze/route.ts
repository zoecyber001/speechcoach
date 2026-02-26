import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// ── Architect's Note ────────────────────────────────────────────────────────
// The API key lives exclusively here (server-side). Never expose it with
// NEXT_PUBLIC_ prefix. The client posts raw audio + intent; only the JSON
// CoachFeedback shape is returned.
// ────────────────────────────────────────────────────────────────────────────

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const EXPERT_PROMPT = (intent: string) => `
You are an elite speech coach trained in three expert frameworks. Analyze the provided audio recording and return a structured JSON object — no markdown, no prose outside the JSON.

The speaker's stated intent was: "${intent.toUpperCase()}"

Apply these three analytical lenses:

1. **VINH GIANG — Vocal Mechanics (breakdown.mechanics)**
   Analyze the "Vocal Toolbox": 
   - Rate variation (does the speaker speed up / slow down for effect, or stay monotone?)
   - Pitch spikes (is pitch used to signal emphasis on key words?)
   - Strategic pauses (are silences used intentionally, or is the speaker filler-rushing?)
   Estimate the approximate syllable rate in syllables per minute ("pacingBpm").

2. **NICK MORGAN — Narrative & Intent (breakdown.story)**
   Does the vocal energy match the speaker's stated intent of "${intent}"?
   - A persuasive delivery should have rising energy toward key claims.
   - An inspiring delivery needs rhythmic waves of tension and release.
   - Evaluate whether the speech follows a clear narrative arc or feels like a data dump.

3. **CONNIE DIEKEN — Presence & Rapport (breakdown.presence)**
   Does the speaker establish connective tissue in the first ~30 seconds?
   - Do they open by acknowledging the audience/context, or dive straight into content?
   - Is the delivery purposeful or passive?
   - Does the speaker "pivot" effectively when transitioning topics?

Return ONLY valid JSON matching this exact schema:
{
  "score": <integer 0-100, holistic coaching score>,
  "transcription": "<accurate transcription including filler words: um, uh, like, etc.>",
  "breakdown": {
    "mechanics": "<2-4 sentence Giang analysis>",
    "story": "<2-4 sentence Morgan analysis>",
    "presence": "<2-4 sentence Dieken analysis>"
  },
  "fillerWordCount": <integer count of um/uh/like/you know/basically/literally/actually/right/so>,
  "pacingBpm": <integer, estimated syllables per minute>,
  "drills": [
    {
      "module": "<one of: articulation | pacing | breathing | fillers>",
      "reason": "<one sentence explaining why this drill is recommended>",
      "bpmTarget": <optional integer, only include if module is "pacing", recommend a target practice BPM>
    }
  ]
}

drills array must contain 2–3 items, each targeting the speaker's weakest areas.
`;

export async function POST(request: NextRequest) {
    try {
        const { audioBase64, mimeType, intent } = await request.json();

        if (!audioBase64 || !mimeType || !intent) {
            return NextResponse.json(
                { error: 'Missing required fields: audioBase64, mimeType, intent' },
                { status: 400 }
            );
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-05-14',
            contents: [
                {
                    inlineData: {
                        data: audioBase64,
                        mimeType,
                    },
                },
                { text: EXPERT_PROMPT(intent) },
            ],
        });

        const rawText = response.text?.trim() ?? '';

        // Strip optional markdown fences Gemini may still wrap around JSON
        const jsonText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
        const feedback = JSON.parse(jsonText);

        return NextResponse.json(feedback);
    } catch (err) {
        console.error('[/api/analyze]', err);
        return NextResponse.json(
            { error: 'Analysis failed. Check server logs.' },
            { status: 500 }
        );
    }
}
