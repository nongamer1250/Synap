-- ============================================================
-- Synap — Supabase Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Profiles ─────────────────────────────────────────────────
-- Extends Supabase auth.users with additional profile data
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Uploads ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('audio', 'pdf')),
  file_url TEXT NOT NULL,
  file_size INTEGER,
  duration_seconds INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','done','error')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Transcripts ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Notes ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID REFERENCES uploads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  key_concepts JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Flashcards ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  -- Spaced Repetition System (SRS) fields — ready for SM-2 algorithm
  due_date TIMESTAMPTZ,
  ease_factor FLOAT DEFAULT 2.5,
  interval_days INTEGER DEFAULT 1,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Quizzes ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Quiz Attempts ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER,
  answers JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Chat Sessions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  note_id UUID REFERENCES notes(id) ON DELETE SET NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Chat Messages ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  sources JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Document Chunks (for RAG) ─────────────────────────────────
-- Stores chunked text + vector embeddings for semantic search
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  upload_id UUID REFERENCES uploads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  -- 384 dimensions for sentence-transformers/all-MiniLM-L6-v2
  embedding vector(384),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector similarity search index (HNSW index for high performance approximate nearest neighbor search)
CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw_idx
  ON document_chunks USING hnsw (embedding vector_cosine_ops);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users manage own uploads" ON uploads FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own transcripts" ON transcripts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own notes" ON notes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own flashcards" ON flashcards FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own quizzes" ON quizzes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own quiz attempts" ON quiz_attempts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own chat sessions" ON chat_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own chat messages" ON chat_messages
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM chat_sessions WHERE id = session_id)
  );
CREATE POLICY "Users manage own chunks" ON document_chunks FOR ALL USING (auth.uid() = user_id);

-- ── Vector Search Function ────────────────────────────────────
-- Used by the RAG pipeline to find similar document chunks
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(384),
  match_count INT DEFAULT 5,
  filter_user_id UUID DEFAULT NULL,
  filter_note_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  note_id UUID,
  upload_id UUID,
  user_id UUID,
  content TEXT,
  chunk_index INT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.note_id,
    dc.upload_id,
    dc.user_id,
    dc.content,
    dc.chunk_index,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE
    (filter_user_id IS NULL OR dc.user_id = filter_user_id)
    AND (filter_note_id IS NULL OR dc.note_id = filter_note_id)
    AND dc.embedding IS NOT NULL
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ── Supabase Storage Bucket ───────────────────────────────────
-- Run this manually in the Supabase Dashboard → Storage
-- Or via the API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', false);

-- Storage policies (run after creating the bucket):
-- CREATE POLICY "Users upload own files" ON storage.objects FOR INSERT
--   WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users view own files" ON storage.objects FOR SELECT
--   USING (auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users delete own files" ON storage.objects FOR DELETE
--   USING (auth.uid()::text = (storage.foldername(name))[1]);

-- ── Syllabus & Exam Prep ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.syllabi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  exam_date TIMESTAMPTZ,
  file_url TEXT,
  file_type TEXT CHECK (file_type IN ('pdf', 'image')) NOT NULL,
  raw_text TEXT,
  topic_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.syllabus_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  syllabus_id UUID NOT NULL REFERENCES public.syllabi(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',
  note_id UUID REFERENCES public.notes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sample_papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  syllabus_id UUID NOT NULL REFERENCES public.syllabi(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  format_description TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.syllabi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sample_papers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage own syllabi" ON public.syllabi FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own syllabus topics" ON public.syllabus_topics FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own sample papers" ON public.sample_papers FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Performance Indexes for Scaling to 10k+ Users
-- ============================================================

-- Uploads & Transcripts
CREATE INDEX IF NOT EXISTS uploads_user_id_idx ON public.uploads(user_id);
CREATE INDEX IF NOT EXISTS transcripts_upload_id_idx ON public.transcripts(upload_id);
CREATE INDEX IF NOT EXISTS transcripts_user_id_idx ON public.transcripts(user_id);

-- Notes & Flashcards
CREATE INDEX IF NOT EXISTS notes_upload_id_idx ON public.notes(upload_id);
CREATE INDEX IF NOT EXISTS notes_user_id_idx ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS flashcards_note_id_idx ON public.flashcards(note_id);
CREATE INDEX IF NOT EXISTS flashcards_user_id_idx ON public.flashcards(user_id);
CREATE INDEX IF NOT EXISTS flashcards_due_date_idx ON public.flashcards(due_date);

-- Quizzes & Attempts
CREATE INDEX IF NOT EXISTS quizzes_note_id_idx ON public.quizzes(note_id);
CREATE INDEX IF NOT EXISTS quizzes_user_id_idx ON public.quizzes(user_id);
CREATE INDEX IF NOT EXISTS quiz_attempts_quiz_id_idx ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS quiz_attempts_user_id_idx ON public.quiz_attempts(user_id);

-- Syllabus & Practice Exams
CREATE INDEX IF NOT EXISTS syllabus_topics_syllabus_id_idx ON public.syllabus_topics(syllabus_id);
CREATE INDEX IF NOT EXISTS syllabus_topics_user_id_idx ON public.syllabus_topics(user_id);
CREATE INDEX IF NOT EXISTS sample_papers_syllabus_id_idx ON public.sample_papers(syllabus_id);
CREATE INDEX IF NOT EXISTS sample_papers_user_id_idx ON public.sample_papers(user_id);


