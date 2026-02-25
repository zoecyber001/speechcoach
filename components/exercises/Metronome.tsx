'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Square, Plus, Minus } from 'lucide-react';
import { motion } from 'motion/react';

export default function Metronome() {
  const [bpm, setBpm] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tick, setTick] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playClick = () => {
    if (!audioCtxRef.current) return;
    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();
    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);
    osc.frequency.value = 800;
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.1);
    osc.start();
    osc.stop(audioCtxRef.current.currentTime + 0.1);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) audioCtxRef.current = new AudioContextClass();
      }
      
      const msPerBeat = 60000 / bpm;
      interval = setInterval(() => {
        setTick((t) => !t);
        playClick();
      }, msPerBeat);
    }
    return () => clearInterval(interval);
  }, [isPlaying, bpm]);

  return (
    <div className="flex flex-col items-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 w-full">
      <div className="flex items-center justify-between w-full max-w-xs mb-8">
        <button onClick={() => setBpm(b => Math.max(40, b - 5))} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200">
          <Minus className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div className="text-4xl font-bold text-slate-800 dark:text-slate-100">{bpm}</div>
          <div className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">BPM</div>
        </div>
        <button onClick={() => setBpm(b => Math.min(200, b + 5))} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="w-full max-w-xs h-4 bg-slate-200 dark:bg-slate-700 rounded-full mb-8 relative overflow-hidden">
        <motion.div
          animate={{ x: tick ? '0%' : '100%' }}
          transition={{ duration: 60 / bpm, ease: "linear" }}
          className="absolute top-0 left-0 w-1/2 h-full bg-emerald-500 rounded-full"
          style={{ originX: 0 }}
        />
      </div>

      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className={`flex items-center gap-2 px-8 py-3 rounded-xl font-medium transition-colors text-white ${
          isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'
        }`}
      >
        {isPlaying ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        {isPlaying ? 'Stop' : 'Start Metronome'}
      </button>
    </div>
  );
}
