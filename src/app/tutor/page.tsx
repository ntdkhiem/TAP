'use client';

import React, { useState } from 'react';
import { useSessionState, Question } from '@/utils/stateSync';
import { MathText } from '@/components/MathText';

const MOCK_QUESTIONS: Question[] = [
  {
    id: '1',
    text: 'Evaluate the integral: $$\\int x^2 dx$$',
    options: ['$x^3/3 + C$', '$2x + C$', '$x^2/2 + C$', '$x^3 + C$'],
    correctOption: 0
  },
  {
    id: '2',
    text: 'What is the limit as x approaches 0 of $$\\frac{\\sin(x)}{x}$$?',
    options: ['$0$', '$1$', '$\\infty$', 'undefined'],
    correctOption: 1
  }
];

export default function TutorPortal() {
  const { session, updateSession } = useSessionState();
  const [setupQuestions] = useState<Question[]>(MOCK_QUESTIONS);

  const generateClassCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    updateSession({
      ...session,
      classCode: code,
      questions: setupQuestions,
      status: 'waiting',
      students: []
    });
  };

  const startTest = () => {
    updateSession({ ...session, status: 'started' });
  };

  const resetSession = () => {
    updateSession({
      classCode: null,
      status: 'waiting',
      questions: [],
      students: []
    });
  };

  // Phase 1: Setup
  if (!session.classCode) {
    return (
      <div className="flex flex-col items-center p-8 min-h-screen">
        <div className="glass-panel w-full max-w-2xl">
          <h2>Tutor Setup</h2>
          <p>Review the questions below and generate a class code to start.</p>
          
          <div className="mt-8 flex flex-col gap-4">
            {setupQuestions.map((q, idx) => (
              <div key={q.id} className="p-4 border border-white/10 rounded-lg bg-white/5">
                <div className="font-semibold mb-2">Question {idx + 1}</div>
                <MathText text={q.text} />
                <div className="mt-4 flex flex-col gap-2">
                  {q.options?.map((option, oIdx) => (
                    <div key={oIdx} className={`p-2 rounded border flex items-center ${q.correctOption === oIdx ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 bg-white/5'}`}>
                      <MathText text={option} />
                      {q.correctOption === oIdx && <span className="ml-auto text-xs text-emerald-400 uppercase font-bold tracking-wider">Correct</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button className="btn btn-primary" onClick={generateClassCode}>
              Generate Class Code
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Phase 2: Waiting Room
  if (session.status === 'waiting') {
    return (
      <div className="flex flex-col items-center p-8 min-h-screen">
        <div className="glass-panel w-full max-w-2xl text-center">
          <h2>Waiting Room</h2>
          <div className="text-6xl font-bold tracking-widest my-8 text-indigo-400">
            {session.classCode}
          </div>
          <p>Share this code with your students.</p>
          
          <div className="mt-8 p-6 bg-white/5 rounded-lg border border-white/10 text-left">
            <h3>Students Joined ({session.students.length})</h3>
            {session.students.length === 0 ? (
              <div className="text-gray-400 mt-4 italic">Waiting for students to join...</div>
            ) : (
              <ul className="mt-4 flex flex-col gap-2">
                {session.students.map(s => (
                  <li key={s.id} className="bg-indigo-900/40 p-2 rounded px-4 flex justify-between items-center">
                    <span>{s.name}</span>
                    <span className="badge badge-success">Ready</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-8 flex gap-4 justify-center">
            <button className="btn btn-outline" onClick={resetSession}>Cancel</button>
            <button 
              className="btn btn-primary" 
              onClick={startTest}
              disabled={session.students.length === 0}
            >
              Start Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Phase 3: Live Dashboard
  return (
    <div className="flex flex-col p-8 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h2>Live Insights Dashboard</h2>
        <div className="flex gap-4">
          <span className="badge badge-success">Session Active</span>
          <span className="badge">Code: {session.classCode}</span>
          <button className="btn btn-outline py-1 px-3 text-sm" onClick={resetSession}>End Session</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h3>Student Progress</h3>
          {session.students.map(student => (
            <div key={student.id} className={`glass-panel flex flex-col gap-2 ${student.isStruggling ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : ''}`}>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">{student.name}</span>
                {student.isStruggling && <span className="badge badge-danger">Struggling</span>}
                {!student.isStruggling && <span className="badge badge-success">On Track</span>}
              </div>
              <div className="text-sm text-gray-400 flex justify-between">
                <span>Current Q: {student.currentQuestionIndex + 1} / {session.questions.length}</span>
                <span>Time Spent: {student.timeSpentSeconds}s</span>
                <span>Score: {student.score}</span>
              </div>
              {student.incorrectAttempts > 0 && (
                <div className="text-sm text-red-400">
                  Failed attempts on current question: {student.incorrectAttempts}
                </div>
              )}
            </div>
          ))}
          {session.students.length === 0 && (
            <div className="glass-panel text-center text-gray-400">No students joined.</div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <h3>AI Assistant Suggestions</h3>
          {session.students.filter(s => s.isStruggling).length === 0 ? (
            <div className="glass-panel text-center text-gray-400 italic">
              All students are doing well. No interventions needed right now.
            </div>
          ) : (
            session.students.filter(s => s.isStruggling).map(student => (
              <div key={`insight-${student.id}`} className="glass-panel bg-indigo-900/20 border-indigo-500/30">
                <div className="font-semibold text-indigo-300 mb-2">Insight: {student.name}</div>
                <p className="text-sm text-gray-300">
                  {student.name} has spent {student.timeSpentSeconds} seconds on Question {student.currentQuestionIndex + 1} and answered incorrectly {student.incorrectAttempts} times.
                </p>
                <div className="mt-3 text-sm p-3 bg-black/30 rounded border border-white/5">
                  <span className="text-indigo-400 font-semibold">Gemini AI Suggestion:</span>
                  <br />
                  &quot;Consider providing a hint about the rules of integration/limits. They might be forgetting the power rule.&quot;
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
