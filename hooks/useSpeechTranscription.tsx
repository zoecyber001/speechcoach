'use client';

import { useState, useRef, useCallback } from 'react';

interface TranscriptSegment {
    text: string;
    isFinal: boolean;
}

interface UseSpeechTranscriptionReturn {
    liveTranscript: TranscriptSegment[];
    interimTranscript: string;
    startTranscription: () => void;
    stopTranscription: () => void;
    resetTranscript: () => void;
    highlightFillerWords: (text: string) => React.ReactNode;
}

const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'literally', 'actually', 'right', 'so'];
const FILLER_REGEX = new RegExp(`\\b(${FILLER_WORDS.join('|')})\\b`, 'gi');

/**
 * Encapsulates the Web Speech API (webkitSpeechRecognition).
 * Provides live + interim transcript segments and a helper to highlight
 * filler words with a yellow badge — reusable in both live view and feedback panels.
 */
export function useSpeechTranscription(): UseSpeechTranscriptionReturn {
    const [liveTranscript, setLiveTranscript] = useState<TranscriptSegment[]>([]);
    const [interimTranscript, setInterimTranscript] = useState('');
    const recognitionRef = useRef<any>(null);

    const startTranscription = useCallback(() => {
        const SpeechRecognition =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
            let interim = '';
            const finals: TranscriptSegment[] = [];

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const text = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finals.push({ text, isFinal: true });
                } else {
                    interim += text;
                }
            }

            if (finals.length > 0) {
                setLiveTranscript((prev) => [...prev, ...finals]);
            }
            setInterimTranscript(interim);
        };

        recognition.start();
        recognitionRef.current = recognition;
    }, []);

    const stopTranscription = useCallback(() => {
        recognitionRef.current?.stop();
        recognitionRef.current = null;
        setInterimTranscript('');
    }, []);

    const resetTranscript = useCallback(() => {
        setLiveTranscript([]);
        setInterimTranscript('');
    }, []);

    /**
     * Returns JSX with filler words wrapped in a highlighted <span>.
     * Pure function — can be called from any component receiving this hook's return value.
     */
    const highlightFillerWords = useCallback((text: string): React.ReactNode => {
        if (!text) return null;
        const parts = text.split(FILLER_REGEX);
        return parts.map((part, i) =>
            FILLER_WORDS.includes(part.toLowerCase()) ? (
                <span
          key= { i }
          className = "bg-amber-200 text-amber-900 dark:bg-amber-700/40 dark:text-amber-200 px-1 rounded-md font-semibold text-xs"
            >
            { part }
            </span>
        ) : (
            <span key= { i } > { part } </span>
      )
    );
}, []);

return {
    liveTranscript,
    interimTranscript,
    startTranscription,
    stopTranscription,
    resetTranscript,
    highlightFillerWords,
};
}
