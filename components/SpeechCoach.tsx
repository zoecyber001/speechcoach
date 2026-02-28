'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic, Square, Loader2, Play, RefreshCw, AlertCircle, Volume2,
  Activity, Zap, BookOpen, Users, TrendingUp, Target, Award,
  ChevronRight, Clock, Wind, MessageSquare, CheckCircle2, Share2, Download,
} from 'lucide-react';

import { useRecorder } from '@/hooks/useRecorder';
import { useAudioVisualizer } from '@/hooks/useAudioVisualizer';
import { useSpeechTranscription } from '@/hooks/useSpeechTranscription';
import { useSpeechAnalysis } from '@/hooks/useSpeechAnalysis';
import { useSessionHistory } from '@/hooks/useSessionHistory';
import SessionHistory from '@/components/SessionHistory';

import type { SpeechIntent, CoachFeedback, CoachingSession } from '@/lib/types';
import { getPreviousSession } from '@/lib/db';
import { shareScoreCard, downloadScoreCard } from '@/lib/scorecard';



type AppStep = 'intent' | 'record' | 'analyzing' | 'feedback';

const INTENT_OPTIONS: {
  value: SpeechIntent;
  label: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  border: string;
  sampleScript: string;
}[] = [
    {
      value: 'persuade',
      label: 'Persuade',
      description: 'Win someone over to your position',
      icon: <TrendingUp className="w-6 h-6" />,
      gradient: 'from-rose-500 to-pink-600',
      border: 'border-rose-200 dark:border-rose-800 hover:border-rose-400 dark:hover:border-rose-600',
      sampleScript: "I've reviewed the numbers, and if we pivot now, we can capture 30% more market share in Q3. Standing still is our biggest risk.",
    },
    {
      value: 'inspire',
      label: 'Inspire',
      description: 'Ignite energy and move people to act',
      icon: <Zap className="w-6 h-6" />,
      gradient: 'from-amber-500 to-orange-600',
      border: 'border-amber-200 dark:border-amber-800 hover:border-amber-400 dark:hover:border-amber-600',
      sampleScript: "What we're building isn't just a product. It's a new standard. I need everyone to bring their boldest ideas to the table tomorrow.",
    },
    {
      value: 'inform',
      label: 'Inform',
      description: 'Deliver clarity and build understanding',
      icon: <BookOpen className="w-6 h-6" />,
      gradient: 'from-sky-500 to-blue-600',
      border: 'border-sky-200 dark:border-sky-800 hover:border-sky-400 dark:hover:border-sky-600',
      sampleScript: "Here is the timeline update: Development finishes on the 15th, testing runs through the 25th, and we are aiming for a hard launch on the 30th.",
    },
    {
      value: 'connect',
      label: 'Connect',
      description: 'Build rapport and deepen relationships',
      icon: <Users className="w-6 h-6" />,
      gradient: 'from-emerald-500 to-teal-600',
      border: 'border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600',
      sampleScript: "Before we dive in, I just wanted to say thank you for the extra hours last week. It really made a difference, and I appreciate your dedication.",
    },
  ];

