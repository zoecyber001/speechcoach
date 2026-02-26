'use client';

import { useState, useRef, useCallback } from 'react';

interface UseRecorderReturn {
    isRecording: boolean;
    duration: number;
    audioBlob: Blob | null;
    audioDatUrl: string | null;
    startRecording: () => Promise<MediaStream | null>;
    stopRecording: () => void;
}

/**
 * Encapsulates the full MediaRecorder lifecycle.
 * Returns the final audio blob + object URL once recording stops.
 * The caller receives the live MediaStream from startRecording() so
 * sibling hooks (visualizer, transcription) can attach their own nodes.
 */
export function useRecorder(): UseRecorderReturn {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioDatUrl, setAudioDatUrl] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const startRecording = useCallback(async (): Promise<MediaStream | null> => {
        try {
            // Reset state from any previous session
            setAudioBlob(null);
            setAudioDatUrl(null);
            setDuration(0);
            audioChunksRef.current = [];

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const datUrl = URL.createObjectURL(blob);
                setAudioBlob(blob);
                setAudioDatUrl(datUrl);
            };

            mediaRecorder.start();
            setIsRecording(true);

            timerRef.current = setInterval(() => {
                setDuration((prev) => prev + 1);
            }, 1000);

            return stream;
        } catch (err) {
            console.error('[useRecorder] Microphone access denied:', err);
            return null;
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (!mediaRecorderRef.current || !isRecording) return;

        mediaRecorderRef.current.stop();
        setIsRecording(false);

        if (timerRef.current) clearInterval(timerRef.current);

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
    }, [isRecording]);

    return { isRecording, duration, audioBlob, audioDatUrl, startRecording, stopRecording };
}
