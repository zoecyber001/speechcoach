import { supabase } from './supabase';
import type { CoachingSession, CoachFeedback, SpeechIntent } from './types';

// generates a random device id and stores it in localStorage
// this isolates sessions per browser without requiring auth
function getDeviceId(): string {
    if (typeof window === 'undefined') return '';
    let id = localStorage.getItem('speechcoach_device_id');
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem('speechcoach_device_id', id);
    }
    return id;
}

export async function getSessions(): Promise<CoachingSession[]> {
    const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('device_id', getDeviceId())
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[db] failed to load sessions:', error.message);
        return [];
    }

    return (data ?? []).map(row => ({
        id: row.id,
        createdAt: new Date(row.created_at),
        intent: row.intent as SpeechIntent,
        feedback: row.feedback as CoachFeedback,
    }));
}

export async function getLatestSession(): Promise<CoachingSession | null> {
    const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('device_id', getDeviceId())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error || !data) return null;

    return {
        id: data.id,
        createdAt: new Date(data.created_at),
        intent: data.intent as SpeechIntent,
        feedback: data.feedback as CoachFeedback,
    };
}

// grabs the second-most-recent session for delta comparison
export async function getPreviousSession(): Promise<CoachingSession | null> {
    const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('device_id', getDeviceId())
        .order('created_at', { ascending: false })
        .limit(2);

    if (error || !data || data.length < 2) return null;
    const prev = data[1]; // second item is the previous one
    return {
        id: prev.id,
        createdAt: new Date(prev.created_at),
        intent: prev.intent as SpeechIntent,
        feedback: prev.feedback as CoachFeedback,
    };
}

export async function saveSession(args: {
    intent: SpeechIntent;
    feedback: CoachFeedback;
}): Promise<CoachingSession> {
    const row = {
        device_id: getDeviceId(),
        intent: args.intent,
        feedback: args.feedback,
    };

    const { data, error } = await supabase
        .from('sessions')
        .insert(row)
        .select()
        .single();

    if (error) throw new Error(`Failed to save session: ${error.message}`);

    return {
        id: data.id,
        createdAt: new Date(data.created_at),
        intent: data.intent as SpeechIntent,
        feedback: data.feedback as CoachFeedback,
    };
}

export async function deleteSession(id: string): Promise<void> {
    const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', id)
        .eq('device_id', getDeviceId()); // only delete your own

    if (error) console.error('[db] failed to delete session:', error.message);
}
