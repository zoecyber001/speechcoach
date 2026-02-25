import SpeechCoach from '@/components/SpeechCoach';

export default function Home() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-8 transition-colors">
      <SpeechCoach />
    </main>
  );
}
