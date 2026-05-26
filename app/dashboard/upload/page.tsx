'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Upload, FileAudio, FileText, X, CheckCircle, Loader2 } from 'lucide-react';
import AdBanner from '@/components/layout/AdBanner';

type Step = 'idle' | 'uploading' | 'transcribing' | 'generating' | 'embedding' | 'done';

const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className}
    style={props.style}
  >
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
  </svg>
);

const STEP_LABELS: Record<Step, string> = {
  idle: '',
  uploading: 'Uploading file…',
  transcribing: 'Processing file…',
  generating: 'Generating study notes…',
  embedding: 'Creating AI embeddings for chat…',
  done: 'All done!',
};

const STEP_PROGRESS: Record<Step, number> = {
  idle: 0,
  uploading: 20,
  transcribing: 45,
  generating: 70,
  embedding: 90,
  done: 100,
};

export default function UploadPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<'file' | 'youtube'>('file');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [customStepLabel, setCustomStepLabel] = useState('');
  const [segmentProgress, setSegmentProgress] = useState(0);
  const [customApiKey, setCustomApiKey] = useState('');
  const [showApiSettings, setShowApiSettings] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('user_groq_api_key');
    if (savedKey) {
      setCustomApiKey(savedKey);
    }
  }, []);

  const handleSaveApiKey = (key: string) => {
    const trimmed = key.trim();
    if (trimmed && !trimmed.startsWith('gsk_')) {
      toast.error('Invalid Groq API Key format. Must start with "gsk_"');
      return;
    }
    if (trimmed) {
      localStorage.setItem('user_groq_api_key', trimmed);
      setCustomApiKey(trimmed);
      toast.success('Custom API Key saved successfully! Unlimited note generations unlocked.');
    } else {
      localStorage.removeItem('user_groq_api_key');
      setCustomApiKey('');
      toast.success('Custom API Key cleared. Now using daily free tier.');
    }
  };

  // Split transcript helper for browser-side coordination
  const splitTranscript = (text: string, maxSegmentLength = 8000): string[] => {
    const words = text.split(/\s+/);
    const segments: string[] = [];
    let currentSegment: string[] = [];
    let currentLength = 0;

    for (const word of words) {
      if (currentLength + word.length + 1 > maxSegmentLength && currentSegment.length > 0) {
        segments.push(currentSegment.join(' '));
        currentSegment = [];
        currentLength = 0;
      }
      currentSegment.push(word);
      currentLength += word.length + 1;
    }

    if (currentSegment.length > 0) {
      segments.push(currentSegment.join(' '));
    }

    return segments;
  };

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setFile(accepted[0]);
      setTitle(accepted[0].name.replace(/\.[^/.]+$/, ''));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.webm', '.ogg'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 25 * 1024 * 1024,
    maxFiles: 1,
    disabled: step !== 'idle',
  });

  const handleProcessFile = async () => {
    if (!file) return;

    try {
      // Step 1: Upload
      setStep('uploading');
      setCustomStepLabel('');
      setSegmentProgress(0);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || file.name);

      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(uploadData.error || 'Upload failed');
      }

      const uploadId = uploadData.data.id;

      // Step 2: Transcribe (audio) or extract text (PDF)
      setStep('transcribing');
      const transcribeRes = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upload_id: uploadId }),
      });
      const transcribeData = await transcribeRes.json();
      if (!transcribeRes.ok) throw new Error(transcribeData.error || 'File processing failed');
      const transcriptContent = transcribeData.data.content;

      // Step 3: Generate notes (Client-side Segment Coordinated)
      setStep('generating');
      const segments = splitTranscript(transcriptContent, 8000);
      const segmentsData: any[] = [];

      for (let i = 0; i < segments.length; i++) {
        setCustomStepLabel(`Generating study notes (Section ${i + 1} of ${segments.length})…`);
        setSegmentProgress(Math.round(45 + (i / segments.length) * 20)); // 45% -> 65% progressive bar
        
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        const savedKey = localStorage.getItem('user_groq_api_key');
        if (savedKey) {
          headers['x-groq-api-key'] = savedKey;
        }

        const segmentRes = await fetch('/api/notes', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            action: 'generate_segment',
            segment: segments[i],
            index: i,
            total: segments.length,
          }),
        });

        if (!segmentRes.ok) {
          const errData = await segmentRes.json();
          throw new Error(errData.error || `Failed to process section ${i + 1}`);
        }

        const segmentData = await segmentRes.json();
        segmentsData.push(segmentData.data);
      }

      setCustomStepLabel('Consolidating final study notes…');
      setSegmentProgress(68);
      const notesHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      const savedKey = localStorage.getItem('user_groq_api_key');
      if (savedKey) {
        notesHeaders['x-groq-api-key'] = savedKey;
      }

      const notesRes = await fetch('/api/notes', {
        method: 'POST',
        headers: notesHeaders,
        body: JSON.stringify({
          action: 'consolidate',
          upload_id: uploadId,
          title: title || file.name,
          segments_data: segmentsData,
        }),
      });

      let notesData: any = {};
      try {
        notesData = await notesRes.json();
      } catch (jsonErr) {
        console.error('[Notes Fetch] Non-JSON response received:', jsonErr);
        throw new Error('An unexpected server error occurred during note consolidation. Please try again.');
      }

      if (!notesRes.ok) throw new Error(notesData.error || 'Note consolidation failed');

      const noteId = notesData.data.id;

      // Step 4: Embed
      setStep('embedding');
      setCustomStepLabel('');
      setSegmentProgress(0);
      await fetch('/api/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note_id: noteId }),
      });

      setStep('done');
      toast.success('Notes generated! Redirecting…');

      setTimeout(() => {
        router.push(`/dashboard/notes/${noteId}`);
      }, 1500);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
      setStep('idle');
      setCustomStepLabel('');
      setSegmentProgress(0);
    }
  };

  const handleProcessYoutube = async () => {
    if (!youtubeUrl) return;

    try {
      // Step 1 & 2: Fetch details + transcript
      setStep('transcribing');
      setCustomStepLabel('');
      setSegmentProgress(0);
      const res = await fetch('/api/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: youtubeUrl }),
      });
      
      let data: any = {};
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.error('[YouTube Fetch] Non-JSON response received:', jsonErr);
        if (res.status === 504 || res.status === 502) {
          throw new Error('This video is too long to process on our server. Please try a shorter video, or upload an audio file instead.');
        }
        throw new Error('An unexpected server error occurred. Please try again.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process YouTube video');
      }

      const { upload_id, title: fetchedTitle, transcript } = data.data;

      // Step 3: Generate notes (Client-side Segment Coordinated)
      setStep('generating');
      const segments = splitTranscript(transcript, 8000);
      const segmentsData: any[] = [];

      for (let i = 0; i < segments.length; i++) {
        setCustomStepLabel(`Generating study notes (Section ${i + 1} of ${segments.length})…`);
        setSegmentProgress(Math.round(45 + (i / segments.length) * 20)); // 45% -> 65% progressive bar
        
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        const savedKey = localStorage.getItem('user_groq_api_key');
        if (savedKey) {
          headers['x-groq-api-key'] = savedKey;
        }

        const segmentRes = await fetch('/api/notes', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            action: 'generate_segment',
            segment: segments[i],
            index: i,
            total: segments.length,
          }),
        });

        if (!segmentRes.ok) {
          const errData = await segmentRes.json();
          throw new Error(errData.error || `Failed to process section ${i + 1}`);
        }

        const segmentData = await segmentRes.json();
        segmentsData.push(segmentData.data);
      }

      setCustomStepLabel('Consolidating final study notes…');
      setSegmentProgress(68);
      const notesHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      const savedKey = localStorage.getItem('user_groq_api_key');
      if (savedKey) {
        notesHeaders['x-groq-api-key'] = savedKey;
      }

      const notesRes = await fetch('/api/notes', {
        method: 'POST',
        headers: notesHeaders,
        body: JSON.stringify({
          action: 'consolidate',
          upload_id,
          title: fetchedTitle,
          segments_data: segmentsData,
        }),
      });

      let notesData: any = {};
      try {
        notesData = await notesRes.json();
      } catch (jsonErr) {
        console.error('[Notes Fetch] Non-JSON response received:', jsonErr);
        throw new Error('An unexpected server error occurred during note consolidation. Please try again.');
      }

      if (!notesRes.ok) throw new Error(notesData.error || 'Note consolidation failed');
      const noteId = notesData.data.id;

      // Step 4: Embed
      setStep('embedding');
      setCustomStepLabel('');
      setSegmentProgress(0);
      await fetch('/api/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note_id: noteId }),
      });

      setStep('done');
      toast.success('Notes generated from YouTube! Redirecting…');

      setTimeout(() => {
        router.push(`/dashboard/notes/${noteId}`);
      }, 1500);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
      setStep('idle');
      setCustomStepLabel('');
      setSegmentProgress(0);
    }
  };

  const reset = () => {
    setFile(null);
    setTitle('');
    setYoutubeUrl('');
    setStep('idle');
    setCustomStepLabel('');
    setSegmentProgress(0);
  };

  const isProcessing = step !== 'idle' && step !== 'done';
  
  // Calculate dynamic progress mapping segment details if needed
  const progress = segmentProgress > 0 ? segmentProgress : STEP_PROGRESS[step];

  const getStepLabel = () => {
    if (customStepLabel) return customStepLabel;
    if (step === 'transcribing') {
      if (mode === 'youtube') return 'Fetching YouTube transcript…';
      if (file && file.name.endsWith('.pdf')) return 'Extracting text from PDF…';
      return 'Transcribing audio with Whisper AI…';
    }
    return STEP_LABELS[step];
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Upload & Learn</h1>
        <p className="text-muted-foreground mt-1">Provide audio, a PDF, or a YouTube video — Synap handles the rest</p>
      </div>

      {/* API Key Settings */}
      {!isProcessing && step !== 'done' && (
        <div className="mb-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md p-4 transition-all duration-300 glass-hover">
          <button
            onClick={() => setShowApiSettings(!showApiSettings)}
            className="flex items-center justify-between w-full text-left font-medium text-sm text-foreground/80 hover:text-foreground cursor-pointer active-press"
          >
            <div className="flex items-center gap-2">
              <span className="text-base animate-pulse-soft">🔑</span>
              <span>
                {customApiKey
                  ? 'Custom API Key Active (Unlimited Generation)'
                  : 'Daily Free Tier (Limit: 2 notes/day)'}
              </span>
            </div>
            <span className="text-xs text-primary hover:underline transition-colors font-medium">
              {showApiSettings ? 'Hide Settings' : 'Manage Key'}
            </span>
          </button>

          {showApiSettings && (
            <div className="mt-4 pt-4 border-t border-border space-y-3 animate-scale-in">
              <p className="text-xs text-muted-foreground leading-relaxed">
                By default, the shared key allows up to 2 premium note generations per day. To unlock unlimited generation, paste your own free Groq API key below. Keys are stored locally in your browser and are never saved on our servers.
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  placeholder="Paste your Groq API Key (starts with gsk_)"
                  className="flex-1 px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-xs focus-ring-glow transition-all text-foreground"
                />
                <button
                  onClick={() => handleSaveApiKey(customApiKey)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer active-press hover:shadow-md hover:shadow-primary/10 transition-all"
                  style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
                >
                  Save
                </button>
                {typeof window !== 'undefined' && localStorage.getItem('user_groq_api_key') && (
                  <button
                    onClick={() => handleSaveApiKey('')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted active-press cursor-pointer transition-all border border-border"
                  >
                    Clear
                  </button>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Get a free API Key in 30 seconds at{' '}
                <a
                  href="https://console.groq.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline transition-colors"
                >
                  console.groq.com
                </a>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Mode Tab Switcher */}
      {!isProcessing && step !== 'done' && (
        <div className="flex gap-2 p-1 bg-muted rounded-xl mb-6 max-w-sm border border-border/40 animate-slide-up">
          <button
            onClick={() => setMode('file')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all active-press cursor-pointer ${
              mode === 'file'
                ? 'bg-background text-foreground shadow-sm scale-[1.02]'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            📁 Upload File
          </button>
          <button
            onClick={() => setMode('youtube')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all active-press cursor-pointer ${
              mode === 'youtube'
                ? 'bg-background text-foreground shadow-sm scale-[1.02]'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            🎥 YouTube Link
          </button>
        </div>
      )}

      {/* File Upload Mode */}
      {mode === 'file' && (
        <div className="space-y-4 animate-scale-in">
          <div
            {...getRootProps()}
            className={`relative rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-300 ${
              isDragActive
                ? 'border-primary bg-primary/5 scale-[1.01] shadow-lg shadow-primary/10'
                : file
                ? 'border-success bg-success/5 shadow-lg shadow-success/5'
                : 'border-border hover:border-primary hover:bg-muted/30 hover:scale-[1.002]'
            } ${isProcessing ? 'pointer-events-none opacity-60' : ''}`}
          >
            <input {...getInputProps()} />

            {file ? (
              <div className="flex flex-col items-center gap-3 animate-scale-in">
                {file.type.startsWith('audio') ? (
                  <FileAudio className="w-12 h-12 animate-pulse-soft" style={{ color: 'hsl(var(--success))' }} />
                ) : (
                  <FileText className="w-12 h-12 animate-pulse-soft" style={{ color: 'hsl(var(--success))' }} />
                )}
                <div>
                  <p className="font-semibold text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.split('/')[1].toUpperCase()}
                  </p>
                </div>
                {!isProcessing && (
                  <button onClick={(e) => { e.stopPropagation(); reset(); }}
                    className="text-muted-foreground hover:text-foreground transition-colors active-press p-1 rounded-lg hover:bg-muted cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-500 hover:rotate-12 hover:scale-110"
                  style={{ background: 'hsl(255 85% 68% / 0.1)' }}>
                  <Upload className="w-8 h-8" style={{ color: 'hsl(var(--primary))' }} />
                </div>
                <div>
                  <p className="font-semibold text-lg">
                    {isDragActive ? 'Drop it here!' : 'Drop your file here'}
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Supports MP3, WAV, M4A, WebM, OGG (max 25MB) or PDF (max 10MB)
                  </p>
                </div>
                <span className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted active-press hover:scale-105 transition-all">
                  Browse Files
                </span>
              </div>
            )}
          </div>

          {/* Title input */}
          {file && !isProcessing && step !== 'done' && (
            <div className="animate-slide-up">
              <label htmlFor="note-title" className="block text-sm font-medium mb-1.5">Note Title</label>
              <input
                id="note-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Biology Lecture — Cell Division"
                className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border focus-ring-glow transition-all"
              />
            </div>
          )}

          {/* Process File Button */}
          {file && step === 'idle' && (
            <button
              id="process-upload"
              onClick={handleProcessFile}
              className="w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200 glow-on-hover active-press cursor-pointer hover:shadow-lg hover:shadow-primary/20"
              style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
            >
              ⚡ Process & Generate Notes
            </button>
          )}
        </div>
      )}

      {/* YouTube Import Mode */}
      {mode === 'youtube' && (
        <div className="space-y-4 animate-scale-in">
          <div className="glass rounded-2xl p-8 border border-border space-y-4 glass-hover">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center transition-transform hover:scale-110 duration-300">
                <YoutubeIcon className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Import YouTube Video</h3>
                <p className="text-xs text-muted-foreground">Import automatically using subtitles/transcripts</p>
              </div>
            </div>

            <div>
              <label htmlFor="youtube-url" className="block text-sm font-medium mb-1.5">YouTube Video URL</label>
              <input
                id="youtube-url"
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus-ring-glow transition-all"
                disabled={isProcessing}
              />
            </div>
          </div>

          {/* Process YouTube Button */}
          {youtubeUrl && step === 'idle' && (
            <button
              id="process-youtube"
              onClick={handleProcessYoutube}
              className="w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200 glow-on-hover active-press cursor-pointer hover:shadow-lg hover:shadow-primary/20"
              style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
            >
              ⚡ Fetch & Generate Notes
            </button>
          )}
        </div>
      )}

      {/* Progress */}
      {isProcessing && (
        <div className="mt-6 glass rounded-2xl p-6 border border-border animate-scale-in">
          <div className="flex items-center gap-3 mb-4">
            <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />
            <p className="font-medium text-foreground">{getStepLabel()}</p>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{progress}% complete</p>

          {/* Loading Screen Sponsor/Ad placement */}
          <div className="mt-6 pt-6 border-t border-border/60">
            <AdBanner type="loading" />
          </div>
        </div>
      )}

      {/* Done state */}
      {step === 'done' && (
        <div className="mt-6 glass rounded-2xl p-6 border border-border animate-scale-in text-center shadow-lg shadow-success/10">
          <CheckCircle className="w-10 h-10 mx-auto mb-2 animate-scale-in" style={{ color: 'hsl(var(--success))', animationDelay: '100ms' }} />
          <p className="font-semibold text-success">Notes created successfully!</p>
          <p className="text-sm text-muted-foreground">Redirecting to your notes…</p>
        </div>
      )}
    </div>
  );
}
