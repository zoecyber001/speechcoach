'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, AlertCircle, Timer, Award, Zap, Flame, Skull, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRecorder } from '@/hooks/useRecorder';
import { useAudioVisualizer } from '@/hooks/useAudioVisualizer';

const DIFFICULTIES = [
    { label: 'Warm-Up', duration: 30, icon: <Zap className="w-4 h-4" />, color: 'bg-emerald-500' },
    { label: 'Standard', duration: 60, icon: <Flame className="w-4 h-4" />, color: 'bg-amber-500' },
    { label: 'Gauntlet', duration: 120, icon: <Skull className="w-4 h-4" />, color: 'bg-rose-500' },
];

interface TranscribeResult {
    transcription: string;
    fillerWords: string[];
    fillerCount: number;
}

export default function FillerBuster() {
    const [diffIndex, setDiffIndex] = useState(1);
    const gameDuration = DIFFICULTIES[diffIndex].duration;

    const [timeLeft, setTimeLeft] = useState(gameDuration);
    const [isRunning, setIsRunning] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [hasFinished, setHasFinished] = useState(false);
    const [result, setResult] = useState<TranscribeResult | null>(null);
    const [personalBest, setPersonalBest] = useState<Record<number, number | null>>({});
    const [error, setError] = useState('');

    const recorder = useRecorder();
    const visualizer = useAudioVisualizer();
    const timeRef = useRef(gameDuration);

    // Rotating motivational messages while Gemini analyzes
    const ANALYZING_MSGS = [
        'Analyzing your speech...',
        'Counting every "um" and "uh"...',
        'Gemini is listening closely...',
        'Detecting filler words...',
        'Almost there...',
    ];
    const [analyzingMsg, setAnalyzingMsg] = useState(ANALYZING_MSGS[0]);

    useEffect(() => {
        if (!isAnalyzing) return;
        let idx = 0;
        const interval = setInterval(() => {
            idx = (idx + 1) % ANALYZING_MSGS.length;
            setAnalyzingMsg(ANALYZING_MSGS[idx]);
        }, 2500);
        return () => clearInterval(interval);
    }, [isAnalyzing]); // eslint-disable-line react-hooks/exhaustive-deps

    // Load personal bests
    useEffect(() => {
        try {
            const stored = localStorage.getItem('filler_buster_pb');
            if (stored) setPersonalBest(JSON.parse(stored));
        } catch { /* noop */ }
    }, []);

    const savePB = (duration: number, penalties: number) => {
        setPersonalBest(prev => {
            const current = prev[duration];
            if (current === null || current === undefined || penalties < current) {
                const next = { ...prev, [duration]: penalties };
                localStorage.setItem('filler_buster_pb', JSON.stringify(next));
                return next;
            }
            return prev;
        });
    };

    // Send recorded audio to Gemini for transcription + filler detection
    const analyzeAudio = useCallback(async (audioBlob: Blob) => {
        setIsAnalyzing(true);
        setError('');

        try {
            const arrayBuffer = await audioBlob.arrayBuffer();
            const base64 = btoa(
                new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
            );

            const res = await fetch('/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioBase64: base64, mimeType: audioBlob.type || 'audio/webm' }),
            });

            if (!res.ok) throw new Error('Transcription request failed');

            const data: TranscribeResult = await res.json();
            setResult(data);
            savePB(gameDuration, data.fillerCount);
            setHasFinished(true);
        } catch (err) {
            console.error('[FillerBuster] analysis error:', err);
            setError('Analysis failed. Please try again.');
            setHasFinished(true);
            setResult({ transcription: '', fillerWords: [], fillerCount: 0 });
        } finally {
            setIsAnalyzing(false);
        }
    }, [gameDuration]); // eslint-disable-line react-hooks/exhaustive-deps

    // Timer
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isRunning) {
            interval = setInterval(() => {
                timeRef.current -= 1;
                setTimeLeft(timeRef.current);

                if (timeRef.current <= 0) {
                    setIsRunning(false);
                    recorder.stopRecording();
                    visualizer.stopVisualizer();
                    // audioBlob will be set asynchronously via onstop callback
                    // the useEffect below watching recorder.audioBlob will trigger analysis
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning]); // eslint-disable-line react-hooks/exhaustive-deps

    // Watch for audioBlob to be ready (backup for the timer stop)
    const analyzedRef = useRef(false);
    useEffect(() => {
        if (recorder.audioBlob && !isRunning && !hasFinished && !isAnalyzing && !analyzedRef.current) {
            analyzedRef.current = true;
            analyzeAudio(recorder.audioBlob);
        }
    }, [recorder.audioBlob, isRunning, hasFinished, isAnalyzing, analyzeAudio]);

    const handleStart = async () => {
        const stream = await recorder.startRecording();
        if (stream) {
            visualizer.startVisualizer(stream);
            timeRef.current = gameDuration;
            setTimeLeft(gameDuration);
            setHasFinished(false);
            setResult(null);
            setError('');
            analyzedRef.current = false;
            setIsRunning(true);
        } else {
            alert('Microphone access is required to play Filler Buster.');
        }
    };

    const handleStop = () => {
        setIsRunning(false);
        recorder.stopRecording();
        visualizer.stopVisualizer();
        // The audioBlob effect will trigger analysis
    };

    const handleReset = () => {
        timeRef.current = gameDuration;
        setTimeLeft(gameDuration);
        setHasFinished(false);
        setResult(null);
        setError('');
        analyzedRef.current = false;
    };

    const getScoreMessage = (penalties: number) => {
        if (penalties === 0) return 'Flawless! Absolute perfection. 🏆';
        if (penalties <= 2) return 'Great job! Very clean delivery.';
        if (penalties <= 5) return 'Good stuff, but room for improvement.';
        if (penalties <= 10) return 'Keep practicing. Focus on deliberate silence.';
        return 'Lots of fillers detected. Try speaking slower and embracing pauses.';
    };

    const percentLeft = (timeLeft / gameDuration) * 100;
    const currentPB = personalBest[gameDuration];

    return (
        <div className="relative flex flex-col items-center p-6 sm:p-10 rounded-2xl border-2 transition-colors duration-300 w-full overflow-hidden bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">

            {/* Background Progress Bar */}
            {isRunning && (
                <div
                    className="absolute bottom-0 left-0 h-1 bg-indigo-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${percentLeft}%` }}
                />
            )}

            {/* ── State: Selecting / Running ── */}
            {!hasFinished && !isAnalyzing && (
                <>
                    {/* Difficulty Selector */}
                    {!isRunning && (
                        <div className="flex gap-2 mb-8 w-full max-w-sm">
                            {DIFFICULTIES.map((diff, i) => (
                                <button
                                    key={i}
                                    onClick={() => { setDiffIndex(i); setTimeLeft(diff.duration); timeRef.current = diff.duration; }}
                                    className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl font-semibold text-sm transition-all border-2 ${diffIndex === i
                                        ? `${diff.color} text-white border-transparent shadow-lg scale-105`
                                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                        }`}
                                >
                                    {diff.icon}
                                    <span>{diff.label}</span>
                                    <span className="text-xs opacity-70">{diff.duration}s</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Timer display */}
                    <div className="flex flex-col items-center mb-6">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 flex items-center gap-1">
                            <Timer className="w-3.5 h-3.5" /> {isRunning ? 'Time Remaining' : 'Duration'}
                        </span>
                        <span className={`text-5xl sm:text-6xl font-mono font-bold tabular-nums ${timeLeft <= 10 && isRunning ? 'text-red-500 animate-pulse' : 'text-slate-800 dark:text-slate-100'}`}>
                            {timeLeft}s
                        </span>
                    </div>

                    {/* Audio visualizer while running */}
                    {isRunning && (
                        <div className="w-full bg-slate-100 dark:bg-slate-900/60 rounded-xl p-3 mb-6 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Recording
                            </div>
                            <canvas ref={visualizer.canvasRef} width={400} height={60} className="w-full h-14 rounded-lg" />
                        </div>
                    )}

                    {currentPB !== null && currentPB !== undefined && !isRunning && (
                        <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-full mb-4 flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5" /> Personal Best: {currentPB} penalties
                        </div>
                    )}

                    <div className="text-center mb-6 max-w-sm">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {isRunning
                                ? 'Speak freely. When time\'s up, AI will analyze every filler word.'
                                : 'Select difficulty, then speak for the full duration with as few fillers as possible.'}
                        </p>
                    </div>

                    <button
                        onClick={isRunning ? handleStop : handleStart}
                        className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg transition-all text-white shadow-lg active:scale-95 ${isRunning
                            ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'
                            : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                            }`}
                    >
                        {isRunning ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" fill="currentColor" />}
                        {isRunning ? 'Give Up' : 'Start Survival Mode'}
                    </button>
                </>
            )}

            {/* ── State: Analyzing ── */}
            {isAnalyzing && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4 py-12"
                >
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={analyzingMsg}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="text-slate-500 dark:text-slate-400 font-medium text-sm"
                        >
                            {analyzingMsg}
                        </motion.p>
                    </AnimatePresence>
                </motion.div>
            )}

            {/* ── State: Results ── */}
            {hasFinished && !isAnalyzing && result && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center text-center w-full py-4"
                >
                    <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
                        <Award className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Time&apos;s Up!</h3>

                    {error && (
                        <div className="flex items-center gap-2 text-rose-500 text-sm mb-4">
                            <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                    )}

                    <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 w-full max-w-sm mb-4 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Difficulty</span>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                {DIFFICULTIES[diffIndex].label} ({gameDuration}s)
                            </span>
                        </div>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Total Penalties</span>
                            <span className={`text-2xl font-black ${result.fillerCount === 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {result.fillerCount}
                            </span>
                        </div>
                        {currentPB !== null && currentPB !== undefined && (
                            <div className="flex justify-between items-center mb-4 text-xs">
                                <span className="text-slate-400">Personal Best</span>
                                <span className={`font-bold ${result.fillerCount <= currentPB ? 'text-emerald-500' : 'text-slate-500'}`}>
                                    {result.fillerCount <= currentPB ? '🏆 New PB!' : `${currentPB} penalties`}
                                </span>
                            </div>
                        )}
                        <p className="text-sm text-slate-600 dark:text-slate-300 font-medium bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                            {getScoreMessage(result.fillerCount)}
                        </p>
                    </div>

                    {/* Detected fillers breakdown */}
                    {result.fillerWords.length > 0 && (
                        <div className="w-full max-w-sm mb-4 bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800 text-left">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Detected Fillers</p>
                            <div className="flex flex-wrap gap-1.5">
                                {result.fillerWords.map((word, i) => (
                                    <span
                                        key={i}
                                        className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-semibold px-2 py-1 rounded-md"
                                    >
                                        {word}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Transcription */}
                    {result.transcription && (
                        <div className="w-full max-w-sm mb-6 bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800 text-left">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Your Speech</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                {result.transcription}
                            </p>
                        </div>
                    )}

                    <button
                        onClick={handleReset}
                        className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                    >
                        Play Again
                    </button>
                </motion.div>
            )}
        </div>
    );
}
