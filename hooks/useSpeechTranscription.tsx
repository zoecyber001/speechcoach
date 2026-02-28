'use client';

import { useState, useRef, useCallback } from 'react';

interface TranscriptSegment {
    text: string;
    isFinal: boolean;
}

interface UseSpeechTranscriptionReturn {
    liveTranscript: TranscriptSegment[];
    interimTranscript: string;
    fillerCount: number;
    startTranscription: () => void;
    stopTranscription: () => void;
    resetTranscript: () => void;
    highlightFillerWords: (text: string) => React.ReactNode;
}

const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'literally', 'actually', 'right', 'so'];
const FILLER_REGEX = new RegExp(`\\b(${FILLER_WORDS.join('|')})\\b`, 'gi');

// wraps the browser's SpeechRecognition API for live transcription
// also has a helper to highlight filler words like "um" and "like"
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
        recognition.lang = 'en-US';

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

        // auto-restart on unexpected end (browsers kill it after silence)
        recognition.onend = () => {
            if (recognitionRef.current === recognition) {
                try { recognition.start(); } catch { /* already running */ }
            }
        };

        recognition.onerror = (e: any) => {
            console.warn('[SpeechRecognition] error:', e.error);
            // 'no-speech' is normal during silence — don't kill the session
            if (e.error === 'aborted') {
                recognitionRef.current = null;
            }
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

    // wraps filler words in a highlighted span so they stand out
    const highlightFillerWords = useCallback((text: string): React.ReactNode => {
        if (!text) return null;
        const parts = text.split(FILLER_REGEX);
        return parts.map((part, i) =>
            FILLER_WORDS.includes(part.toLowerCase()) ? (
                <span
                    key={i}
                    className="bg-amber-200 text-amber-900 dark:bg-amber-700/40 dark:text-amber-200 px-1 rounded-md font-semibold text-xs"
                >
                    {part}
                </span>
            ) : (
                <span key={i} > {part} </span>
            )
        );
    }, []);

    const countFillersInText = (text: string) => {
        if (!text) return 0;
        const matches = text.match(FILLER_REGEX);
        return matches ? matches.length : 0;
    };

    const fillerCount =
        liveTranscript.reduce((acc, seg) => acc + countFillersInText(seg.text), 0) +
        countFillersInText(interimTranscript);

    return {
        liveTranscript,
        interimTranscript,
        fillerCount,
        startTranscription,
        stopTranscription,
        resetTranscript,
        highlightFillerWords,
    };
}
