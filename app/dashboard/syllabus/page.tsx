'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  GraduationCap,
  Trash2,
  Calendar,
  ChevronRight,
  Clock,
  Plus,
  Loader2,
  X,
  BookOpen
} from 'lucide-react';
import type { Syllabus } from '@/types';

type UploadStep = 'idle' | 'uploading' | 'extracting' | 'done';

export default function SyllabusListPage() {
  const router = useRouter();
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Upload states
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [examDate, setExamDate] = useState('');
  const [uploadStep, setUploadStep] = useState<UploadStep>('idle');
  const [customApiKey, setCustomApiKey] = useState('');

  // Fetch syllabi list
  const fetchSyllabi = async () => {
    try {
      const res = await fetch('/api/syllabus');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch syllabi');
      setSyllabi(json.data || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Could not load your study plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSyllabi();
    // Retrieve custom API key if present
    const savedKey = localStorage.getItem('user_groq_api_key');
    if (savedKey) {
      setCustomApiKey(savedKey);
    }
  }, []);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setFile(accepted[0]);
      setTitle(accepted[0].name.replace(/\.[^/.]+$/, ''));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 1,
    disabled: uploadStep !== 'idle',
  });

  const handleUploadSyllabus = async () => {
    if (!file) return;

    try {
      setUploadStep('uploading');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || file.name);
      if (examDate) {
        formData.append('exam_date', new Date(examDate).toISOString());
      }

      const headers: Record<string, string> = {};
      const savedKey = localStorage.getItem('user_groq_api_key');
      if (savedKey) {
        headers['x-groq-api-key'] = savedKey;
      }

      // Step 1 & 2: Upload and process on backend
      setUploadStep('extracting');
      const res = await fetch('/api/syllabus', {
        method: 'POST',
        headers,
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to process syllabus');
      }

      setUploadStep('done');
      toast.success('Syllabus processed! Redirecting to study plan…');

      setTimeout(() => {
        router.push(`/dashboard/syllabus/${json.data.id}`);
      }, 1000);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Something went wrong processing your syllabus');
      setUploadStep('idle');
    }
  };

  const handleDeleteSyllabus = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm('Are you sure you want to delete this syllabus and all its topics?')) return;

    try {
      const res = await fetch(`/api/syllabus/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to delete syllabus');
      toast.success('Syllabus deleted');
      setSyllabi((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to delete syllabus');
    }
  };

  const resetUpload = () => {
    setFile(null);
    setTitle('');
    setExamDate('');
    setUploadStep('idle');
    setShowUpload(false);
  };

  // Helper to format countdown
  const getExamCountdown = (examDateStr: string | null) => {
    if (!examDateStr) return null;
    const examDate = new Date(examDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Exam passed';
    if (diffDays === 0) return 'Exam is today! 🚨';
    if (diffDays === 1) return 'Exam is tomorrow! ⏳';
    return `${diffDays} days left`;
  };

  const getStepLabel = () => {
    if (uploadStep === 'uploading') return 'Uploading file…';
    if (uploadStep === 'extracting') return 'AI extracting topics & chapters…';
    if (uploadStep === 'done') return 'Syllabus analyzed!';
    return '';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Syllabus & Exam Prep</h1>
          <p className="text-muted-foreground mt-1">Upload your curriculum PDF or photo to build structured AI study plans.</p>
        </div>
        {!showUpload && (
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white cursor-pointer active-press hover:shadow-lg transition-all duration-300"
            style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
          >
            <Plus className="w-5 h-5" />
            <span>Upload Syllabus</span>
          </button>
        )}
      </div>

      {/* Upload Panel */}
      {showUpload && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl animate-scale-in space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">New Exam Prep Plan</h3>
            <button onClick={resetUpload} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div
            {...getRootProps()}
            className={`relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-300 ${
              isDragActive
                ? 'border-primary bg-primary/5 scale-[1.01]'
                : file
                ? 'border-success bg-success/5'
                : 'border-border hover:border-primary hover:bg-muted/30'
            } ${uploadStep !== 'idle' ? 'pointer-events-none opacity-60' : ''}`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="flex flex-col items-center gap-3 animate-scale-in">
                {file.type.startsWith('image/') ? (
                  <ImageIcon className="w-12 h-12 text-success animate-pulse-soft" />
                ) : (
                  <FileText className="w-12 h-12 text-success animate-pulse-soft" />
                )}
                <div>
                  <p className="font-semibold text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.split('/')[1].toUpperCase()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-semibold text-base">Drop your syllabus file here</p>
                  <p className="text-muted-foreground text-sm mt-1">Supports PDF or images (PNG, JPEG, WebP) up to 10MB</p>
                </div>
              </div>
            )}
          </div>

          {file && uploadStep === 'idle' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-up">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Exam Plan Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Chemistry Midterm, CSE 101"
                  className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border focus-ring-glow transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Exam Date (Optional)</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border focus-ring-glow transition-all text-sm"
                />
              </div>
            </div>
          )}

          {file && uploadStep === 'idle' && (
            <button
              onClick={handleUploadSyllabus}
              className="w-full py-3.5 rounded-xl font-bold text-white transition-all duration-200 active-press cursor-pointer hover:shadow-lg hover:shadow-primary/25"
              style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
            >
              ⚡ Extract & Generate Study Plan
            </button>
          )}

          {uploadStep !== 'idle' && (
            <div className="glass rounded-xl p-5 border border-border flex items-center gap-4 animate-scale-in">
              <Loader2 className="w-6 h-6 animate-spin text-primary shrink-0" />
              <div>
                <p className="font-semibold text-sm">{getStepLabel()}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Please wait, this takes a few seconds.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Syllabi List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm font-medium">Loading your study plans…</p>
        </div>
      ) : syllabi.length === 0 ? (
        <div className="glass border border-border/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4 animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center text-primary">
            <BookOpen className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-lg font-bold">No exam study plans yet</h3>
            <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
              Upload your syllabus to let Synap structure the topics, set countdown timers, and generate study materials.
            </p>
          </div>
          {!showUpload && (
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white cursor-pointer active-press hover:shadow-md transition-all"
              style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
            >
              <Plus className="w-4 h-4" />
              <span>Create First Plan</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {syllabi.map((syllabus) => {
            const countdown = getExamCountdown(syllabus.exam_date);
            const completedCount = syllabus.syllabus_topics?.filter((t) => t.status === 'completed').length || 0;
            const progressPercent = syllabus.topic_count > 0 ? Math.round((completedCount / syllabus.topic_count) * 100) : 0;
            return (
              <div
                key={syllabus.id}
                onClick={() => router.push(`/dashboard/syllabus/${syllabus.id}`)}
                className="group relative rounded-2xl border border-border bg-card hover:bg-muted/10 p-6 shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.01] cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 transition-transform group-hover:scale-110">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">{syllabus.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{syllabus.topic_count} topics syllabus</p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDeleteSyllabus(syllabus.id, e)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 cursor-pointer transition-all active-press"
                      title="Delete Syllabus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Progress indicator */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-xs text-muted-foreground font-medium">
                      <span>Topics Studied</span>
                      <span>{completedCount} / {syllabus.topic_count} ({progressPercent}%)</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progressPercent}%`,
                          background: 'linear-gradient(90deg, hsl(255 85% 68%), hsl(280 70% 65%))'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border/40 pt-4 mt-5 text-xs">
                  {countdown ? (
                    <span className={`flex items-center gap-1 font-semibold ${countdown.includes('Passed') || countdown.includes('passed') ? 'text-muted-foreground' : 'text-primary'}`}>
                      <Clock className="w-3.5 h-3.5" />
                      {countdown}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      No date set
                    </span>
                  )}
                  <span className="flex items-center gap-0.5 text-primary group-hover:translate-x-0.5 transition-transform font-bold">
                    Start Prep <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