const DRILL_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  articulation: { label: 'Articulation', icon: <MessageSquare className="w-4 h-4" />, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' },
  pacing: { label: 'Pacing', icon: <Clock className="w-4 h-4" />, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400' },
  breathing: { label: 'Breathing', icon: <Wind className="w-4 h-4" />, color: 'text-sky-600 bg-sky-50 dark:bg-sky-900/20 dark:text-sky-400' },
  fillers: { label: 'Fillers', icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400' },
};



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

const ANALYZING_MESSAGES = [
  { heading: 'Analyzing with your expert coaches', sub: 'Giang is listening for pitch. Morgan is mapping your arc. Dieken is checking your presence…' },
  { heading: 'Measuring vocal dynamics', sub: 'Tracking pace variation, emphasis patterns, and silence usage across your delivery…' },
  { heading: 'Evaluating intent alignment', sub: 'Checking if your tone and structure match your chosen speaking goal…' },
  { heading: 'Scanning for filler words', sub: 'Identifying ums, uhs, likes, and other verbal crutches to help you cut them…' },
  { heading: 'Building your coach report', sub: 'Synthesizing feedback from all three frameworks into actionable insights…' },
  { heading: 'Almost there', sub: 'Putting the final touches on your personalized recommendations…' },
];

function AnalyzingSpinner() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % ANALYZING_MESSAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const current = ANALYZING_MESSAGES[msgIndex];

  return (
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
      <AnimatePresence mode="wait">
        <motion.div
          key={msgIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">{current.heading}</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md">{current.sub}</p>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

export default function SpeechCoach() {
  const [step, setStep] = useState<AppStep>('intent');
  const [intent, setIntent] = useState<SpeechIntent | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const recorder = useRecorder();
  const visualizer = useAudioVisualizer();
  const transcription = useSpeechTranscription();
  const analysis = useSpeechAnalysis();
  const history = useSessionHistory();

  const activeFeedback = analysis.feedback;
  const router = useRouter();

  // delta comparison against the previous session
  const [prevSession, setPrevSession] = useState<CoachingSession | null>(null);
  useEffect(() => {
    if (step === 'feedback' && activeFeedback) {
      getPreviousSession().then(setPrevSession).catch(() => { });
    }
  }, [step, activeFeedback]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    if (!intent) return;
    setMicError(null);
    transcription.resetTranscript();
    analysis.clearFeedback();

    const stream = await recorder.startRecording();
    if (!stream) {
      setMicError('Mic access denied. Please check your browser permissions.');
      return;
    }
    visualizer.startVisualizer(stream);
    transcription.startTranscription();
    setStep('record');
  };

  const handleStopRecording = useCallback(async () => {
    recorder.stopRecording();
    visualizer.stopVisualizer();
    transcription.stopTranscription();
    setStep('analyzing');

    // give MediaRecorder.onstop a moment to fire before we try to read the blob
    await new Promise((res) => setTimeout(res, 300));
  }, [recorder, visualizer, transcription]);

  // kicks off analysis once the blob is available
  const handleAnalyze = useCallback(
    async (blob: Blob) => {
      const result = await analysis.analyze(blob, intent!);
      if (result) {
        // save in the background - don't block feedback if Supabase is down or misconfigured
        history.saveSession({ intent: intent!, feedback: result }).catch((err) => {
          console.warn('Session save failed (will still show feedback):', err);
        });
      }
      setStep('feedback');
    },
    [intent, analysis, history]
  );

  // detect when the blob becomes available after stopping
  const [analyzedBlob, setAnalyzedBlob] = useState<string | null>(null);
  if (
    step === 'analyzing' &&
    recorder.audioBlob &&
    recorder.audioDatUrl &&
    recorder.audioDatUrl !== analyzedBlob
  ) {
    setAnalyzedBlob(recorder.audioDatUrl);
    handleAnalyze(recorder.audioBlob);
  }

  // Auto-stop at 3 minutes
  const MAX_RECORDING_SECONDS = 180;
  if (step === 'record' && recorder.duration >= MAX_RECORDING_SECONDS) {
    handleStopRecording();
  }

  const handleReset = () => {
    analysis.clearFeedback();
    transcription.resetTranscript();
    setAnalyzedBlob(null);
    setMicError(null);
    setStep('intent');
  };

  const handleRestoreSession = (session: CoachingSession) => {
    analysis.clearFeedback();
    // Inject the stored feedback
    analysis.setFeedback(session.feedback);
    setStep('feedback');
  };

  const displayFeedback = activeFeedback;
  const displayAudio = step === 'feedback' && analyzedBlob === recorder.audioDatUrl ? recorder.audioDatUrl : null;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col items-center">

      {/* ── Header ── */}
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
          Your Personal <span className="text-indigo-600 dark:text-indigo-400">Speech Coach</span>
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Coached by the frameworks of Giang, Morgan & Dieken - powered by Gemini.
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

            <div className="flex flex-col items-center gap-4">
              <button
                onClick={handleStartRecording}
                disabled={!intent}
                className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-semibold text-lg shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 transition-all"
              >
                <Mic className="w-5 h-5" />
                Start Recording
                <ChevronRight className="w-5 h-5" />
              </button>

              {micError && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium text-sm bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-xl">
                  <AlertCircle className="w-4 h-4" />
                  {micError}
                </div>
              )}
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
              <div className="flex flex-col items-center mb-6 w-full">
                <span className={`mb-4 inline-flex text-xs font-semibold px-3 py-1.5 rounded-full bg-gradient-to-r ${INTENT_OPTIONS.find(o => o.value === intent)?.gradient} text-white`}>
                  Intent: {INTENT_OPTIONS.find(o => o.value === intent)?.label}
                </span>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 w-full text-center">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Practice Script</p>
                  <p className="text-slate-800 dark:text-slate-200 font-medium italic">
                    "{INTENT_OPTIONS.find(o => o.value === intent)?.sampleScript}"
                  </p>
                </div>
              </div>
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

            <div className="text-3xl font-mono text-red-500 font-semibold mb-1">{formatTime(recorder.duration)} / 03:00</div>
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

        {/* Step 3: Analyzing */}
        {step === 'analyzing' && <AnalyzingSpinner />}

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
              <div className="flex gap-2">
                <button
                  onClick={() => intent && shareScoreCard(displayFeedback, intent)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors text-sm"
                  title="Share or download your score card"
                >
                  <Share2 className="w-4 h-4" />Share
                </button>
                <button
                  onClick={() => intent && downloadScoreCard(displayFeedback, intent)}
                  className="flex items-center gap-2 px-3 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors text-sm"
                  title="Download as PNG"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
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
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{displayFeedback.fillerWordCount}</span>
                        {prevSession && (() => {
                          const diff = displayFeedback.fillerWordCount - prevSession.feedback.fillerWordCount;
                          if (diff === 0) return null;
                          return <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${diff < 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>{diff < 0 ? `↓ ${Math.abs(diff)}` : `↑ +${diff}`}</span>;
                        })()}
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Score</div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{displayFeedback.score}</span>
                        {prevSession && (() => {
                          const diff = displayFeedback.score - prevSession.feedback.score;
                          if (diff === 0) return null;
                          return <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${diff > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>{diff > 0 ? `↑ +${diff}` : `↓ ${diff}`}</span>;
                        })()}
                      </div>
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
                        const meta = DRILL_META[drill.module] ?? { label: drill.module, icon: <Award className="w-4 h-4" />, color: 'text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-400' };
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

                    {/* Smart Funnel CTA */}
                    <button
                      onClick={() => router.push(`/exercises/${displayFeedback.drills[0].module}`)}
                      className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl font-bold text-base shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
                    >
                      <Target className="w-5 h-5" />
                      Train This Now
                      <ChevronRight className="w-5 h-5" />
                    </button>
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
