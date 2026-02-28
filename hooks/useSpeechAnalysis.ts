'use client';

import { useState, useCallback } from 'react';
import type { CoachFeedback, SpeechIntent } from '@/lib/types';

interface UseSpeechAnalysisReturn {
    isAnalyzing: boolean;
    feedback: CoachFeedback | null;
    analysisError: string | null;
    analyze: (audioBlob: Blob, intent: SpeechIntent) => Promise<CoachFeedback | null>;
    setFeedback: (fb: CoachFeedback | null) => void;
    clearFeedback: () => void;
}

// posts audio to /api/analyze and gives back structured feedback
// the actual gemini call happens server-side, this is just the fetch wrapper
export function useSpeechAnalysis(): UseSpeechAnalysisReturn {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [feedback, setFeedback] = useState<CoachFeedback | null>(null);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    const analyze = useCallback(
        async (audioBlob: Blob, intent: SpeechIntent): Promise<CoachFeedback | null> => {
            setIsAnalyzing(true);
            setAnalysisError(null);

            try {
                // blob -> base64 so we can send it as JSON
                const base64 = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const result = reader.result as string;
                        resolve(result.split(',')[1]); // strip data-URL prefix
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(audioBlob);
                });

                const response = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        audioBase64: base64,
                        mimeType: audioBlob.type || 'audio/webm',
                        intent,
                    }),
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error ?? `HTTP ${response.status}`);
                }

                const data: CoachFeedback = await response.json();
                setFeedback(data);
                return data;
            } catch (err: any) {
                const msg = err?.message ?? 'Analysis failed. Please try again.';
                console.error('[useSpeechAnalysis]', err);
                setAnalysisError(msg);
                return null;
            } finally {
                setIsAnalyzing(false);
            }
        },
        []
    );

    const clearFeedback = useCallback(() => {
        setFeedback(null);
        setAnalysisError(null);
    }, []);

    return { isAnalyzing, feedback, analysisError, analyze, setFeedback, clearFeedback };
}
