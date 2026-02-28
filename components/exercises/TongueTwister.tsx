'use client';

import { useState, useEffect, useMemo } from 'react';
import { Play, Square, RefreshCw, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSpeechTranscription } from '@/hooks/useSpeechTranscription';
import { useRecorder } from '@/hooks/useRecorder';

const twisters = [
  "Peter Piper picked a peck of pickled peppers",
  "She sells seashells by the seashore",
  "How much wood would a woodchuck chuck if a woodchuck could chuck wood",
  "Unique New York you know you need unique New York",
  "Red leather yellow leather red leather yellow leather",
  "Fuzzy Wuzzy was a bear Fuzzy Wuzzy had no hair",
];

export default function TongueTwister() {
  const [activeTwister, setActiveTwister] = useState(twisters[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0); // ms
  const [hasFinished, setHasFinished] = useState(false);

  const transcription = useSpeechTranscription();
  const recorder = useRecorder();

  // combine all finals and interim into one running string
  const recognizedText = useMemo(() => {
    return transcription.liveTranscript.map(t => t.text).join(' ') + ' ' + transcription.interimTranscript;
  }, [transcription.liveTranscript, transcription.interimTranscript]);

  // word matching logic (handles dropping skipped/misheard words by just advancing spokenIdx)
  const targetWords = useMemo(() => activeTwister.toLowerCase().replace(/[^\w\s']/g, '').split(/\s+/).filter(Boolean), [activeTwister]);

  const matchedCount = useMemo(() => {
    if (!isRunning && time === 0) return 0; // reset state

    const spokenWords = recognizedText.toLowerCase().replace(/[^\w\s']/g, '').split(/\s+/).filter(Boolean);
    let targetIdx = 0;
    let spokenIdx = 0;

    while (targetIdx < targetWords.length && spokenIdx < spokenWords.length) {
      if (targetWords[targetIdx] === spokenWords[spokenIdx]) {
        targetIdx++;
        spokenIdx++;
      } else {
        spokenIdx++; // skip misheard words
      }
    }
    return targetIdx;
  }, [recognizedText, targetWords, isRunning, time]);

  // timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning && !hasFinished) {
      interval = setInterval(() => {
        setTime((prev) => prev + 10);
      }, 10);
    }
    return () => clearInterval(interval);
  }, [isRunning, hasFinished]);

  // completion check
  useEffect(() => {
    if (isRunning && matchedCount >= targetWords.length && !hasFinished) {
      handleStop();
      setHasFinished(true);
    }
  }, [matchedCount, targetWords.length, isRunning, hasFinished]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStart = async () => {
    const hasMic = await recorder.startRecording();
    if (hasMic) {
      transcription.resetTranscript();
      transcription.startTranscription();
      setTime(0);
      setHasFinished(false);
      setIsRunning(true);
    } else {
      alert("Microphone access is required to do live evaluation.");
    }
  };

  const handleStop = () => {
    recorder.stopRecording();
    transcription.stopTranscription();
    setIsRunning(false);
  };

  const nextTwister = () => {
    handleStop();
    const currentIndex = twisters.indexOf(activeTwister);
    const nextIndex = (currentIndex + 1) % twisters.length;
    setActiveTwister(twisters[nextIndex]);
    setTime(0);
    setHasFinished(false);
    transcription.resetTranscript();
  };

  const formatTime = (ms: number) => (ms / 1000).toFixed(2);
  const progressPercent = (matchedCount / targetWords.length) * 100;

  return (
    <div className="flex flex-col items-center p-6 border-2 transition-colors duration-300 bg-white dark:bg-slate-900 rounded-3xl w-full border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">

      {/* Background Progress Bar */}
      <div
        className="absolute top-0 left-0 h-1.5 bg-emerald-500 transition-all duration-300 ease-out"
        style={{ width: `${progressPercent}%` }}
      />

      <div className="text-center mb-8 mt-2">
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest font-bold">Live Target</p>

        {/* Render Words with Highlights */}
        <h3 className="text-2xl sm:text-3xl font-bold leading-relaxed max-w-2xl text-center space-x-1.5">
          {activeTwister.split(' ').map((word, i) => {
            const isMatched = i < matchedCount;
            // The active word being attempted is the exact next one
            const isActive = i === matchedCount && isRunning;
            return (
              <span
                key={i}
                className={`inline-block transition-colors duration-200 ${isMatched
                    ? 'text-emerald-500 dark:text-emerald-400'
                    : isActive
                      ? 'text-slate-800 dark:text-slate-100 border-b-2 border-indigo-400 dark:border-indigo-500 pb-0.5'
                      : 'text-slate-300 dark:text-slate-600'
                  }`}
              >
                {word}
              </span>
            );
          })}
        </h3>
      </div>

      <AnimatePresence mode="wait">
        {!hasFinished ? (
          <motion.div
            key="running"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center"
          >
            <div className="text-5xl font-mono font-black text-indigo-600 dark:text-indigo-400 mb-8 tabular-nums">
              {formatTime(time)}s
            </div>

            <div className="flex gap-4">
              <button
                onClick={isRunning ? handleStop : handleStart}
                className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg transition-all text-white shadow-lg active:scale-95 ${isRunning
                    ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                  }`}
              >
                {isRunning ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5 outline-white" fill="currentColor" />}
                {isRunning ? 'Stop Listen' : 'Start Reading'}
              </button>

              <button
                onClick={nextTwister}
                disabled={isRunning}
                className="flex items-center gap-2 px-5 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next Twister"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="finished"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center w-full"
          >
            <div className="flex items-center gap-2 text-emerald-500 mb-2">
              <CheckCircle2 className="w-8 h-8" />
              <h4 className="text-2xl font-bold">Nailed It!</h4>
            </div>

            <div className="text-5xl font-mono font-black text-slate-800 dark:text-slate-100 my-4 tabular-nums">
              {formatTime(time)}s
            </div>

            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6 bg-slate-50 dark:bg-slate-800/50 py-2 px-4 rounded-xl">
              {time < 3000 ? 'Incredible speed. Expert articulation.' : time < 5000 ? 'Solid performance. Good clarity.' : 'Take it slow to build muscle memory.'}
            </p>

            <button
              onClick={nextTwister}
              className="flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 rounded-2xl font-bold transition-all active:scale-95"
            >
              Try Another <RefreshCw className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live transcript debug preview */}
      {isRunning && recognizedText && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-max max-w-[80%] bg-slate-900/80 backdrop-blur-md text-white/50 text-xs px-4 py-2 rounded-full truncate pointer-events-none">
          {recognizedText}
        </div>
      )}
    </div>
  );
}
