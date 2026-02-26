'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Trash2, ChevronDown, ChevronUp, Target, Zap, BookOpen, Wind, MessageSquare, CheckCircle2 } from 'lucide-react';
import { useSessionHistory } from '@/hooks/useSessionHistory';
import type { CoachingSession, SpeechIntent } from '@/lib/types';
import { useState } from 'react';

const INTENT_CONFIG: Record<SpeechIntent, { label: string; color: string }> = {
    persuade: { label: 'Persuade', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' },
    inspire: { label: 'Inspire', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
    inform: { label: 'Inform', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' },
    connect: { label: 'Connect', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
};

const DRILL_ICONS: Record<string, React.ReactNode> = {
    articulation: <MessageSquare className="w-4 h-4" />,
    pacing: <Clock className="w-4 h-4" />,
    breathing: <Wind className="w-4 h-4" />,
    fillers: <CheckCircle2 className="w-4 h-4" />,
};

function ScoreRing({ score }: { score: number }) {
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';

    return (
        <svg width="72" height="72" viewBox="0 0 72 72" className="shrink-0">
            <circle cx="36" cy="36" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-200 dark:text-slate-700" />
            <circle
                cx="36" cy="36" r={radius} fill="none"
                stroke={color} strokeWidth="6"
                strokeDasharray={circumference} strokeDashoffset={offset}
                strokeLinecap="round"
                transform="rotate(-90 36 36)"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
            <text x="36" y="41" textAnchor="middle" fontSize="14" fontWeight="700" fill={color}>{score}</text>
        </svg>
    );
}

function SessionCard({
    session,
    onDelete,
    onRestore,
}: {
    session: CoachingSession;
    onDelete: (id: number) => void;
    onRestore: (session: CoachingSession) => void;
}) {
    const { label, color } = INTENT_CONFIG[session.intent];
    const date = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(session.createdAt));

    return (
        <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow group">
            <ScoreRing score={session.feedback.score} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{label}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{date}
                    </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-snug line-clamp-2">
                    {session.feedback.transcription?.slice(0, 100)}…
                </p>
                {session.feedback.drills?.length > 0 && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                        {session.feedback.drills.map((d, i) => (
                            <span key={i} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full">
                                {DRILL_ICONS[d.module]}{d.module}
                            </span>
                        ))}
                    </div>
                )}
            </div>
            <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onRestore(session)}
                    className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                    title="View feedback"
                >
                    <BookOpen className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onDelete(session.id!)}
                    className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                    title="Delete session"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

interface SessionHistoryProps {
    onRestoreSession: (session: CoachingSession) => void;
}

export default function SessionHistory({ onRestoreSession }: SessionHistoryProps) {
    const { sessions, isLoading, loadSessions, deleteSession } = useSessionHistory();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    if (sessions.length === 0 && !isLoading) return null;

    return (
        <div className="w-full max-w-4xl mx-auto mt-8">
            <button
                onClick={() => setIsOpen((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
                <span className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-500" />
                    Past Sessions
                    <span className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-semibold">
                        {sessions.length}
                    </span>
                </span>
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="flex flex-col gap-3 pt-3 max-h-[480px] overflow-y-auto pr-1">
                            {isLoading ? (
                                <p className="text-center text-slate-400 py-4">Loading sessions…</p>
                            ) : (
                                sessions.map((session) => (
                                    <SessionCard
                                        key={session.id}
                                        session={session}
                                        onDelete={deleteSession}
                                        onRestore={onRestoreSession}
                                    />
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
