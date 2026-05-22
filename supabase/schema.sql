-- Schema for TAP (Tutor Assistant Project)

-- Enable pgcrypto for UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table: sessions
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_code VARCHAR(6) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'waiting', -- 'waiting', 'started', 'ended'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: questions
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    options JSONB,
    correct_option_index INTEGER,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: students
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    current_question_index INTEGER NOT NULL DEFAULT 0,
    is_struggling BOOLEAN NOT NULL DEFAULT false,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: student_progress
CREATE TABLE IF NOT EXISTS public.student_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    incorrect_attempts INTEGER NOT NULL DEFAULT 0,
    skipped BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(student_id, question_id)
);

-- Realtime Setup
-- Enable replica identity on tables so we get full row data on updates
ALTER TABLE public.students REPLICA IDENTITY FULL;
ALTER TABLE public.student_progress REPLICA IDENTITY FULL;
ALTER TABLE public.sessions REPLICA IDENTITY FULL;

-- Add tables to the publication for Realtime subscriptions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_progress;

-- RLS (Row Level Security) - For prototype, we allow anon access
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read access" ON public.sessions FOR SELECT USING (true);
CREATE POLICY "Allow anon insert access" ON public.sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update access" ON public.sessions FOR UPDATE USING (true);

CREATE POLICY "Allow anon read access" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Allow anon insert access" ON public.questions FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon read access" ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow anon insert access" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update access" ON public.students FOR UPDATE USING (true);

CREATE POLICY "Allow anon read access" ON public.student_progress FOR SELECT USING (true);
CREATE POLICY "Allow anon insert access" ON public.student_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update access" ON public.student_progress FOR UPDATE USING (true);
