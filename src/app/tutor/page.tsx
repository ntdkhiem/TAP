'use client';

import React, { useState } from 'react';
import { useSessionState, Question } from '@/utils/stateSync';
import { MathText } from '@/components/MathText';

const Background = () => <div className="mesh-bg"></div>;

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
      <>
        <Background />
        <div className="flex flex-col items-center p-8 min-h-screen relative z-10">
          <div className="glass-panel w-full max-w-4xl animate-fade-in-up">
            <h2 className="text-3xl mb-2">Tutor Dashboard Setup</h2>
            <p className="text-lg mb-8">Review the question bank and generate a class code to begin your session.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {setupQuestions.map((q, idx) => (
                <div key={q.id} className="p-6 border border-white/10 rounded-2xl bg-slate-900/40 shadow-inner">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                      {idx + 1}
                    </div>
                    <span className="font-semibold text-slate-300 uppercase tracking-widest text-sm">Question</span>
                  </div>
                  <div className="text-lg mb-6"><MathText text={q.text} /></div>
                  <div className="flex flex-col gap-3">
                    {q.options?.map((option, oIdx) => (
                      <div key={oIdx} className={`p-3 rounded-xl border flex items-center ${q.correctOption === oIdx ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/5 bg-white/5'}`}>
                        <div className="flex-1"><MathText text={option} /></div>
                        {q.correctOption === oIdx && (
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center border-t border-white/10 pt-8">
              <button className="btn btn-primary text-xl px-12 py-5" onClick={generateClassCode}>
                Generate Class Code
              </button>
            </div>
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
        <div className="flex flex-col items-center p-8 min-h-screen relative z-10">
          <div className="glass-panel w-full max-w-3xl text-center animate-fade-in-up">
            <h2 className="text-3xl">Waiting Room</h2>
            <p className="text-lg mt-2">Instruct your students to go to the Student Portal and enter this code:</p>
            
            <div className="text-7xl font-mono font-bold tracking-[0.25em] my-12 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 drop-shadow-lg">
              {session.classCode}
            </div>
            
            <div className="mt-8 p-8 bg-slate-900/40 rounded-2xl border border-white/10 text-left">
              <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                <h3 className="!mb-0 text-xl">Students Joined</h3>
                <span className="badge badge-success text-base">{session.students.length} Total</span>
              </div>

              {session.students.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-slate-500">
                  <div className="animate-pulse-glow w-12 h-12 rounded-full bg-indigo-500/20 mb-4"></div>
                  <div className="text-lg">Waiting for the first student...</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {session.students.map(s => (
                    <div key={s.id} className="bg-white/5 border border-white/10 p-4 rounded-xl flex justify-between items-center hover:bg-white/10 transition-colors">
                      <span className="font-medium text-lg flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        {s.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-12 flex gap-6 justify-center">
              <button className="btn btn-outline px-8" onClick={resetSession}>Cancel Session</button>
              <button 
                className={`btn btn-primary px-12 ${session.students.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={startTest}
                disabled={session.students.length === 0}
              >
                Start Live Session
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Phase 3: Live Dashboard
  return (
    <>
      <div className="mesh-bg"></div>
      <div className="flex flex-col min-h-screen relative z-10">
        
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 px-8 py-4 flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-4">
            <h2 className="!mb-0 text-2xl font-bold">Live Dashboard</h2>
            <span className="badge badge-success animate-pulse">Live</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="bg-white/5 px-4 py-2 rounded-lg border border-white/10 font-mono tracking-widest text-indigo-300">
              {session.classCode}
            </div>
            <button className="btn btn-outline py-2 px-4 text-sm hover:border-red-500/50 hover:text-red-400" onClick={resetSession}>
              End Session
            </button>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Main Grid: Students */}
          <div className="xl:col-span-2 flex flex-col gap-6 animate-fade-in-up">
            <h3 className="text-xl font-medium tracking-wide">Student Progress Matrix</h3>
            
            {session.students.length === 0 ? (
              <div className="glass-panel text-center text-slate-500 py-16 text-lg">No students joined the session.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {session.students.map(student => {
                  const percent = (student.currentQuestionIndex / session.questions.length) * 100;
                  return (
                    <div key={student.id} className={`glass-panel glass-panel-hover flex flex-col gap-4 ${student.isStruggling ? 'border-red-500/50 shadow-[0_8px_30px_rgba(244,63,94,0.15)]' : ''}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-semibold text-xl block mb-1">{student.name}</span>
                          <span className="text-sm text-slate-400">Score: {student.score} pts</span>
                        </div>
                        {student.isStruggling ? (
                          <span className="badge badge-danger">Struggling</span>
                        ) : (
                          <span className="badge badge-success">On Track</span>
                        )}
                      </div>
                      
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-slate-400 mb-2 uppercase tracking-wider font-semibold">
                          <span>Q {Math.min(student.currentQuestionIndex + 1, session.questions.length)}</span>
                          <span>{percent}% Complete</span>
                        </div>
                        <div className="progress-bg h-2">
                          <div className={`progress-fill h-full ${student.isStruggling ? 'bg-gradient-to-r from-red-500 to-orange-500' : ''}`} style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>

                      <div className="mt-2 flex justify-between items-center text-sm bg-black/20 rounded-lg p-3 border border-white/5">
                        <div className="flex flex-col">
                          <span className="text-slate-500 text-xs uppercase font-bold tracking-wider">Time on Q</span>
                          <span className="text-slate-200">{student.timeSpentSeconds}s</span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-slate-500 text-xs uppercase font-bold tracking-wider">Attempts</span>
                          <span className={student.incorrectAttempts > 0 ? "text-red-400 font-bold" : "text-slate-200"}>{student.incorrectAttempts} fails</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar: Insights */}
          <div className="flex flex-col gap-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-xl font-medium tracking-wide flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              AI Live Insights
            </h3>
            
            {session.students.filter(s => s.isStruggling).length === 0 ? (
              <div className="glass-panel text-center text-slate-500 py-12 flex flex-col items-center">
                <svg className="w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div className="text-lg">All clear.</div>
                <div className="text-sm mt-2">Students are progressing smoothly.</div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {session.students.filter(s => s.isStruggling).map(student => (
                  <div key={`insight-${student.id}`} className="glass-panel bg-indigo-900/20 border-indigo-500/30 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-400 to-purple-500"></div>
                    <div className="font-semibold text-indigo-300 text-lg mb-1 flex items-center gap-2">
                      Alert: {student.name}
                    </div>
                    <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                      Stuck on Question {student.currentQuestionIndex + 1} for <strong className="text-white">{student.timeSpentSeconds}s</strong> with <strong className="text-red-400">{student.incorrectAttempts} incorrect attempts</strong>.
                    </p>
                    <div className="text-sm p-4 bg-slate-950/50 rounded-xl border border-indigo-500/20">
                      <div className="flex items-center gap-2 text-indigo-400 font-bold mb-2 uppercase tracking-wider text-xs">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13h-13L12 6.5zM11 10v5h2v-5h-2zm0 7v2h2v-2h-2z"/></svg>
                        Gemini Suggestion
                      </div>
                      <div className="text-slate-200 italic leading-relaxed">
                        &quot;Consider providing a hint about the rules of integration/limits. They might be forgetting the power rule or L&apos;Hôpital&apos;s rule.&quot;
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
      </div>
    </>
  );
}
