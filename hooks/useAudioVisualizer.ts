'use client';

import { useRef, useCallback } from 'react';

interface UseAudioVisualizerReturn {
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    startVisualizer: (stream: MediaStream) => void;
    stopVisualizer: () => void;
}

/**
 * Encapsulates the Web Audio API frequency visualizer.
 * Attach this to a <canvas ref={canvasRef} /> in the UI.
 * Draws a bar-chart of frequency buckets using requestAnimationFrame.
 */
export function useAudioVisualizer(): UseAudioVisualizerReturn {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const startVisualizer = useCallback((stream: MediaStream) => {
        // Slight delay ensures the canvas has mounted in the DOM
        setTimeout(() => {
            if (!canvasRef.current) return;

            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioCtx) return;

            const audioContext = new AudioCtx();
            audioContextRef.current = audioContext;

            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;

            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);

            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const draw = () => {
                animationFrameRef.current = requestAnimationFrame(draw);
                analyser.getByteFrequencyData(dataArray);

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                const barWidth = (canvas.width / bufferLength) * 2.5;
                let x = 0;

                for (let i = 0; i < bufferLength; i++) {
                    const barHeight = dataArray[i] / 2;
                    // Indigo-spectrum gradient: intensity driven by frequency magnitude
                    ctx.fillStyle = `rgb(${barHeight + 80}, 80, ${220 - barHeight})`;
                    ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                    x += barWidth + 1;
                }
            };

            draw();
        }, 100);
    }, []);

    const stopVisualizer = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        analyserRef.current = null;
    }, []);

    return { canvasRef, startVisualizer, stopVisualizer };
}
