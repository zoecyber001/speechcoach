'use client';

import { useState, useCallback } from 'react';
import type { CoachFeedback, SpeechIntent } from '@/lib/types';

interface UseSpeechAnalysisReturn {
    isAnalyzing: boolean;
    feedback: CoachFeedback | null;
    analysisError: string | null;
    analyze: (audioBlob: Blob, intent: SpeechIntent) => Promise<CoachFeedback | null>;
    clearFeedback: () => void;
}

/**
 * Manages the async state machine for posting audio to /api/analyze
 * and receiving the structured CoachFeedback JSON.
 * The actual Gemini call lives server-side — this hook is purely a fetch client.
 */
export function useSpeechAnalysis(): UseSpeechAnalysisReturn {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [feedback, setFeedback] = useState<CoachFeedback | null>(null);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    const analyze = useCallback(
        async (audioBlob: Blob, intent: SpeechIntent): Promise<CoachFeedback | null> => {
            setIsAnalyzing(true);
            setAnalysisError(null);

            try {
                // Convert blob → base64 string for JSON transport
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

    return { isAnalyzing, feedback, analysisError, analyze, clearFeedback };
}
