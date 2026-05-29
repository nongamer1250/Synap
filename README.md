# Synap™ ⚡

> Synap is a modern, gamified **Exam Preparation & Semester Workspace Platform**. Instantly turn textbooks, slides, PDF files, lecture audio, or YouTube links into structured study notes, active spaced-repetition flashcards, interactive quizzes, and custom predicted mock exam sheets. Fully optimized for responsive browsers and native Android/iOS mobile devices.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Supabase](https://img.shields.io/badge/Supabase-free-green) ![Groq](https://img.shields.io/badge/Groq-free-orange) ![Capacitor](https://img.shields.io/badge/Capacitor-Mobile-purple)

---

## ✨ Features

### 🎓 Semester Workspace & Moats
* **Collapsible Folders:** Group study materials, quizzes, and flashcards dynamically by their university subject or curriculum syllabus course name.
* **Mastery Dashboard:** View subject-by-subject completion bars, weekly study hour metrics, and active recall stats on a single dashboard screen.
* **Exam Readiness Score:** An algorithmic radial progress tracker that estimates your readiness percentage based on quiz grades, spaced recall consistency, and completed topics.

### 🧠 Advanced AI Exam Prep Engine
* **AI Exam Predictor:** Map your curriculum topics and call high-yield Llama models to forecast the top 10 most likely exam questions, complete with academic model answer keys.
* **Cognitive Recall Calendar:** A visual interval check-off checklist based on 1-3-7-14 day spaced repetition recall triggers to maximize neural retention.
* **Hyper-Condensed Cheat Sheets:** Draft single-page revision lists summarizing the top 20 facts, formulas, rules, and glossary terms.
* **Practice Paper Generator:** Instantly generate complete end-of-semester mock papers in standard university formatting, printable with toggleable answer sheets.

### 📷 Textbook Camera OCR & Audio transcription
* **Camera Scan:** Capture photos of textbook pages, whiteboard sketches, or notebook pages directly inside the app to trigger OCR visual transcription.
* **Audio Transcription:** Record lectures or import MP3/WAV files for transcription without serverless loading timeouts using client-side segmentation.
* **YouTube to Notes:** Paste public video links to fetch subtitle transcripts and convert video tutorials into active study sets.

### 📱 Premium Native Mobile Features (Capacitor)
* **Bottom Navigation:** Elegant responsive glassmorphic tab bars tailored for phones.
* **OAuth Deep Linking:** Direct Google OAuth callback redirects (`bond.synap.app://auth/callback`) back into the native app.
* **IndexedDB Cache:** Offline support to flip flashcards and study notes on the go.
* **Pull-to-Refresh Gestures:** Smooth circular pull indicators with smart scroll-top protection.
* **Local Reminders:** Automated Android daily notifications scheduled at 6:00 PM to keep study streaks alive.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or 20+
- Supabase Account (Free)
- Groq Console API Key (Free)
- Hugging Face Account Access Token (Free)

### 1. Installation

```bash
git clone https://github.com/nongamer1250/Synap.git
cd Synap/turbolearn
npm install
cp .env.local.example .env.local
```

### 2. Configure Environment variables

Update `.env.local` with your platform credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GROQ_API_KEY=gsk_your-groq-key
HUGGINGFACE_API_KEY=hf_your-hf-token
```

### 3. Database Schema Setup

1. Open your **Supabase Dashboard → SQL Editor**.
2. Copy and run the entire contents of `supabase/schema.sql`.
3. In **Storage**, create a private bucket named `uploads`.
4. Apply these private storage security policies:

```sql
CREATE POLICY "Users upload own files" ON storage.objects FOR INSERT
  WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users view own files" ON storage.objects FOR SELECT
  USING (auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own files" ON storage.objects FOR DELETE
  USING (auth.uid()::text = (storage.foldername(name))[1]);
```

### 4. Running Locally

```bash
npm run dev
# Open http://localhost:3000
```

---

## 🏗️ Architecture

```
Materials (Audio, PDF, Camera Photos, YouTube Links)
      │
      ▼
Supabase Private Storage
      │
      ▼
Groq Whisper / Llama Vision OCR ──► Text Extraction
      │
      ▼
Parallel Chunking & Chunker ──► HuggingFace sentence-transformers
      │
      ├──► Supabase pgvector (Embedding Retrieval)
      │
      ├──► AI Study Guide Compilers
      │
      └──► Exam Prep Workspace (Forecasts, Cheat Sheets, Calendar)
```

---

## 📱 Mobile App Compilation (Capacitor)

Compile local release debug binaries for Android:

```bash
# Compile and build Next.js static files
npm run build

# Copy assets to Cap Android folders
npx cap sync

# Launch Android Studio to assemble or run APK
npx cap open android
```

Ensure `bond.synap.app://auth/callback` is registered under approved redirect URLs in your Supabase Auth settings to enable native deep-linking auth flows.

---

## 🚢 Deploy to Vercel

Deploys seamlessly inside edge serverless runtimes:

```bash
npx vercel --prod
```

Configure all environment variables inside your Vercel Dashboard under **Settings → Environment Variables**.

---

## 📝 License

MIT — Free to use, modify, study, and deploy.
