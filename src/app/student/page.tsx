'use client';

import React, { useState, useEffect } from 'react';
import { useSessionState, StudentInfo } from '@/utils/stateSync';
import { MathText } from '@/components/MathText';
import { joinSessionRecord, submitAnswerRecord, syncTimerRecord, markStrugglingRecord } from '@/utils/supabaseActions';
import { supabase } from '@/utils/supabaseClient';

export default function StudentPortal() {
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const { session, updateSession } = useSessionState(activeCode);
  const [joinCode, setJoinCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [myId, setMyId] = useState<string | null>(null);
  
  // Timer for tracking time spent on current question
  useEffect(() => {
    if (session.status !== 'started' || !myId || !session.id) return;

    const interval = setInterval(async () => {
      // Local UI update
      updateSession(prev => {
        const studentIndex = prev.students.findIndex(s => s.id === myId);
        if (studentIndex === -1) return prev;
        
        const students = [...prev.students];
        const student = { ...students[studentIndex] };
        
        student.timeSpentSeconds += 1;
        
        if (student.timeSpentSeconds > 30 || student.incorrectAttempts >= 2) {
          student.isStruggling = true;
        }

        students[studentIndex] = student;
        return { ...prev, students };
      });

      // Sync to Supabase every 5 seconds to avoid hammering the DB
      const me = session.students.find(s => s.id === myId);
      if (me) {
        if (me.timeSpentSeconds % 5 === 0) {
           const currentQ = session.questions[me.currentQuestionIndex];
           if (currentQ) {
             await syncTimerRecord(myId, currentQ.id, me.timeSpentSeconds, me.incorrectAttempts);
           }
        }
        if (me.timeSpentSeconds === 31) {
           await markStrugglingRecord(myId);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session.status, myId, session.id, session.students, session.questions, updateSession]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode || !studentName) return;
    
    // Fetch session directly from Supabase
    const { data: sessionData, error } = await supabase.from('sessions').select('*').eq('class_code', joinCode).single();
    
    if (error || !sessionData) {
      alert("Invalid Class Code. Please wait for the tutor to generate one.");
      return;
    }

    // Save to Supabase
    const supabaseStudentId = await joinSessionRecord(sessionData.id, studentName);
    const finalId = supabaseStudentId || Math.random().toString(36).substring(2, 9);
    setMyId(finalId);
    setActiveCode(joinCode);
    
    // Save to local storage for page reloads
    localStorage.setItem('tap-session', JSON.stringify({ classCode: joinCode }));

    const newStudent: StudentInfo = {
      id: finalId,
      name: studentName,
      currentQuestionIndex: 0,
      timeSpentSeconds: 0,
      incorrectAttempts: 0,
      skipped: false,
      isStruggling: false,
      score: 0
    };

    updateSession(prev => ({
      ...prev,
      students: [...prev.students, newStudent]
    }));
  };

  const handleAnswer = async (optionIndex: number) => {
    if (!myId) return;

    const studentIndex = session.students.findIndex(s => s.id === myId);
    if (studentIndex === -1) return;
    
    const student = { ...session.students[studentIndex] };
    const currentQ = session.questions[student.currentQuestionIndex];
    let isCorrect = false;

    if (currentQ.correctOption === optionIndex) {
      isCorrect = true;
      student.score += 1;
      student.currentQuestionIndex += 1;
      student.timeSpentSeconds = 0;
      student.incorrectAttempts = 0;
      student.isStruggling = false;
    } else {
      student.incorrectAttempts += 1;
      if (student.incorrectAttempts >= 2) {
        student.isStruggling = true;
        await markStrugglingRecord(myId);
      }
    }

    // Sync to Supabase
    await submitAnswerRecord(myId, currentQ.id, isCorrect, student.score, student.currentQuestionIndex);
    
    updateSession(prev => {
      const students = [...prev.students];
      students[studentIndex] = student;
      return { ...prev, students };
    });
  };

  // Phase 1: Join Class
  if (!myId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="glass-panel w-full max-w-md">
          <h2 className="text-center mb-6">Join Class</h2>
          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <div className="input-group">
              <label className="input-label">Student Name</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Enter your name"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Class Code</label>
              <input 
                type="text" 
                className="input-field uppercase tracking-widest" 
                placeholder="Enter 6-character code"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
            </div>
            <button type="submit" className="btn btn-primary mt-2">Join Room</button>
          </form>
        </div>
      </div>
    );
  }

  // Phase 2: Waiting Room
  if (session.status === 'waiting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <div className="glass-panel w-full max-w-md">
          <div className="animate-pulse mb-6">
            <div className="w-16 h-16 bg-indigo-500 rounded-full mx-auto opacity-50"></div>
          </div>
          <h2>You&apos;re In!</h2>
          <p>Waiting for the tutor to start the test...</p>
        </div>
      </div>
    );
  }

  const me = session.students.find(s => s.id === myId);
  if (!me) return <div>Error: Student not found</div>;

  // Phase 3: Test Finished
  if (me.currentQuestionIndex >= session.questions.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <div className="glass-panel w-full max-w-md">
          <h2>Test Complete!</h2>
          <div className="text-4xl font-bold my-6 text-emerald-400">
            {me.score} / {session.questions.length}
          </div>
          <p>Great job! You can wait here while the tutor reviews the results.</p>
        </div>
      </div>
    );
  }

  // Phase 3: Test Taking
  const currentQ = session.questions[me.currentQuestionIndex];

  return (
    <div className="flex flex-col items-center p-8 min-h-screen">
      <div className="w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <span className="text-gray-400">Question {me.currentQuestionIndex + 1} of {session.questions.length}</span>
          <span className="text-gray-400">Score: {me.score}</span>
        </div>

        <div className="glass-panel">
          <div className="text-xl mb-8">
            <MathText text={currentQ.text} />
          </div>

          <div className="flex flex-col gap-4">
            {currentQ.options?.map((option, idx) => (
              <button 
                key={idx}
                className="btn btn-outline p-4 justify-start text-left h-auto hover:bg-white/10"
                onClick={() => handleAnswer(idx)}
              >
                <MathText text={option} />
              </button>
            ))}
          </div>

          {me.incorrectAttempts > 0 && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg animate-pulse">
              Incorrect answer. Try again!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
