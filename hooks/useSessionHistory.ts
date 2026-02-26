'use client';

import { useState, useCallback } from 'react';
import { db } from '@/lib/db';
import type { CoachingSession, CoachFeedback, SpeechIntent } from '@/lib/types';

interface UseSessionHistoryReturn {
    sessions: CoachingSession[];
    isLoading: boolean;
    loadSessions: () => Promise<void>;
    saveSession: (args: {
        intent: SpeechIntent;
        feedback: CoachFeedback;
        audioDatUrl?: string;
    }) => Promise<CoachingSession>;
    deleteSession: (id: number) => Promise<void>;
}

/**
 * CRUD interface over Dexie/IndexedDB for coaching sessions.
 * Data stays fully client-local — no server storage required.
 */
export function useSessionHistory(): UseSessionHistoryReturn {
    const [sessions, setSessions] = useState<CoachingSession[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadSessions = useCallback(async () => {
        setIsLoading(true);
        try {
            const all = await db.sessions.orderBy('createdAt').reverse().toArray();
            setSessions(all);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const saveSession = useCallback(
        async ({
            intent,
            feedback,
            audioDatUrl,
        }: {
            intent: SpeechIntent;
            feedback: CoachFeedback;
            audioDatUrl?: string;
        }): Promise<CoachingSession> => {
            const session: CoachingSession = {
                createdAt: new Date(),
                intent,
                feedback,
                audioDatUrl,
            };
            const id = await db.sessions.add(session);
            const saved = { ...session, id: id as number };
            setSessions((prev) => [saved, ...prev]);
            return saved;
        },
        []
    );

    const deleteSession = useCallback(async (id: number) => {
        await db.sessions.delete(id);
        setSessions((prev) => prev.filter((s) => s.id !== id));
    }, []);

    return { sessions, isLoading, loadSessions, saveSession, deleteSession };
}
