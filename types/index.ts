// ============================================================
// Synap — Shared TypeScript Types
// ============================================================

export type UploadStatus = 'pending' | 'processing' | 'done' | 'error';
export type FileType = 'audio' | 'pdf' | 'youtube';
export type MessageRole = 'user' | 'assistant';
export type Difficulty = 'easy' | 'medium' | 'hard';

// ── Profile ──────────────────────────────────────────────────
export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

// ── Upload ────────────────────────────────────────────────────
export interface Upload {
  id: string;
  user_id: string;
  title: string;
  file_type: FileType;
  file_url: string;
  file_size: number | null;
  duration_seconds: number | null;
  status: UploadStatus;
  created_at: string;
}

// ── Transcript ────────────────────────────────────────────────
export interface Transcript {
  id: string;
  upload_id: string;
  user_id: string;
  content: string;
  language: string;
  created_at: string;
}

// ── Note ─────────────────────────────────────────────────────
export interface Note {
  id: string;
  upload_id: string | null;
  user_id: string;
  title: string;
  content: string; // markdown
  summary: string | null;
  key_concepts: string[] | null;
  created_at: string;
  updated_at: string;
}

// ── Flashcard ─────────────────────────────────────────────────
export interface Flashcard {
  id: string;
  note_id: string | null;
  user_id: string;
  question: string;
  answer: string;
  difficulty: Difficulty;
  due_date: string | null;
  ease_factor: number;
  interval_days: number;
  review_count: number;
  created_at: string;
}

// ── Quiz ──────────────────────────────────────────────────────
export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'short_answer';
  question: string;
  options?: string[];        // MCQ only
  correct_answer: string;
  explanation?: string;
}

export interface Quiz {
  id: string;
  note_id: string | null;
  user_id: string;
  title: string;
  questions: QuizQuestion[];
  difficulty: Difficulty;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number | null;
  answers: Record<string, string>;
  completed_at: string;
}

// ── Chat ──────────────────────────────────────────────────────
export interface ChatSession {
  id: string;
  user_id: string;
  note_id: string | null;
  title: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: MessageRole;
  content: string;
  sources?: ChunkSource[];
  created_at: string;
}

// ── RAG ──────────────────────────────────────────────────────
export interface DocumentChunk {
  id: string;
  note_id: string | null;
  upload_id: string | null;
  user_id: string;
  content: string;
  chunk_index: number;
  embedding?: number[];
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface ChunkSource {
  chunk_id: string;
  content: string;
  similarity: number;
}

// ── API Response Helpers ──────────────────────────────────────
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface GenerateNotesRequest {
  upload_id: string;
  transcript: string;
}

export interface GenerateFlashcardsRequest {
  note_id: string;
  count?: number;
}

export interface GenerateQuizRequest {
  note_id: string;
  difficulty?: Difficulty;
  count?: number;
}

export interface ChatRequest {
  session_id: string;
  message: string;
  note_id?: string;
}

// ── Syllabus & Exam Prep ──────────────────────────────────────
export type SyllabusFileType = 'pdf' | 'image';
export type TopicStatus = 'not_started' | 'in_progress' | 'completed';

export interface Syllabus {
  id: string;
  user_id: string;
  title: string;
  exam_date: string | null;
  file_url: string | null;
  file_type: SyllabusFileType;
  raw_text: string | null;
  topic_count: number;
  created_at: string;
  syllabus_topics?: { id: string; status: TopicStatus }[];
}

export interface SyllabusTopic {
  id: string;
  syllabus_id: string;
  user_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  status: TopicStatus;
  note_id: string | null;
  created_at: string;
}

export interface SamplePaperQuestion {
  id: string;
  question: string;
  answer_key: string;
  marks?: number;
  section?: string;
}

export interface SamplePaper {
  id: string;
  syllabus_id: string;
  user_id: string;
  title: string;
  format_description: string;
  content: SamplePaperQuestion[];
  created_at: string;
}

