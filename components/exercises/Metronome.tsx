'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Plus, Minus, AlignLeft, Edit3, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface MetronomeProps {
  defaultBpm?: number;
}

const DEFAULT_TEXT = `The art of pacing is not just about speed. It is about control. When we rush our words, we signal anxiety to our audience. We tell them that our message is not worth their time. But when we slow down, when we embrace the silence between our sentences, we project power, confidence, and authority. The audience leans in. They hang on every word. A well-placed pause is often more impactful than the most eloquent phrase. Keep your breathing steady, maintain this rhythm, and let the space do the heavy lifting for you. In conclusion, master your pace, and you will master your audience.`;

export default function Metronome({ defaultBpm }: MetronomeProps) {
  const [bpm, setBpm] = useState(defaultBpm ?? 130);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beat, setBeat] = useState(0); // increments on each tick for the visual pulse
  const [promptText, setPromptText] = useState(DEFAULT_TEXT);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [highlightedWordIdx, setHighlightedWordIdx] = useState(-1);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (defaultBpm !== undefined) setBpm(defaultBpm);
  }, [defaultBpm]);

  // Architect's Note: Synthesize a warm woodblock-style click using
  // two layered oscillators — a sharp transient (sine burst at 3500Hz)
  // for the "tick" attack, and a lower body tone (sine at 800Hz) for warmth.
  // Both decay rapidly via gain envelope for a clean, non-fatiguing sound.
  const playClick = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;

    // Layer 1: sharp transient "tick"
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(3500, now);
    osc1.frequency.exponentialRampToValueAtTime(1500, now + 0.03);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.05);

    // Layer 2: warm body
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(800, now);
    gain2.gain.setValueAtTime(0.15, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.1);
  }, []);

  const words = promptText.split(/\s+/).filter(Boolean);

  // Metronome tick + word advancement
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      // BPM = words per minute for word advancement
      // At 130 BPM = 130 WPM ≈ natural conversational pace
      const msPerWord = 60000 / bpm;
      let wordIdx = 0;
      setHighlightedWordIdx(0);

      const wordInterval = setInterval(() => {
        wordIdx += 1;
        if (wordIdx >= words.length) {
          setIsPlaying(false);
          setHighlightedWordIdx(-1);
          return;
        }
        setHighlightedWordIdx(wordIdx);

        // Auto-scroll: keep the current word centered vertically in the container
        const wordEl = wordRefs.current[wordIdx];
        const container = scrollerRef.current;
        if (wordEl && container) {
          const wordTop = wordEl.offsetTop;
          const containerHeight = container.clientHeight;
          container.scrollTo({
            top: wordTop - containerHeight / 3,
            behavior: 'smooth',
          });
        }
      }, msPerWord);

      // Audio click: tick every 2 words (so it's not overwhelming)
      const msPerClick = msPerWord * 2;
      const clickInterval = setInterval(() => {
        setBeat(b => b + 1);
        playClick();
      }, msPerClick);

      return () => {
        clearInterval(wordInterval);
        clearInterval(clickInterval);
      };
    } else {
      setHighlightedWordIdx(-1);
      setBeat(0);
    }
    return undefined;
  }, [isPlaying, bpm, words.length, playClick]);

  const toggleMetronome = () => {
    if (!isPlaying && scrollerRef.current) {
      scrollerRef.current.scrollTop = 0;
    }
    setIsPlaying(!isPlaying);
  };

  // BPM presets
  const presets = [
    { label: 'Calm', bpm: 100 },
    { label: 'Natural', bpm: 130 },
    { label: 'Energetic', bpm: 170 },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">

      {/* Metronome Controls Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8">

        {defaultBpm !== undefined && (
          <div className="text-xs text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-full mb-6 text-center w-fit mx-auto">
            Pace matched to your last session
          </div>
        )}

        {/* BPM Display + Controls */}
        <div className="flex items-center justify-center gap-6 mb-6">
          <button
            onClick={() => setBpm((b) => Math.max(40, b - 5))}
            className="w-12 h-12 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors active:scale-95"
          >
            <Minus className="w-5 h-5" />
          </button>

          <div className="text-center min-w-[100px]">
            <div className="text-5xl font-black text-slate-800 dark:text-slate-100 tabular-nums tracking-tight">{bpm}</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">BPM</div>
          </div>

          <button
            onClick={() => setBpm((b) => Math.min(240, b + 5))}
            className="w-12 h-12 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors active:scale-95"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex justify-center gap-2 mb-6">
          {presets.map(p => (
            <button
              key={p.label}
              onClick={() => setBpm(p.bpm)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${bpm === p.bpm
                ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
            >
              {p.label} ({p.bpm})
            </button>
          ))}
        </div>

        {/* Beat Visualizer — pulsing dot */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: isPlaying && (beat % 4) === i ? 1.6 : 1,
                backgroundColor: isPlaying && (beat % 4) === i ? '#10b981' : (
                  typeof window !== 'undefined' && document.documentElement.classList.contains('dark')
                    ? '#334155' : '#e2e8f0'
                ),
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="w-4 h-4 rounded-full"
            />
          ))}
        </div>

        {/* Start/Stop */}
        <button
          onClick={toggleMetronome}
          className={`flex items-center gap-2 px-8 py-4 w-full justify-center rounded-2xl font-bold text-lg transition-all text-white shadow-lg active:scale-[0.97] ${isPlaying
            ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'
            : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
            }`}
        >
          {isPlaying ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" fill="currentColor" />}
          {isPlaying ? 'Stop' : 'Start Drill'}
        </button>
      </div>

      {/* Teleprompter Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <AlignLeft className="w-4 h-4 text-indigo-500" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Teleprompter</h3>
          </div>
          {!isPlaying && (
            <button
              onClick={() => setShowTextEditor(!showTextEditor)}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
            >
              {showTextEditor ? <><Check className="w-3.5 h-3.5" /> Done</> : <><Edit3 className="w-3.5 h-3.5" /> Edit Text</>}
            </button>
          )}
        </div>

        {/* Text Editor */}
        {showTextEditor && !isPlaying && (
          <div className="px-5 pt-4 pb-2">
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Paste your speech or presentation text here..."
              className="w-full h-32 p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-slate-400"
            />
          </div>
        )}

        {/* Karaoke-style word display */}
        <div className="relative">
          {/* Top fade */}
          <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-white dark:from-slate-900 to-transparent z-10 pointer-events-none" />
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-slate-900 to-transparent z-10 pointer-events-none" />

          <div
            ref={scrollerRef}
            className="max-h-[280px] overflow-hidden px-5 py-6 scroll-smooth"
          >
            <div className="text-lg sm:text-xl leading-[2] tracking-wide">
              {words.map((word, i) => {
                const isPast = highlightedWordIdx >= 0 && i < highlightedWordIdx;
                const isCurrent = i === highlightedWordIdx;
                const isFuture = highlightedWordIdx < 0 || i > highlightedWordIdx;

                return (
                  <span
                    key={i}
                    ref={el => { wordRefs.current[i] = el; }}
                    className={`inline-block mr-1.5 py-0.5 transition-all duration-200 ${isCurrent
                      ? 'text-emerald-500 dark:text-emerald-400 font-bold scale-105'
                      : isPast
                        ? 'text-slate-400 dark:text-slate-500'
                        : isFuture && isPlaying
                          ? 'text-slate-700 dark:text-slate-300'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Idle overlay */}
          {!isPlaying && !showTextEditor && (
            <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px]">
              <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg">
                Press Start to begin
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
