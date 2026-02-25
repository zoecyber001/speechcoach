'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Square } from 'lucide-react';

export default function BreathingExercise() {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Hold Out'>('Inhale');
  const [timeLeft, setTimeLeft] = useState(4);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setPhase((p) => {
              if (p === 'Inhale') return 'Hold';
              if (p === 'Hold') return 'Exhale';
              if (p === 'Exhale') return 'Hold Out';
              return 'Inhale';
            });
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const toggleActive = () => {
    if (isActive) {
      setIsActive(false);
      setPhase('Inhale');
      setTimeLeft(4);
    } else {
      setIsActive(true);
    }
  };

  const getScale = () => {
    if (phase === 'Inhale') return 1.5;
    if (phase === 'Hold') return 1.5;
    if (phase === 'Exhale') return 1;
    return 1;
  };

  return (
    <div className="flex flex-col items-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 w-full">
      <div className="relative w-48 h-48 flex items-center justify-center mb-8">
        <motion.div
          animate={{ scale: isActive ? getScale() : 1 }}
          transition={{ duration: 4, ease: "linear" }}
          className="absolute w-32 h-32 bg-sky-200 dark:bg-sky-900/50 rounded-full opacity-50"
        />
        <motion.div
          animate={{ scale: isActive ? getScale() : 1 }}
          transition={{ duration: 4, ease: "linear" }}
          className="absolute w-24 h-24 bg-sky-400 dark:bg-sky-600 rounded-full flex items-center justify-center shadow-lg"
        >
          {isActive ? (
            <div className="text-white text-center">
              <div className="font-bold text-lg">{phase}</div>
              <div className="text-2xl">{timeLeft}</div>
            </div>
          ) : (
            <WindIcon className="w-10 h-10 text-white" />
          )}
        </motion.div>
      </div>
      <button
        onClick={toggleActive}
        className="flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-medium transition-colors"
      >
        {isActive ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        {isActive ? 'Stop' : 'Start Box Breathing'}
      </button>
    </div>
  );
}

function WindIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
      <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
      <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
    </svg>
  );
}
