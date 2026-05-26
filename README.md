# Synap ⚡

> A free, open-source AI study assistant. Upload lecture audio or PDFs → get transcriptions, study notes, flashcards, quizzes, and an AI tutor powered by RAG.

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Supabase](https://img.shields.io/badge/Supabase-free-green) ![Groq](https://img.shields.io/badge/Groq-free-orange)

---

## ✨ Features

| Feature | Status |
|---|---|
| 🎙️ Audio Upload & Transcription (Whisper) | ✅ |
| 📝 AI Study Notes (markdown, headings, bullets) | ✅ |
| 🃏 Flashcards with 3D flip animation | ✅ |
| 📊 MCQ + Short Answer Quizzes | ✅ |
| 🤖 AI Chat with RAG (answers from your notes) | ✅ |
| 📄 PDF Upload | ✅ |
| 🔒 Authentication (email + Google OAuth) | ✅ |
| 📱 Mobile Responsive | ✅ |
| 🌙 Dark Mode | ✅ |
| 📦 Vector embeddings for semantic search | ✅ |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account (free)
- Groq account (free) 
- HuggingFace account (free)

### 1. Clone & Install

```bash
cd turbolearn  # (the project folder name stays the same)
npm install
cp .env.local.example .env.local
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the entire contents of `supabase/schema.sql`
3. Go to **Storage** → create a bucket named `uploads` (set to **private**)
4. Add these storage policies in the SQL editor:
```sql
CREATE POLICY "Users upload own files" ON storage.objects FOR INSERT
  WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users view own files" ON storage.objects FOR SELECT
  USING (auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own files" ON storage.objects FOR DELETE
  USING (auth.uid()::text = (storage.foldername(name))[1]);
```
5. Copy your **Project URL**, **anon key**, and **service_role key** from Settings → API

### 3. Set up Groq (free)

1. Sign up at [console.groq.com](https://console.groq.com) (free). Copy your API key.

### 4. Set up HuggingFace (free)

1. Sign up at [huggingface.co](https://huggingface.co)
2. Go to Settings → Access Tokens → New token (read permissions)
3. Used for `sentence-transformers/all-MiniLM-L6-v2` embeddings

### 5. Configure Environment

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GROQ_API_KEY=gsk_your-groq-key
HUGGINGFACE_API_KEY=hf_your-hf-token
```

### 6. Enable Google OAuth (optional)

1. In Supabase: Authentication → Providers → Google → Enable
2. Add your Google OAuth credentials
3. Set redirect URL: `https://your-project.supabase.co/auth/v1/callback`

### 7. Run

```bash
npm run dev
# Open http://localhost:3000
```

---

## 🏗️ Architecture

```
Audio/PDF Upload
      │
      ▼
Supabase Storage
      │
      ▼
Groq Whisper API ──► Transcript
      │
      ▼
Groq LLaMA 3.3 70B ──► Study Notes (markdown)
      │
      ├──► Flashcards (JSON Q&A pairs)
      │
      ├──► Quiz (MCQ + Short Answer)
      │
      └──► Chunker + HuggingFace Embeddings
                 │
                 ▼
           Supabase pgvector
                 │
                 ▼
           RAG Chat Pipeline
                 │
                 ▼
           Groq LLaMA (streaming)
```

### RAG Pipeline Details

- **Chunking**: ~400 words per chunk, 64-word overlap (sentence-aware)
- **Embeddings**: `sentence-transformers/all-MiniLM-L6-v2` → 384 dimensions
- **Retrieval**: Top-5 cosine similarity via Supabase `pgvector`
- **Hallucination reduction**: Strict system prompt, low temperature (0.3), source citations

---

## 📁 Project Structure

```
synap/
├── app/
│   ├── api/
│   │   ├── upload/         # File upload to Supabase Storage
│   │   ├── transcribe/     # Groq Whisper transcription
│   │   ├── notes/          # AI note generation + CRUD
│   │   ├── flashcards/     # Flashcard generation + CRUD
│   │   ├── quiz/           # Quiz generation + CRUD
│   │   ├── chat/           # Streaming RAG chat
│   │   └── embed/          # Chunking + embedding pipeline
│   ├── dashboard/          # Protected app pages
│   ├── login/              # Auth pages
│   └── register/
├── components/
│   ├── layout/             # Sidebar, Header
│   └── notes/              # Note display components
├── lib/
│   ├── ai/                 # LLM, Whisper, RAG, Chunker, Embed
│   └── supabase/           # Client/server Supabase clients
├── types/                  # TypeScript interfaces
└── supabase/
    └── schema.sql          # Full database schema
```

---

## 🚢 Deploy to Vercel

```bash
npx vercel --prod
```

Add all environment variables in the Vercel dashboard under **Settings → Environment Variables**.

> **Note**: The Groq API handles AI processing in the cloud, so no GPU needed on Vercel.

---

## 💰 Cost Breakdown (Free Tier)

| Service | Free Limit |
|---|---|
| Vercel | 100GB bandwidth, unlimited deployments |
| Supabase | 500MB DB, 1GB storage, 2GB bandwidth |
| Groq | 14,400 req/day (Whisper + LLaMA) |
| HuggingFace | 1,000 req/month free inference |

**Total monthly cost: $0** for typical student usage.

---

## 🗺️ Roadmap

- [ ] PDF text extraction (pdf-parse)
- [ ] Spaced repetition (SM-2 algorithm)  
- [ ] Export notes as PDF
- [ ] Share notes with classmates
- [ ] Mobile app (Capacitor)
- [ ] Browser extension for YouTube lectures

---

## 📝 License

MIT — free to use, modify, and deploy.
