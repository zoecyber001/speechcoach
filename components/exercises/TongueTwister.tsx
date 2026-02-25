'use client';

import { useState, useEffect } from 'react';
import { Play, Square, RefreshCw } from 'lucide-react';

const twisters = [
  "Peter Piper picked a peck of pickled peppers.",
  "She sells seashells by the seashore.",
  "How much wood would a woodchuck chuck if a woodchuck could chuck wood?",
  "Unique New York, you know you need unique New York.",
  "Red leather, yellow leather, red leather, yellow leather.",
  "Fuzzy Wuzzy was a bear. Fuzzy Wuzzy had no hair."
];

export default function TongueTwister() {
  const [activeTwister, setActiveTwister] = useState(twisters[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prev) => prev + 10);
      }, 10);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (ms: number) => {
    return (ms / 1000).toFixed(2);
  };

  const nextTwister = () => {
    const currentIndex = twisters.indexOf(activeTwister);
    const nextIndex = (currentIndex + 1) % twisters.length;
    setActiveTwister(twisters[nextIndex]);
    setTime(0);
    setIsRunning(false);
  };

  return (
    <div className="flex flex-col items-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 w-full">
      <div className="text-center mb-6">
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider font-semibold">Say this 3 times fast:</p>
        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 max-w-md">&quot;{activeTwister}&quot;</h3>
      </div>
      
      <div className="text-5xl font-mono font-bold text-blue-600 dark:text-blue-400 mb-8">
        {formatTime(time)}s
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors text-white ${
            isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isRunning ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          {isRunning ? 'Stop' : 'Start Timer'}
        </button>
        <button
          onClick={nextTwister}
          className="flex items-center gap-2 px-4 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors"
          title="Next Twister"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
