'use client';

import { useRef, useCallback } from 'react';

interface UseAudioVisualizerReturn {
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    startVisualizer: (stream: MediaStream) => void;
    stopVisualizer: () => void;
}

// hooks into Web Audio API to draw a frequency bar chart on a canvas
// just pass a stream and point canvasRef at your <canvas> element
export function useAudioVisualizer(): UseAudioVisualizerReturn {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const startVisualizer = useCallback((stream: MediaStream) => {
        // longer delay so the canvas is definitely rendered in the DOM
        const tryStart = () => {
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
                    // shift color based on frequency magnitude for a nice gradient feel
                    ctx.fillStyle = `rgb(${barHeight + 80}, 80, ${220 - barHeight})`;
                    ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                    x += barWidth + 1;
                }
            };

            draw();
        };

        // try after 300ms, retry once at 600ms if canvas still not mounted
        setTimeout(() => {
            if (canvasRef.current) {
                tryStart();
            } else {
                setTimeout(tryStart, 300);
            }
        }, 300);
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
