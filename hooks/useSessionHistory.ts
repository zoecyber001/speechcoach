'use client';

import { useState, useCallback } from 'react';
import { getSessions, saveSession as dbSave, deleteSession as dbDelete } from '@/lib/db';
import type { CoachingSession, CoachFeedback, SpeechIntent } from '@/lib/types';

interface UseSessionHistoryReturn {
    sessions: CoachingSession[];
    isLoading: boolean;
    loadSessions: () => Promise<void>;
    saveSession: (args: { intent: SpeechIntent; feedback: CoachFeedback }) => Promise<CoachingSession>;
    deleteSession: (id: string) => Promise<void>;
}

// simple CRUD for coaching sessions stored in Supabase
// everything is isolated by a device_id in localStorage
export function useSessionHistory(): UseSessionHistoryReturn {
    const [sessions, setSessions] = useState<CoachingSession[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadSessions = useCallback(async () => {
        setIsLoading(true);
        try {
            const all = await getSessions();
            setSessions(all);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const saveSession = useCallback(
        async ({ intent, feedback }: { intent: SpeechIntent; feedback: CoachFeedback }): Promise<CoachingSession> => {
            const saved = await dbSave({ intent, feedback });
            setSessions((prev) => [saved, ...prev]);
            return saved;
        },
        []
    );

    const deleteSession = useCallback(async (id: string) => {
        await dbDelete(id);
        setSessions((prev) => prev.filter((s) => s.id !== id));
    }, []);

    return { sessions, isLoading, loadSessions, saveSession, deleteSession };
}
