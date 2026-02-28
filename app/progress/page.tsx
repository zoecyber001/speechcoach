'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Activity, Target, Award, CheckCircle2, Clock, Wind, MessageSquare, Loader2 } from 'lucide-react';
import { getSessions } from '@/lib/db';
import type { CoachingSession } from '@/lib/types';

const DRILL_COLORS: Record<string, string> = {
    articulation: '#3b82f6', // blue
    pacing: '#10b981',       // emerald
    breathing: '#0ea5e9',     // sky
    fillers: '#a855f7',      // purple
};

const DRILL_ICONS: Record<string, React.ReactNode> = {
    articulation: <MessageSquare className="w-4 h-4" />,
    pacing: <Clock className="w-4 h-4" />,
    breathing: <Wind className="w-4 h-4" />,
    fillers: <CheckCircle2 className="w-4 h-4" />,
};

const DRILL_NAMES: Record<string, string> = {
    articulation: 'Articulation',
    pacing: 'Pacing',
    breathing: 'Breathing',
    fillers: 'Fillers',
};

export default function ProgressPage() {
    const [sessions, setSessions] = useState<CoachingSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getSessions().then(data => {
            // getSessions returns newest first, but charts read better oldest -> newest
            setSessions([...data].reverse());
            setIsLoading(false);
        });
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col flex-1 items-center justify-center p-16">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
                <p className="text-slate-500 font-medium">Loading your progress…</p>
            </div>
        );
    }

    if (sessions.length === 0) {
        return (
            <main className="max-w-4xl mx-auto px-4 py-16 text-center">
                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-indigo-500">
                    <TrendingUp className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">No Data Yet</h1>
                <p className="text-slate-500 font-medium max-w-md mx-auto">
                    Complete your first coaching session to unlock your progress dashboard and see your growth over time.
                </p>
            </main>
        );
    }

    // --- Data Prep for Charts ---

    // 1. Trend Line (Score & Fillers)
    const trendData = sessions.map((s, i) => ({
        name: `Session ${i + 1}`,
        score: s.feedback.score,
        fillers: s.feedback.fillerWordCount,
    }));

    // 2. Drill Frequency (Bar Chart)
    const drillCounts: Record<string, number> = {};
    sessions.forEach(s => {
        s.feedback.drills?.forEach(d => {
            drillCounts[d.module] = (drillCounts[d.module] || 0) + 1;
        });
    });

    const drillData = Object.entries(drillCounts)
        .map(([module, count]) => ({
            name: DRILL_NAMES[module],
            count,
            fill: DRILL_COLORS[module],
        }))
        .sort((a, b) => b.count - a.count); // highest first

    // 3. Overall Stats
    const avgScore = Math.round(sessions.reduce((acc, s) => acc + s.feedback.score, 0) / sessions.length);
    const totalFillers = sessions.reduce((acc, s) => acc + s.feedback.fillerWordCount, 0);

    return (
        <main className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
            <div className="mb-10 text-center sm:text-left">
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">Metrics & Progress</h1>
                <p className="text-slate-500 dark:text-slate-400">Track your improvement across all coaching frameworks.</p>
            </div>

            {/* --- Top Stats Row --- */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center sm:items-start text-center sm:text-left">
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-3">
                        <Target className="w-5 h-5" />
                    </div>
                    <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">{sessions.length}</div>
                    <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider mt-1">Total Sessions</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center sm:items-start text-center sm:text-left">
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-3">
                        <Award className="w-5 h-5" />
                    </div>
                    <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">{avgScore}</div>
                    <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider mt-1">Avg Score</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center sm:items-start text-center sm:text-left">
                    <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mb-3">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">{totalFillers}</div>
                    <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider mt-1">Total Fillers</div>
                </div>

                {/* Most Recommended Drill */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center sm:items-start text-center sm:text-left">
                    <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center mb-3">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-tight">
                        {drillData[0]?.name || 'N/A'}
                    </div>
                    <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider mt-1">Top Focus Area</div>
                </div>
            </div>

            {/* --- Charts Row --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Trend Line */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Performance Over Time</h2>
                            <p className="text-sm text-slate-500 mt-1">Coach scores mapped across all past sessions</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                            <span className="w-3 h-3 rounded-full bg-indigo-500" /> Score
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} padding={{ left: 20, right: 20 }} />
                                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#6366f1"
                                    strokeWidth={4}
                                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                    animationDuration={1500}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Drill Distribution Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm"
                >
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">AI Drill Focus</h2>
                        <p className="text-sm text-slate-500 mt-1">Modules Gemini has flagged for you over time</p>
                    </div>

                    <div className="h-[300px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={drillData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }} barSize={32}>
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: '#f1f5f9' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]} animationDuration={1500} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

            </div>
        </main>
    );
}
