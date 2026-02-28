'use client';

import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Play } from 'lucide-react';
import { motion } from 'motion/react';
import { MODULE_DATA, type ModuleId } from '@/lib/module-data';

import BreathingExercise from '@/components/exercises/BreathingExercise';
import TongueTwister from '@/components/exercises/TongueTwister';
import Metronome from '@/components/exercises/Metronome';
// We will replace this with the live Filler Buster component next
import FillerBuster from '@/components/exercises/FillerBuster';

export default function ModuleSpokePage() {
    const params = useParams();
    const router = useRouter();
    const modId = params.id as ModuleId;

    const mod = MODULE_DATA.find(m => m.id === modId);

    if (!mod) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">Module not found</h1>
                <button onClick={() => router.push('/exercises')} className="text-indigo-600 font-medium hover:underline">
                    Return to Hub
                </button>
            </div>
        );
    }

    const renderInteractive = () => {
        switch (mod.id) {
            case 'articulation': return <TongueTwister />;
            case 'pacing': return <Metronome />;
            case 'breathing': return <BreathingExercise />;
            case 'fillers': return <FillerBuster />;
            default: return null;
        }
    };

    return (
        <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
            {/* Header & Back Navigation */}
            <div className="mb-8">
                <button
                    onClick={() => router.push('/exercises')}
                    className="group flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors mb-6"
                >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Academy
                </button>

                <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                    <div className={`p-4 rounded-2xl shadow-sm ${mod.accent} ${mod.color} shrink-0`}>
                        {mod.icon}
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white capitalize tracking-tight mb-1">
                            {mod.title}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400">{mod.description}</p>
                    </div>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-10"
            >
                {/* The Live Interactive Component Area */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Live Training Zone</h2>
                        <span className="text-xs font-semibold px-2 py-1 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-md uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> Live
                        </span>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-2 sm:p-6 shadow-xl border border-slate-100 dark:border-slate-800">
                        {renderInteractive()}
                    </div>
                </section>

                {/* Static Practice Drills */}
                <section>
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Offline Practice Drills</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {mod.exercises.map((ex, i) => (
                            <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                                <div className={`p-2 rounded-xl ${mod.accent} ${mod.color} shrink-0 mt-0.5`}><Play className="w-4 h-4" /></div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">{ex.title}</h4>
                                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md shrink-0">{ex.duration}</span>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{ex.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

            </motion.div>
        </main>
    );
}
