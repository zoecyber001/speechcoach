'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, BarChart3, Dumbbell, ChevronRight } from 'lucide-react';

const SLIDES = [
    {
        icon: <Mic className="w-12 h-12" />,
        title: 'Record Your Speech',
        description: 'Choose an intent - Persuade, Inspire, Inform, or Connect - then speak naturally. Our AI coaches will analyze every dimension of your delivery.',
        gradient: 'from-indigo-500 to-violet-600',
    },
    {
        icon: <BarChart3 className="w-12 h-12" />,
        title: 'Get Expert Feedback',
        description: 'Receive a synthesized report from three expert speaking frameworks covering vocal range, pacing, filler words, and narrative arc.',
        gradient: 'from-emerald-500 to-teal-600',
    },
    {
        icon: <Dumbbell className="w-12 h-12" />,
        title: 'Train & Improve',
        description: 'Jump into targeted interactive modules - live tongue twisters, filler buster survival mode, teleprompter pacing, and immersive breathing exercises.',
        gradient: 'from-amber-500 to-orange-600',
    },
];

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
    const [current, setCurrent] = useState(0);
    const isLast = current === SLIDES.length - 1;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-6">
            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center text-center max-w-md"
                >
                    <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${SLIDES[current].gradient} flex items-center justify-center text-white shadow-2xl mb-10`}>
                        {SLIDES[current].icon}
                    </div>
                    <h2 className="text-3xl font-black text-white mb-4 tracking-tight">{SLIDES[current].title}</h2>
                    <p className="text-base text-slate-400 leading-relaxed mb-12">{SLIDES[current].description}</p>
                </motion.div>
            </AnimatePresence>

            {/* Dot indicators */}
            <div className="flex gap-2 mb-10">
                {SLIDES.map((_, i) => (
                    <div
                        key={i}
                        className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'w-8 bg-indigo-500' : 'w-2 bg-slate-700'
                            }`}
                    />
                ))}
            </div>

            <button
                onClick={() => {
                    if (isLast) {
                        localStorage.setItem('speechcoach_onboarded', 'true');
                        onComplete();
                    } else {
                        setCurrent(prev => prev + 1);
                    }
                }}
                className="flex items-center gap-2 px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
                {isLast ? 'Get Started' : 'Next'}
                <ChevronRight className="w-5 h-5" />
            </button>

            {!isLast && (
                <button
                    onClick={() => {
                        localStorage.setItem('speechcoach_onboarded', 'true');
                        onComplete();
                    }}
                    className="mt-6 text-sm text-slate-500 hover:text-slate-300 font-medium transition-colors"
                >
                    Skip
                </button>
            )}
        </div>
    );
}
