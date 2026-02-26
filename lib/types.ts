// Shared domain types for the AI Speech Coach

export type SpeechIntent = 'persuade' | 'inspire' | 'inform' | 'connect';

export interface CoachDrill {
  module: 'articulation' | 'pacing' | 'breathing' | 'fillers';
  reason: string;
  /** Gemini-recommended BPM target for the Metronome, if pacing was flagged */
  bpmTarget?: number;
}

export interface CoachFeedback {
  score: number; // 0–100 overall
  transcription: string;
  breakdown: {
    /** Vinh Giang — Vocal Mechanics: rate, pitch, pause toolbox */
    mechanics: string;
    /** Nick Morgan — Narrative/Intent alignment */
    story: string;
    /** Connie Dieken — Presence & connective tissue */
    presence: string;
  };
  fillerWordCount: number;
  /** Estimated syllables per minute derived from audio duration + word count */
  pacingBpm: number;
  drills: CoachDrill[];
}

export interface CoachingSession {
  id?: number; // auto-incremented by Dexie
  createdAt: Date;
  intent: SpeechIntent;
  feedback: CoachFeedback;
  /** Raw audio stored as base64 data URL for in-browser playback */
  audioDatUrl?: string;
}
