'use client';

import React, { useState, useEffect } from 'react';
import { useSessionState, StudentInfo } from '@/utils/stateSync';
import { MathText } from '@/components/MathText';

const Background = () => <div className="mesh-bg"></div>;

export default function StudentPortal() {
  const { session, updateSession } = useSessionState();
  const [joinCode, setJoinCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [myId, setMyId] = useState<string | null>(null);
  
  // Timer for tracking time spent on current question
  useEffect(() => {
    if (session.status !== 'started' || !myId) return;

    const interval = setInterval(() => {
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
    }, 1000);

    return () => clearInterval(interval);
  }, [session.status, myId, updateSession]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode || !studentName) return;
    
    if (session.classCode !== joinCode) {
      alert("Invalid Class Code. Please wait for the tutor to generate one.");
      return;
    }

    const newId = Math.random().toString(36).substring(2, 9);
    setMyId(newId);

    const newStudent: StudentInfo = {
      id: newId,
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

  const handleAnswer = (optionIndex: number) => {
    if (!myId) return;

    updateSession(prev => {
      const studentIndex = prev.students.findIndex(s => s.id === myId);
      if (studentIndex === -1) return prev;
      
      const student = { ...prev.students[studentIndex] };
      const currentQ = prev.questions[student.currentQuestionIndex];
      
      if (currentQ.correctOption === optionIndex) {
        // Correct!
        student.score += 1;
        student.currentQuestionIndex += 1;
        student.timeSpentSeconds = 0;
        student.incorrectAttempts = 0;
        student.isStruggling = false;
      } else {
        // Incorrect
        student.incorrectAttempts += 1;
        if (student.incorrectAttempts >= 2) student.isStruggling = true;
      }

      const students = [...prev.students];
      students[studentIndex] = student;
      return { ...prev, students };
    });
  };



  // Phase 1: Join Class
  if (!myId) {
    return (
      <>
        <div className="mesh-bg"></div>
        <div className="flex flex-col items-center justify-center min-h-screen p-8 relative z-10">
          <div className="glass-panel max-w-md w-full animate-fade-in-up">
            <h2 className="text-center mb-8 text-3xl">Join Class</h2>
            <form onSubmit={handleJoin} className="flex flex-col gap-6">
              <div className="input-group mb-0">
                <label className="input-label">Student Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Alice Smith"
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                />
              </div>
              <div className="input-group mb-0">
                <label className="input-label">Class Code</label>
                <input 
                  type="text" 
                  className="input-field uppercase tracking-[0.2em] font-mono text-center text-xl" 
                  placeholder="XXXXXX"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                />
              </div>
              <button type="submit" className="btn btn-primary mt-4 py-4 text-lg">Join Room</button>
            </form>
          </div>
        </div>
      </>
    );
  }

  // Phase 2: Waiting Room
  if (session.status === 'waiting') {
    return (
      <>
        <Background />
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center relative z-10">
          <div className="glass-panel w-full max-w-md animate-fade-in-up flex flex-col items-center py-12">
            <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 bg-indigo-500 rounded-full animate-pulse-glow opacity-50"></div>
              <div className="absolute inset-2 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-2xl z-10">
                IN
              </div>
            </div>
            <h2 className="text-3xl mb-2">You&apos;re In!</h2>
            <p className="text-lg">Waiting for the tutor to start the test...</p>
          </div>
        </div>
      </>
    );
  }

  const me = session.students.find(s => s.id === myId);
  if (!me) return <div>Error: Student not found</div>;

  // Phase 3: Test Finished
  if (me.currentQuestionIndex >= session.questions.length) {
    return (
      <>
        <Background />
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center relative z-10">
          <div className="glass-panel w-full max-w-md animate-fade-in-up py-12">
            <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-3xl mb-2">Test Complete!</h2>
            <div className="text-5xl font-bold my-8 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
              {me.score} / {session.questions.length}
            </div>
            <p className="text-lg">Outstanding work! The tutor will review the results shortly.</p>
          </div>
        </div>
      </>
    );
  }

  // Phase 3: Test Taking
  const currentQ = session.questions[me.currentQuestionIndex];
  const progressPercent = (me.currentQuestionIndex / session.questions.length) * 100;

  return (
    <>
      <div className="mesh-bg"></div>
      <div className="flex flex-col items-center p-4 lg:p-8 min-h-screen relative z-10">
        <div className="w-full max-w-3xl animate-fade-in-up">
          
          {/* Progress Header */}
          <div className="glass-panel mb-8 !p-4 flex flex-col gap-4">
            <div className="flex justify-between items-center px-2">
              <span className="text-sm font-semibold tracking-wider text-indigo-300 uppercase">Question {me.currentQuestionIndex + 1} of {session.questions.length}</span>
              <span className="badge badge-success !text-sm">Score: {me.score}</span>
            </div>
            <div className="progress-bg">
              <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>

          {/* Question Card */}
          <div className={`glass-panel mb-8 p-8 lg:p-12 ${me.incorrectAttempts > 0 ? 'border-red-500/30' : ''}`}>
            <div className="text-2xl lg:text-3xl mb-12 font-medium leading-tight">
              <MathText text={currentQ.text} />
            </div>

            <div className="flex flex-col gap-4">
              {currentQ.options?.map((option, idx) => (
                <button 
                  key={idx}
                  className="option-card group"
                  onClick={() => handleAnswer(idx)}
                >
                  <div className="w-10 h-10 rounded-full border-2 border-indigo-500/30 flex items-center justify-center mr-6 group-hover:border-indigo-400 group-hover:bg-indigo-500/20 transition-colors text-sm font-bold text-indigo-300">
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <div className="flex-1">
                    <MathText text={option} />
                  </div>
                </button>
              ))}
            </div>

            {me.incorrectAttempts > 0 && (
              <div className="mt-8 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl flex items-center gap-3 animate-shake">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="font-medium text-lg">Incorrect. Please try again!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
