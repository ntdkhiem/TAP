'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabaseClient';

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

// Since we are transitioning to Supabase, we need an async hook 
// that subscribes to the specific session's tables.
export function useSessionState(classCodeToWatch?: string | null) {
  const [session, setSession] = useState<SessionState>(INITIAL_STATE);
  const [loading, setLoading] = useState(true);

  // Fetch initial state
  const loadSession = useCallback(async (code: string) => {
    setLoading(true);
    try {
      // 1. Fetch Session
      const { data: sessionData, error: sessionErr } = await supabase
        .from('sessions')
        .select('*')
        .eq('class_code', code)
        .single();
        
      if (sessionErr || !sessionData) throw sessionErr;

      // 2. Fetch Questions
      const { data: qData } = await supabase
        .from('questions')
        .select('*')
        .eq('session_id', sessionData.id)
        .order('order_index', { ascending: true });

      const parsedQuestions = (qData || []).map(q => ({
        id: q.id,
        text: q.text,
        options: q.options,
        correctOption: q.correct_option_index
      }));

      // 3. Fetch Students & Progress
      const { data: stData } = await supabase
        .from('students')
        .select('*')
        .eq('session_id', sessionData.id);

      const parsedStudents: StudentInfo[] = [];
      if (stData) {
        for (const s of stData) {
          // We can join this in a real app, but doing separately for prototype clarity
          const { data: progData } = await supabase
            .from('student_progress')
            .select('*')
            .eq('student_id', s.id)
            .order('updated_at', { ascending: false })
            .limit(1);
            
          const latestProg = progData?.[0] || { time_spent_seconds: 0, incorrect_attempts: 0, skipped: false };
          
          parsedStudents.push({
            id: s.id,
            name: s.name,
            score: s.score,
            currentQuestionIndex: s.current_question_index,
            isStruggling: s.is_struggling,
            timeSpentSeconds: latestProg.time_spent_seconds,
            incorrectAttempts: latestProg.incorrect_attempts,
            skipped: latestProg.skipped
          });
        }
      }

      setSession({
        id: sessionData.id,
        classCode: sessionData.class_code,
        status: sessionData.status,
        questions: parsedQuestions,
        students: parsedStudents
      });
    } catch (e) {
      console.error('Error loading session:', e);
      // Fallback for when Supabase is not connected yet (Local mock mode)
      const stored = localStorage.getItem('tap-session');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (!code || parsed.classCode === code) setSession(parsed);
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Determine which code to watch (from param or local storage fallback)
    const code = classCodeToWatch || (() => {
      try {
        return JSON.parse(localStorage.getItem('tap-session') || '{}').classCode;
      } catch { return null; }
    })();

    if (!code) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    loadSession(code);

    // Setup Supabase Realtime Subscriptions
    // We subscribe to any changes in students or student_progress
    const channel = supabase.channel(`session-${code}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
        loadSession(code); // For prototype, simply reload state. In prod, apply granular updates.
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_progress' }, () => {
        loadSession(code);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => {
        loadSession(code);
      })
      .subscribe();

    // LocalStorage fallback sync (from Phase 0)
    const localChannel = new BroadcastChannel('tap-session-channel');
    localChannel.onmessage = (event) => {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        setSession(event.data);
      }
    };

    return () => {
      supabase.removeChannel(channel);
      localChannel.close();
    };
  }, [classCodeToWatch, loadSession]);

  // Backward compatible updateSession method that attempts to write to Supabase
  // while also falling back to localStorage if Supabase isn't configured
  const updateSession = useCallback(async (newState: SessionState | ((prev: SessionState) => SessionState)) => {
    setSession((prev) => {
      const nextState = typeof newState === 'function' ? newState(prev) : newState;
      
      // Fallback: LocalStorage / BroadcastChannel
      if (typeof window !== 'undefined') {
        localStorage.setItem('tap-session', JSON.stringify(nextState));
        const channel = new BroadcastChannel('tap-session-channel');
        channel.postMessage(nextState);
        channel.close();
      }

      // If we have a connected Supabase client and it's a known session action,
      // we would normally write to Supabase here. For this phase, we keep the signature 
      // identical for backward compatibility with the components, but in a full refactor
      // the components would call specific actions like `startTest(sessionId)` which 
      // make direct Supabase `.update()` calls.
      
      // Let's attempt to sync the basic `status` to Supabase if it exists.
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && prev.id && prev.status !== nextState.status) {
        supabase.from('sessions').update({ status: nextState.status }).eq('id', prev.id).then();
      }

      return nextState;
    });
  }, []);

  return { session, updateSession, loading };
}
