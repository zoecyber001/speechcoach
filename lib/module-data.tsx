import { MessageSquare, Clock, Wind, CheckCircle2 } from 'lucide-react';
import React from 'react';

export type ModuleId = 'articulation' | 'pacing' | 'breathing' | 'fillers';

export interface ModuleDefinition {
    id: ModuleId;
    title: string;
    icon: React.ReactNode;
    color: string;
    accent: string;
    activeAccent: string;
    description: string;
    exercises: { title: string; description: string; duration: string }[];
}

export const MODULE_DATA: ModuleDefinition[] = [
    {
        id: 'articulation',
        title: 'Articulation & Clarity',
        icon: <MessageSquare className="w-6 h-6" />,
        color: 'text-blue-500',
        accent: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
        activeAccent: 'ring-blue-400/40 dark:ring-blue-500/30',
        description: 'Sharpen your consonants, enrich your vowels, and speak with absolute clarity.',
        exercises: [
            { title: 'The Pen Drill', description: 'Bite a pen, read a paragraph, then remove it and read again - feel the difference in clarity.', duration: '5 min' },
            { title: 'Consonant Pops', description: 'Repeat "Puh-Tuh-Kuh, Buh-Duh-Guh" 10x, making each pop as sharp as possible.', duration: '2 min' },
        ],
    },
    {
        id: 'pacing',
        title: 'Pacing & Pausing',
        icon: <Clock className="w-6 h-6" />,
        color: 'text-emerald-500',
        accent: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
        activeAccent: 'ring-emerald-400/40 dark:ring-emerald-500/30',
        description: 'Control your speed, lock into a rhythm, and use silence as a high-status weapon.',
        exercises: [
            { title: 'The 3-Second Rule', description: 'At every period, pause for 3 full seconds before continuing. Feels long - that\'s the point.', duration: '5 min' },
            { title: 'Metronome Reading', description: 'Speak one syllable per beat to lock in a steady rhythm.', duration: '5 min' },
        ],
    },
    {
        id: 'breathing',
        title: 'Breath Control',
        icon: <Wind className="w-6 h-6" />,
        color: 'text-sky-500',
        accent: 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800',
        activeAccent: 'ring-sky-400/40 dark:ring-sky-500/30',
        description: 'Master diaphragmatic breathing to project power, resonance, and stay calm under pressure.',
        exercises: [
            { title: 'Belly Breathing', description: 'Place a book on your stomach. Breathe so the book rises - not your chest.', duration: '5 min' },
            { title: 'Hissing Exhale', description: 'Deep breath in, exhale on a steady "ssss". Aim for 20+ seconds.', duration: '3 min' },
        ],
    },
    {
        id: 'fillers',
        title: 'Eliminating Fillers',
        icon: <CheckCircle2 className="w-6 h-6" />,
        color: 'text-purple-500',
        accent: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
        activeAccent: 'ring-purple-400/40 dark:ring-purple-500/30',
        description: 'Replace "um", "ah", and "like" with powerful, deliberate silence.',
        exercises: [
            { title: 'The Silent Pause', description: 'Answer a tough question on recording - force silence every time you want to say "um".', duration: '5 min' },
            { title: 'Transition Words', description: 'Practice replacing fillers with "Furthermore", "However", "Consequently".', duration: '4 min' },
        ],
    },
];
