'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import { getLatestSession } from '@/lib/db';
import type { CoachDrill } from '@/lib/types';
import { MODULE_DATA, type ModuleId } from '@/lib/module-data';

export default function ExercisesHub() {
  const [recommendedDrills, setRecommendedDrills] = useState<CoachDrill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getLatestSession()
      .then((latest) => {
        if (latest?.feedback?.drills) {
          setRecommendedDrills(latest.feedback.drills);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const recommendedModules = new Set(recommendedDrills.map((d) => d.module as ModuleId));

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-3">Training Academy</h1>
        <p className="text-base text-slate-500 dark:text-slate-400 max-w-2xl">
          Deep-dive interactive modules to build muscle memory and vocal confidence.
          Select a track below to begin your focused training.
        </p>
        {recommendedModules.size > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-full">
            <Sparkles className="w-4 h-4" />
            Personalized recommendations based on your last session
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 animate-pulse min-h-[160px]" />
          ))
        ) : (
          MODULE_DATA.map((mod, i) => {
            const isRec = recommendedModules.has(mod.id);
            const drillData = recommendedDrills.find(d => d.module === mod.id);

            return (
              <Link href={`/exercises/${mod.id}`} key={mod.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative group h-full rounded-3xl border bg-white dark:bg-slate-900 overflow-hidden transition-all duration-300 ${isRec
                      ? `${mod.accent} ring-2 ${mod.activeAccent} shadow-md hover:shadow-lg hover:-translate-y-1`
                      : 'border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                >
                  <div className="p-6 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-2xl ${mod.accent} ${mod.color} shrink-0`}>
                        {mod.icon}
                      </div>
                      {isRec && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full shrink-0">
                          <Sparkles className="w-3.5 h-3.5" /> For You
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {mod.title}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 flex-1">
                      {mod.description}
                    </p>

                    {isRec && drillData?.reason && (
                      <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/60">
                        <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300 flex items-start gap-2">
                          <span className="font-bold shrink-0">Coach Note:</span>
                          <span className="line-clamp-2">{drillData.reason}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </Link>
            );
          })
        )}
      </div>
    </main>
  );
}
