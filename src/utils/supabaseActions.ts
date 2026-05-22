import { supabase } from './supabaseClient';
import { Question } from './stateSync';

export async function createSessionRecord(classCode: string, questions: Question[]) {
  const { data: sessionData, error: sessionErr } = await supabase
    .from('sessions')
    .insert({ class_code: classCode })
    .select()
    .single();

  if (sessionErr || !sessionData) {
    console.error('Failed to create session', sessionErr);
    return null;
  }

  const qInserts = questions.map((q, idx) => ({
    session_id: sessionData.id,
    text: q.text,
    options: q.options,
    correct_option_index: q.correctOption,
    order_index: idx
  }));

  await supabase.from('questions').insert(qInserts);
  return sessionData.id;
}

export async function startSessionRecord(sessionId: string) {
  await supabase.from('sessions').update({ status: 'started' }).eq('id', sessionId);
}

export async function joinSessionRecord(sessionId: string, studentName: string) {
  const { data, error } = await supabase
    .from('students')
    .insert({ session_id: sessionId, name: studentName })
    .select()
    .single();
    
  if (error) console.error('Failed to join session', error);
  return data?.id;
}

export async function submitAnswerRecord(studentId: string, questionId: string, isCorrect: boolean, newScore: number, nextQuestionIndex: number) {
  // Update student score and current question
  await supabase.from('students').update({
    score: newScore,
    current_question_index: nextQuestionIndex,
    is_struggling: false
  }).eq('id', studentId);
  
  // Clear or reset progress for this new question is handled by the UI timer implicitly,
  // but let's record the final progress of the answered question if we wanted to.
}

export async function markStrugglingRecord(studentId: string) {
  await supabase.from('students').update({ is_struggling: true }).eq('id', studentId);
}

export async function syncTimerRecord(studentId: string, questionId: string, timeSpent: number, incorrectAttempts: number) {
  // Upsert progress
  await supabase.from('student_progress').upsert({
    student_id: studentId,
    question_id: questionId,
    time_spent_seconds: timeSpent,
    incorrect_attempts: incorrectAttempts,
    updated_at: new Date().toISOString()
  }, { onConflict: 'student_id, question_id' });
}
