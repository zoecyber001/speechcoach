'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mic, BookOpen } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-indigo-600 tracking-tight">SpeechCoach</span>
            </div>
            <div className="ml-8 flex space-x-8">
              <Link 
                href="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                  pathname === '/' 
                    ? 'border-indigo-500 text-slate-900' 
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                <Mic className="w-4 h-4 mr-2" />
                Practice
              </Link>
              <Link 
                href="/exercises"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                  pathname === '/exercises' 
                    ? 'border-indigo-500 text-slate-900' 
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Modules & Exercises
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
