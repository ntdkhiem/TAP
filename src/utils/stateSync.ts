'use client';

import { useEffect, useState, useCallback } from 'react';

// Types
export interface Question {
  id: string;
  text: string;
  options?: string[]; // For multiple choice
  correctOption?: number; // Index
}

export interface StudentInfo {
  id: string;
  name: string;
  currentQuestionIndex: number;
  timeSpentSeconds: number;
  incorrectAttempts: number;
  skipped: boolean;
  isStruggling: boolean;
  score: number;
}

export interface SessionState {
  id?: string;
  classCode: string | null;
  status: 'waiting' | 'started' | 'ended';
  questions: Question[];
  students: StudentInfo[];
}

export const INITIAL_STATE: SessionState = {
  classCode: null,
  status: 'waiting',
  questions: [],
  students: [],
};

const CHANNEL_NAME = 'tap-session-channel';

export function broadcastSessionUpdate(state: SessionState) {
  if (typeof window !== 'undefined') {
    // Save to local storage for persistence across reloads
    localStorage.setItem('tap-session', JSON.stringify(state));
    // Broadcast to other tabs
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage(state);
    channel.close();
  }
}

export function useSessionState() {
  const [session, setSession] = useState<SessionState>(INITIAL_STATE);

  useEffect(() => {
    // Initial load
    const stored = localStorage.getItem('tap-session');
    if (stored) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSession(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse session state', e);
      }
    }

    // Listen for updates from other tabs
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event) => {
      setSession(event.data);
    };

    return () => {
      channel.close();
    };
  }, []);

  const updateSession = useCallback((newState: SessionState | ((prev: SessionState) => SessionState)) => {
    setSession((prev) => {
      const nextState = typeof newState === 'function' ? newState(prev) : newState;
      broadcastSessionUpdate(nextState);
      return nextState;
    });
  }, []);

  // For compatibility with the Supabase version's loading state
  const loading = false;

  return { session, updateSession, loading };
}
