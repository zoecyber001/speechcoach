import { BookOpen, Wind, Clock, MessageSquare, CheckCircle2 } from 'lucide-react';
import BreathingExercise from '@/components/exercises/BreathingExercise';
import TongueTwister from '@/components/exercises/TongueTwister';
import Metronome from '@/components/exercises/Metronome';

const modules = [
  {
    id: 'articulation',
    title: 'Articulation & Clarity',
    icon: <MessageSquare className="w-6 h-6 text-blue-500" />,
    description: 'Improve the crispness of your consonants and the richness of your vowels.',
    interactive: <TongueTwister />,
    exercises: [
      {
        title: 'The Pen Drill',
        description: 'Hold a clean pen horizontally between your teeth and read a paragraph aloud. Focus on over-enunciating. Then remove the pen and read it again.',
        duration: '5 mins'
      },
      {
        title: 'Consonant Pops',
        description: 'Repeat "Puh-Tuh-Kuh, Buh-Duh-Guh" 10 times, focusing on making the sounds as sharp and distinct as possible.',
        duration: '2 mins'
      }
    ]
  },
  {
    id: 'pacing',
    title: 'Pacing & Pausing',
    icon: <Clock className="w-6 h-6 text-emerald-500" />,
    description: 'Learn to control your speed and use silence to your advantage.',
    interactive: <Metronome />,
    exercises: [
      {
        title: 'The 3-Second Rule',
        description: 'Read a text aloud. Every time you see a period, count to 3 in your head before starting the next sentence.',
        duration: '5 mins'
      },
      {
        title: 'Metronome Reading',
        description: 'Set a metronome to 120 BPM. Read a passage, trying to speak one syllable per beat to establish a steady rhythm.',
        duration: '5 mins'
      }
    ]
  },
  {
    id: 'breathing',
    title: 'Breath Control',
    icon: <Wind className="w-6 h-6 text-sky-500" />,
    description: 'Support your voice with proper diaphragmatic breathing to project confidence.',
    interactive: <BreathingExercise />,
    exercises: [
      {
        title: 'Belly Breathing',
        description: 'Lie on your back with a book on your stomach. Breathe in deeply so the book rises, then exhale slowly so it falls. Do not move your chest.',
        duration: '5 mins'
      },
      {
        title: 'Hissing Exhale',
        description: 'Take a deep belly breath. Exhale slowly on a "ssss" sound, timing yourself. Try to make the hiss last for at least 20 seconds steadily.',
        duration: '3 mins'
      }
    ]
  },
  {
    id: 'fillers',
    title: 'Eliminating Fillers',
    icon: <CheckCircle2 className="w-6 h-6 text-purple-500" />,
    description: 'Replace "um", "uh", and "like" with powerful, confident pauses.',
    exercises: [
      {
        title: 'The Silent Pause',
        description: 'Record yourself answering a complex question (e.g., "Explain quantum physics"). Every time you feel the urge to say "um", force yourself to stay completely silent instead.',
        duration: '5 mins'
      },
      {
        title: 'Transition Words',
        description: 'Practice using strong transition words ("Furthermore", "However", "Consequently") instead of filler words to connect your thoughts.',
        duration: '4 mins'
      }
    ]
  }
];

export default function ExercisesPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Training Modules</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
          Master the fundamentals of public speaking with these targeted exercises. 
          Practice these daily to build muscle memory and vocal confidence.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {modules.map((mod) => (
          <div key={mod.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                  {mod.icon}
                </div>
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{mod.title}</h2>
              </div>
              <p className="text-slate-600 dark:text-slate-400">{mod.description}</p>
            </div>
            
            <div className="p-6 flex-1 flex flex-col gap-6">
              {mod.interactive && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Interactive Tool</h3>
                  {mod.interactive}
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Practice Drills</h3>
                <div className="flex flex-col gap-6">
                  {mod.exercises.map((exercise, idx) => (
                    <div key={idx} className="group">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-lg font-medium text-slate-900 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {exercise.title}
                        </h4>
                        <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full whitespace-nowrap">
                          {exercise.duration}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {exercise.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
