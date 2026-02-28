'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Square } from 'lucide-react';

const PATTERNS = [
  {
    label: '4-4-4-4', name: 'Box', desc: 'Calm & Focus',
    phases: [
      { name: 'Inhale', duration: 4 },
      { name: 'Hold', duration: 4 },
      { name: 'Exhale', duration: 4 },
      { name: 'Hold', duration: 4 },
    ],
  },
  {
    label: '4-7-8', name: 'Relax', desc: 'Reduce Anxiety',
    phases: [
      { name: 'Inhale', duration: 4 },
      { name: 'Hold', duration: 7 },
      { name: 'Exhale', duration: 8 },
    ],
  },
  {
    label: '2-4', name: 'Energy', desc: 'Quick Reset',
    phases: [
      { name: 'Inhale', duration: 2 },
      { name: 'Exhale', duration: 4 },
    ],
  },
  {
    label: '5-5', name: 'Coherence', desc: 'Deep Focus',
    phases: [
      { name: 'Inhale', duration: 5 },
      { name: 'Exhale', duration: 5 },
    ],
  },
];

export default function BreathingExercise() {
  const [patternIdx, setPatternIdx] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(PATTERNS[0].phases[0].duration);
  const [cycleCount, setCycleCount] = useState(0);

  const pattern = PATTERNS[patternIdx];
  const currentPhase = pattern.phases[phaseIdx];

  // Architect's Note: use refs to avoid the nested-setState closure bug.
  // The interval reads/writes refs, then syncs to React state once per tick.
  const phaseRef = useRef(0);
  const timeRef = useRef(PATTERNS[0].phases[0].duration);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isActive) {
      interval = setInterval(() => {
        timeRef.current -= 1;

        if (timeRef.current <= 0) {
          // advance to next phase
          const nextPhase = (phaseRef.current + 1) % pattern.phases.length;
          if (nextPhase === 0) setCycleCount(c => c + 1);
          phaseRef.current = nextPhase;
          timeRef.current = pattern.phases[nextPhase].duration;
          setPhaseIdx(nextPhase);
        }

        setTimeLeft(timeRef.current);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, pattern.phases]);

  const toggleActive = () => {
    if (isActive) {
      setIsActive(false);
      setPhaseIdx(0);
      setTimeLeft(pattern.phases[0].duration);
      setCycleCount(0);
      phaseRef.current = 0;
      timeRef.current = pattern.phases[0].duration;
    } else {
      phaseRef.current = 0;
      timeRef.current = pattern.phases[0].duration;
      setPhaseIdx(0);
      setTimeLeft(pattern.phases[0].duration);
      setCycleCount(0);
      setIsActive(true);
    }
  };

  const changePattern = (idx: number) => {
    setPatternIdx(idx);
    setIsActive(false);
    setPhaseIdx(0);
    setTimeLeft(PATTERNS[idx].phases[0].duration);
    setCycleCount(0);
    phaseRef.current = 0;
    timeRef.current = PATTERNS[idx].phases[0].duration;
  };

  const isExpanding = currentPhase.name === 'Inhale' || currentPhase.name === 'Hold';
  const RINGS = 5;

  return (
    <div className="relative flex flex-col items-center w-full rounded-3xl overflow-hidden isolate"
      style={{ background: 'linear-gradient(180deg, #0c1220 0%, #0a0f1a 100%)' }}
    >
      {/* Pattern Selector - always visible at top */}
      <div className="w-full px-5 sm:px-8 pt-8 pb-4 z-10">
        <AnimatePresence mode="wait">
          {!isActive && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-4"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-1">
                Breathing Pattern
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full max-w-lg">
                {PATTERNS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => changePattern(i)}
                    className={`group relative flex flex-col items-center justify-center py-3.5 px-3 rounded-2xl text-center transition-all duration-300 ${patternIdx === i
                      ? 'bg-white/[0.12] ring-1 ring-white/20 shadow-[0_0_20px_rgba(56,189,248,0.12)]'
                      : 'bg-white/[0.04] hover:bg-white/[0.08]'
                      }`}
                  >
                    <span className={`text-base font-bold tracking-tight transition-colors ${patternIdx === i ? 'text-sky-400' : 'text-slate-300 group-hover:text-slate-200'
                      }`}>
                      {p.label}
                    </span>
                    <span className={`text-[10px] font-semibold mt-0.5 transition-colors ${patternIdx === i ? 'text-sky-400/60' : 'text-slate-500'
                      }`}>
                      {p.name}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active state: show cycle counter */}
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-3"
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
              {pattern.label}
            </span>
            <span className="w-px h-3 bg-slate-700" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-400/70">
              Cycle {cycleCount + 1}
            </span>
          </motion.div>
        )}
      </div>

      {/* Breathing Orb */}
      <div className="relative w-full flex items-center justify-center py-10 sm:py-16">
        <div className="relative w-52 h-52 sm:w-64 sm:h-64 flex items-center justify-center">
          {/* Ethereal rings */}
          {Array.from({ length: RINGS }).map((_, i) => {
            const rotOffset = (360 / RINGS) * i;
            return (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: '50%',
                  height: '50%',
                  background: `radial-gradient(circle, rgba(56,189,248,${0.15 - i * 0.02}) 0%, transparent 70%)`,
                  boxShadow: `0 0 ${30 + i * 5}px rgba(56,189,248,${0.15 - i * 0.02})`,
                }}
                animate={{
                  scale: isActive ? (isExpanding ? 2.2 - i * 0.1 : 1) : 1.1,
                  x: isActive && isExpanding
                    ? Math.cos((rotOffset * Math.PI) / 180) * (30 + i * 4)
                    : 0,
                  y: isActive && isExpanding
                    ? Math.sin((rotOffset * Math.PI) / 180) * (30 + i * 4)
                    : 0,
                  opacity: isActive ? (isExpanding ? 0.9 : 0.4) : 0.5,
                }}
                transition={{
                  duration: currentPhase.duration,
                  ease: 'easeInOut',
                }}
              />
            );
          })}

          {/* Core glow */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: '40%',
              height: '40%',
              background: 'radial-gradient(circle, rgba(56,189,248,0.35) 0%, rgba(56,189,248,0.08) 50%, transparent 70%)',
            }}
            animate={{
              scale: isActive ? (isExpanding ? 2.5 : 1.2) : 1.3,
            }}
            transition={{ duration: currentPhase.duration, ease: 'easeInOut' }}
          />

          {/* Center text */}
          <AnimatePresence mode="wait">
            <motion.div
              key={isActive ? `phase-${phaseIdx}` : 'idle'}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex flex-col items-center justify-center z-10"
            >
              {isActive ? (
                <>
                  <span className="text-[11px] font-bold tracking-[0.2em] text-sky-300/70 uppercase mb-1">
                    {currentPhase.name}
                  </span>
                  <span className="text-5xl sm:text-6xl font-extralight text-white tabular-nums">
                    {timeLeft}
                  </span>
                </>
              ) : (
                <div className="flex flex-col items-center">
                  <WindIcon className="w-10 h-10 text-sky-400/50 mb-2" />
                  <span className="text-xs text-slate-500 font-medium">{pattern.desc}</span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Start / Stop Button */}
      <div className="w-full flex flex-col items-center px-6 pb-8 z-10">
        <button
          onClick={toggleActive}
          className={`flex items-center justify-center gap-2.5 w-full max-w-xs py-4 rounded-full font-semibold text-base transition-all duration-300 active:scale-[0.97] ${isActive
            ? 'bg-white/[0.08] hover:bg-white/[0.12] text-slate-300 ring-1 ring-white/10'
            : 'bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20'
            }`}
        >
          {isActive ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" fill="currentColor" />}
          {isActive ? 'Stop' : `Begin ${pattern.label}`}
        </button>
      </div>
    </div>
  );
}

function WindIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
      <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
      <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
    </svg>
  );
}
