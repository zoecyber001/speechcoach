// types shared across the speech coach app

export type SpeechIntent = 'persuade' | 'inspire' | 'inform' | 'connect';

export interface CoachDrill {
  module: 'articulation' | 'pacing' | 'breathing' | 'fillers';
  reason: string;
  bpmTarget?: number; // recommended BPM for metronome, only set if pacing was flagged
}

export interface CoachFeedback {
  score: number; // 0–100 overall
  transcription: string;
  breakdown: {
    mechanics: string; // Vinh Giang - vocal mechanics: rate, pitch, pauses
    story: string; // Nick Morgan - does the narrative match the intent?
    presence: string; // Connie Dieken - rapport and connective tissue
  };
  fillerWordCount: number;
  pacingBpm: number; // estimated syllables per minute
  drills: CoachDrill[];
}

export interface CoachingSession {
  id?: string; // UUID from Supabase
  createdAt: Date;
  intent: SpeechIntent;
  feedback: CoachFeedback;
}
