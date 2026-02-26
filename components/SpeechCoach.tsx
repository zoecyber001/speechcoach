'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic, Square, Loader2, Play, RefreshCw, AlertCircle, Volume2,
  Activity, Zap, BookOpen, Users, TrendingUp, Target, Award,
  ChevronRight, Clock, Wind, MessageSquare, CheckCircle2,
} from 'lucide-react';

import { useRecorder } from '@/hooks/useRecorder';
import { useAudioVisualizer } from '@/hooks/useAudioVisualizer';
import { useSpeechTranscription } from '@/hooks/useSpeechTranscription';
import { useSpeechAnalysis } from '@/hooks/useSpeechAnalysis';
import { useSessionHistory } from '@/hooks/useSessionHistory';
import SessionHistory from '@/components/SessionHistory';

import type { SpeechIntent, CoachFeedback, CoachingSession } from '@/lib/types';

// ── Types & Config ─────────────────────────────────────────────────────────

type AppStep = 'intent' | 'record' | 'analyzing' | 'feedback';

const INTENT_OPTIONS: {
  value: SpeechIntent;
  label: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  border: string;
}[] = [
    {
      value: 'persuade',
      label: 'Persuade',
      description: 'Win someone over to your position',
      icon: <TrendingUp className="w-6 h-6" />,
      gradient: 'from-rose-500 to-pink-600',
      border: 'border-rose-200 dark:border-rose-800 hover:border-rose-400 dark:hover:border-rose-600',
    },
    {
      value: 'inspire',
      label: 'Inspire',
      description: 'Ignite energy and move people to act',
      icon: <Zap className="w-6 h-6" />,
      gradient: 'from-amber-500 to-orange-600',
      border: 'border-amber-200 dark:border-amber-800 hover:border-amber-400 dark:hover:border-amber-600',
    },
    {
      value: 'inform',
      label: 'Inform',
      description: 'Deliver clarity and build understanding',
      icon: <BookOpen className="w-6 h-6" />,
      gradient: 'from-sky-500 to-blue-600',
      border: 'border-sky-200 dark:border-sky-800 hover:border-sky-400 dark:hover:border-sky-600',
    },
    {
      value: 'connect',
      label: 'Connect',
      description: 'Build rapport and deepen relationships',
      icon: <Users className="w-6 h-6" />,
      gradient: 'from-emerald-500 to-teal-600',
      border: 'border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600',
    },
  ];

const DRILL_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  articulation: { label: 'Articulation', icon: <MessageSquare className="w-4 h-4" />, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' },
  pacing: { label: 'Pacing', icon: <Clock className="w-4 h-4" />, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400' },
  breathing: { label: 'Breathing', icon: <Wind className="w-4 h-4" />, color: 'text-sky-600 bg-sky-50 dark:bg-sky-900/20 dark:text-sky-400' },
  fillers: { label: 'Fillers', icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400' },
};

// ── Sub-components ─────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  const label = score >= 75 ? 'Excellent' : score >= 50 ? 'Good' : 'Developing';

  return (
    <div className="flex flex-col items-center">
      <svg width="128" height="128" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-100 dark:text-slate-800" />
        <circle
          cx="64" cy="64" r={radius} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 64 64)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <text x="64" y="60" textAnchor="middle" fontSize="26" fontWeight="800" fill={color}>{score}</text>
        <text x="64" y="78" textAnchor="middle" fontSize="10" fill="#94a3b8">/100</text>
      </svg>
      <span className="text-sm font-semibold mt-1" style={{ color }}>{label}</span>
    </div>
  );
}

