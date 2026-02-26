import Dexie, { type Table } from 'dexie';
import type { CoachingSession } from './types';

class SpeechCoachDB extends Dexie {
    sessions!: Table<CoachingSession>;

    constructor() {
        super('SpeechCoachDB');
        this.version(1).stores({
            // id is auto-incremented; createdAt and intent are indexed for filtering/sorting
            sessions: '++id, createdAt, intent',
        });
    }
}

export const db = new SpeechCoachDB();