function FeedbackTabs({ feedback }: { feedback: CoachFeedback }) {
  const [activeTab, setActiveTab] = useState<'mechanics' | 'story' | 'presence'>('mechanics');

  const tabs: { id: 'mechanics' | 'story' | 'presence'; label: string; expert: string; icon: React.ReactNode }[] = [
    { id: 'mechanics', label: 'Mechanics', expert: 'Vinh Giang', icon: <Activity className="w-4 h-4" /> },
    { id: 'story', label: 'Narrative', expert: 'Nick Morgan', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'presence', label: 'Presence', expert: 'Connie Dieken', icon: <Target className="w-4 h-4" /> },
  ];

  return (
    <div className="w-full">
      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === tab.id
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="inline sm:hidden">{tab.label.slice(0, 4)}</span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Lens: {tabs.find(t => t.id === activeTab)?.expert}
          </p>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
            {feedback.breakdown[activeTab]}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function SpeechCoach() {
  const [step, setStep] = useState<AppStep>('intent');
  const [intent, setIntent] = useState<SpeechIntent | null>(null);
  const [restoredAudio, setRestoredAudio] = useState<string | null>(null);

  const recorder = useRecorder();
  const visualizer = useAudioVisualizer();
  const transcription = useSpeechTranscription();
  const analysis = useSpeechAnalysis();
  const history = useSessionHistory();

  // ── Derived feedback (live session or restored from history) ──
  const activeFeedback = analysis.feedback;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    if (!intent) return;
    transcription.resetTranscript();
    analysis.clearFeedback();
    setRestoredAudio(null);

    const stream = await recorder.startRecording();
    if (!stream) {
      return; // mic permission denied — useRecorder logs the error
    }
    visualizer.startVisualizer(stream);
    transcription.startTranscription();
    setStep('record');
  };

  const handleStopRecording = async () => {
    recorder.stopRecording();
    visualizer.stopVisualizer();
    transcription.stopTranscription();
    setStep('analyzing');

    // Wait for MediaRecorder.onstop to fire and populate audioBlob
    // We poll via setTimeout to keep hooks decoupled
    await new Promise((res) => setTimeout(res, 300));
  };

  // Triggered after audioBlob is ready (via useEffect in parent flow)
  const handleAnalyze = useCallback(
    async (blob: Blob, datUrl: string) => {
      const result = await analysis.analyze(blob, intent!);
      if (result) {
        await history.saveSession({ intent: intent!, feedback: result, audioDatUrl: datUrl });
      }
      setStep('feedback');
    },
    [intent, analysis, history]
  );

  // Watch for audioBlob availability after stopRecording
  const [analyzedBlob, setAnalyzedBlob] = useState<string | null>(null);
  if (
    step === 'analyzing' &&
    recorder.audioBlob &&
    recorder.audioDatUrl &&
    recorder.audioDatUrl !== analyzedBlob
  ) {
    setAnalyzedBlob(recorder.audioDatUrl);
    handleAnalyze(recorder.audioBlob, recorder.audioDatUrl);
  }

  const handleReset = () => {
    analysis.clearFeedback();
    transcription.resetTranscript();
    setRestoredAudio(null);
    setAnalyzedBlob(null);
    setStep('intent');
  };

  const handleRestoreSession = (session: CoachingSession) => {
    analysis.clearFeedback();
    // Inject the feedback directly into view — we use a wrapper approach
    // since useSpeechAnalysis owns its internal state
    // For session restores, we surface the stored feedback via a dedicated state path
    setRestoredAudio(session.audioDatUrl ?? null);
    // Force the feedback step with the stored data
    (analysis as any)._injectFeedback?.(session.feedback);
    setStep('feedback');
  };

  const displayFeedback = activeFeedback;
  const displayAudio = restoredAudio ?? recorder.audioDatUrl;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col items-center">

      {/* ── Header ── */}
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
          Your Personal <span className="text-indigo-600 dark:text-indigo-400">Speech Coach</span>
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Coached by the frameworks of Giang, Morgan & Dieken — powered by Gemini.
        </p>
      </div>

      <AnimatePresence mode="wait">

        {/* ── Step 1: Goal (Intent) Selector ── */}
        {step === 'intent' && (
          <motion.div
            key="intent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="w-full"
          >
            <p className="text-center text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6">
              What is your intent for this session?
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {INTENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setIntent(opt.value)}
                  className={`relative p-5 rounded-2xl border-2 bg-white dark:bg-slate-900 flex flex-col items-center gap-3 text-center transition-all duration-200 cursor-pointer ${opt.border} ${intent === opt.value
                      ? 'shadow-lg scale-105'
                      : 'shadow-sm hover:shadow-md hover:scale-102'
                    }`}
                >
                  {intent === opt.value && (
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${opt.gradient} opacity-10`} />
                  )}
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${opt.gradient} text-white`}>
                    {opt.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-100">{opt.label}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">{opt.description}</div>
                  </div>
                  {intent === opt.value && (
                    <CheckCircle2 className="absolute top-3 right-3 w-5 h-5 text-indigo-500" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleStartRecording}
                disabled={!intent}
                className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-semibold text-lg shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 transition-all"
              >
                <Mic className="w-5 h-5" />
                Start Recording
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Recording ── */}
        {step === 'record' && (
          <motion.div
            key="record"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="w-full max-w-xl flex flex-col items-center p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800"
          >
            {/* Intent badge */}
            {intent && (
              <span className={`mb-6 text-xs font-semibold px-3 py-1.5 rounded-full bg-gradient-to-r ${INTENT_OPTIONS.find(o => o.value === intent)?.gradient} text-white`}>
                Intent: {INTENT_OPTIONS.find(o => o.value === intent)?.label}
              </span>
            )}

            {/* Mic button with pulse rings */}
            <div className="relative flex items-center justify-center mb-6">
              <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }} transition={{ repeat: Infinity, duration: 2 }}
                className="absolute w-40 h-40 bg-red-100 dark:bg-red-900/30 rounded-full" />
              <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.9, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute w-32 h-32 bg-red-200 dark:bg-red-800/40 rounded-full" />
              <button
                onClick={handleStopRecording}
                className="relative z-10 w-24 h-24 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-colors"
              >
                <Square className="w-8 h-8 fill-current" />
              </button>
            </div>

            <div className="text-3xl font-mono text-red-500 font-semibold mb-1">{formatTime(recorder.duration)}</div>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-6">Recording in progress…</p>

            {/* Visualizer */}
            <div className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 mb-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
                <Activity className="w-4 h-4" /><span>Audio Signal</span>
              </div>
              <canvas ref={visualizer.canvasRef} width={400} height={80} className="w-full h-20 rounded-lg" />
            </div>

            {/* Live transcript */}
            <div className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 text-left min-h-[100px] max-h-[180px] overflow-y-auto">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Live Transcript</div>
              <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                {transcription.liveTranscript.map((t, i) => (
                  <span key={i}>{transcription.highlightFillerWords(t.text)} </span>
                ))}
                <span className="opacity-60">{transcription.highlightFillerWords(transcription.interimTranscript)}</span>
                {!transcription.liveTranscript.length && !transcription.interimTranscript && (
                  <span className="text-slate-400 italic">Listening for speech…</span>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Analyzing ── */}
        {step === 'analyzing' && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800"
          >
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="text-indigo-500 mb-6">
              <Loader2 className="w-12 h-12" />
            </motion.div>
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">Analyzing with your expert coaches</h3>
            <p className="text-slate-500 dark:text-slate-400 text-center text-sm">Giang is listening for pitch. Morgan is mapping your arc. Dieken is checking your presence…</p>
          </motion.div>
        )}

        {/* ── Step 4: Feedback ── */}
        {step === 'feedback' && displayFeedback && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex flex-col gap-6"
          >
            {/* Top bar: audio player + reset */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Volume2 className="w-5 h-5" />
                </div>
                {displayAudio && <audio controls src={displayAudio} className="h-9 w-full sm:w-60 outline-none" />}
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />New Session
              </button>
            </div>

            {/* Score + quick stats */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-6">
                <h2 className="text-2xl font-bold text-white">Coach&apos;s Report</h2>
                <p className="text-indigo-200 mt-1 text-sm">Synthesized from three expert frameworks</p>
              </div>

              <div className="p-6 md:p-8">
                {/* Score + stats row */}
                <div className="flex flex-col sm:flex-row items-center gap-8 mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
                  <ScoreGauge score={displayFeedback.score} />
                  <div className="grid grid-cols-2 gap-4 flex-1 w-full">
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Filler Words</div>
                      <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{displayFeedback.fillerWordCount}</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Pace (syl/min)</div>
                      <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{displayFeedback.pacingBpm}</div>
                    </div>
                  </div>
                </div>

                {/* Expert lens tabs */}
                <div className="mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
                  <FeedbackTabs feedback={displayFeedback} />
                </div>

                {/* Transcription */}
                <div className="mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Transcription</h3>
                  <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                    {transcription.highlightFillerWords(displayFeedback.transcription)}
                  </p>
                </div>

                {/* Recommended Drills */}
                {displayFeedback.drills?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Award className="w-4 h-4 text-indigo-500" />Recommended Drills
                    </h3>
                    <div className="flex flex-col gap-3">
                      {displayFeedback.drills.map((drill, i) => {
                        const meta = DRILL_META[drill.module];
                        return (
                          <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg shrink-0 ${meta.color}`}>
                              {meta.icon}{meta.label}
                            </span>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-snug mt-0.5">{drill.reason}</p>
                            {drill.bpmTarget && (
                              <span className="ml-auto text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                                {drill.bpmTarget} BPM
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Error display */}
                {analysis.analysisError && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-sm">{analysis.analysisError}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── Session History (always visible below) ── */}
      <SessionHistory onRestoreSession={handleRestoreSession} />
    </div>
  );
}
