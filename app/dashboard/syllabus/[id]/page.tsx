'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  CreditCard,
  HelpCircle,
  Loader2,
  Sparkles,
  Trash2,
  BookOpen,
  Eye,
  EyeOff,
  GraduationCap,
  Printer
} from 'lucide-react';
import type { Syllabus, SyllabusTopic, SamplePaper } from '@/types';

type GeneratingType = Record<string, 'notes' | 'flashcards' | 'quiz' | null>;

export default function SyllabusDetailPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };

  const [syllabus, setSyllabus] = useState<Syllabus | null>(null);
  const [topics, setTopics] = useState<SyllabusTopic[]>([]);
  const [samplePapers, setSamplePapers] = useState<SamplePaper[]>([]);
  const [loading, setLoading] = useState(true);

  // UI States
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [newExamDate, setNewExamDate] = useState('');
  const [updatingDate, setUpdatingDate] = useState(false);
  const [activeTab, setActiveTab] = useState<'topics' | 'calendar'>('topics');

  // Generation status
  const [generating, setGenerating] = useState<GeneratingType>({});

  // Custom Sample Paper state
  const [paperFormat, setPaperFormat] = useState('Section A: 5 questions of 5 marks each (Answer any 3), Section B: 5 questions of 5 marks each (Answer any 3), Section C: 10 questions of 2 marks each (Answer all)');
  const [isGeneratingPaper, setIsGeneratingPaper] = useState(false);
  const [expandedPaper, setExpandedPaper] = useState<string | null>(null);
  const [showPaperAnswers, setShowPaperAnswers] = useState<Record<string, boolean>>({});

  const fetchSyllabusDetails = async () => {
    try {
      const res = await fetch(`/api/syllabus/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch syllabus details');
      
      setSyllabus(json.data);
      setTopics(json.data.topics || []);
      setSamplePapers(json.data.sample_papers || []);
      if (json.data.exam_date) {
        setNewExamDate(json.data.exam_date.substring(0, 10));
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Could not load syllabus study plan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchSyllabusDetails();
    }
  }, [id]);

  const handleUpdateExamDate = async () => {
    try {
      setUpdatingDate(true);
      const res = await fetch(`/api/syllabus/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exam_date: newExamDate ? new Date(newExamDate).toISOString() : null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update exam date');
      
      setSyllabus((prev) => prev ? { ...prev, exam_date: json.data.exam_date } : null);
      setIsEditingDate(false);
      toast.success('Exam date updated');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to update exam date');
    } finally {
      setUpdatingDate(false);
    }
  };

  const handleUpdateTopicStatus = async (topicId: string, status: SyllabusTopic['status']) => {
    try {
      const res = await fetch(`/api/syllabus/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic_id: topicId, status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update topic status');

      setTopics((prev) =>
        prev.map((t) => (t.id === topicId ? { ...t, status: json.data.status } : t))
      );
      toast.success('Status updated');

      if (status === 'completed') {
        const { updateStudyStreak } = await import('@/lib/streak');
        const { streak, updated } = await updateStudyStreak();
        if (updated) {
          toast.success(`Study streak updated! 🔥 ${streak} days!`);
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to update status');
    }
  };

  const handleGenerateMaterial = async (topicId: string, type: 'notes' | 'flashcards' | 'quiz') => {
    try {
      setGenerating((prev) => ({ ...prev, [topicId]: type }));
      
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const savedKey = localStorage.getItem('user_groq_api_key');
      if (savedKey) {
        headers['x-groq-api-key'] = savedKey;
      }

      const res = await fetch(`/api/syllabus/${id}/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ topic_id: topicId, type }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Failed to generate ${type}`);

      // If we generated notes, link it in our state
      if (type === 'notes') {
        setTopics((prev) =>
          prev.map((t) => (t.id === topicId ? { ...t, note_id: json.data.id, status: 'completed' } : t))
        );
        toast.success('Study notes generated!');
      } else if (type === 'flashcards') {
        toast.success('Flashcards generated! Redirecting to Flashcards panel…');
        setTimeout(() => {
          router.push('/dashboard/flashcards');
        }, 1500);
      } else if (type === 'quiz') {
        toast.success('Quiz generated! Redirecting to Quiz panel…');
        setTimeout(() => {
          router.push('/dashboard/quiz');
        }, 1500);
      }

      // Update study streak on successful study material generation
      const { updateStudyStreak } = await import('@/lib/streak');
      const { streak, updated } = await updateStudyStreak();
      if (updated) {
        toast.success(`Study streak updated! 🔥 ${streak} days!`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || `Failed to generate ${type}`);
    } finally {
      setGenerating((prev) => ({ ...prev, [topicId]: null }));
    }
  };

  const handleGenerateSamplePaper = async () => {
    if (!paperFormat.trim()) return;

    try {
      setIsGeneratingPaper(true);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const savedKey = localStorage.getItem('user_groq_api_key');
      if (savedKey) {
        headers['x-groq-api-key'] = savedKey;
      }

      const res = await fetch(`/api/syllabus/${id}/sample-paper`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ format_description: paperFormat }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to generate practice paper');

      setSamplePapers((prev) => [json.data, ...prev]);
      setExpandedPaper(json.data.id);
      toast.success('Practice paper generated successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to generate practice paper');
    } finally {
      setIsGeneratingPaper(false);
    }
  };

  const handleDeletePaper = async (paperId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this sample paper?')) return;

    try {
      // In the remote schema, the table cascades or we can delete it. Since we only want to remove it locally or call DELETE:
      // Note: We don't have a direct API DELETE route for sample-papers, but we can do a supabase deletion or write one.
      // For simplicity, we can let Supabase delete it directly if we had the client, or write a quick endpoint.
      // Wait, we don't have a delete route in sample-paper route, let's look at c:\turbo learn\turbolearn\app\api\syllabus\[id]\sample-paper\route.ts
      // It has POST and GET.
      // If we want to delete a paper, let's write a DELETE method in `app/api/syllabus/[id]/sample-paper/route.ts` or we can call Supabase directly since we are on client side!
      // Yes! Supabase client allows deletion if RLS is enabled:
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { error } = await supabase.from('sample_papers').delete().eq('id', paperId);
      if (error) throw error;

      setSamplePapers((prev) => prev.filter((p) => p.id !== paperId));
      toast.success('Sample paper deleted');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to delete sample paper');
    }
  };

  const handlePrintPaper = (paper: SamplePaper, includeAnswers: boolean = false) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocked! Please allow pop-ups to print the exam paper.');
      return;
    }

    // Group questions by section if A/B/C section codes are present
    const questionsA = paper.content.filter(q => q.section?.toUpperCase() === 'A');
    const questionsB = paper.content.filter(q => q.section?.toUpperCase() === 'B');
    const questionsC = paper.content.filter(q => q.section?.toUpperCase() === 'C');

    const renderQuestionRow = (q: any, idx: number) => `
      <div class="question-row">
        <div class="question-left">
          <span class="q-num">Q${idx}.</span>
          <span class="q-text">${q.question}</span>
        </div>
        ${q.marks ? `<span class="q-marks">[${q.marks}M]</span>` : ''}
      </div>
      ${includeAnswers && q.answer_key ? `
        <div class="solution-container">
          <strong>Solution / Evaluator Answer Key:</strong>
          <p>${q.answer_key}</p>
        </div>
      ` : `
        <div class="writing-lines"></div>
      `}
    `;

    let sectionsHtml = '';
    if (questionsA.length > 0 || questionsB.length > 0 || questionsC.length > 0) {
      if (questionsA.length > 0) {
        sectionsHtml += `
          <div class="section-title">SECTION - A</div>
          <div class="section-desc">Answer any THREE questions. Each question carries 5 Marks. (3 x 5 = 15 Marks)</div>
          <div class="questions-list">
            ${questionsA.map((q, idx) => renderQuestionRow(q, idx + 1)).join('')}
          </div>
        `;
      }
      if (questionsB.length > 0) {
        sectionsHtml += `
          <div class="section-title" style="margin-top: 30px;">SECTION - B</div>
          <div class="section-desc">Answer any THREE questions. Each question carries 5 Marks. (3 x 5 = 15 Marks)</div>
          <div class="questions-list">
            ${questionsB.map((q, idx) => renderQuestionRow(q, idx + 1)).join('')}
          </div>
        `;
      }
      if (questionsC.length > 0) {
        sectionsHtml += `
          <div class="section-title" style="margin-top: 30px;">SECTION - C</div>
          <div class="section-desc">Answer ALL questions. Each question carries 2 Marks. (10 x 2 = 20 Marks)</div>
          <div class="questions-list">
            ${questionsC.map((q, idx) => renderQuestionRow(q, idx + 1)).join('')}
          </div>
        `;
      }
    } else {
      // Fallback partition of Section A (shorter marks/types) and Section B (descriptive)
      const shortQuestions = paper.content.filter(q => (q.marks && q.marks <= 4) || q.question.toLowerCase().includes('what') || q.question.toLowerCase().includes('define'));
      const longQuestions = paper.content.filter(q => !shortQuestions.includes(q));

      if (shortQuestions.length > 0 && longQuestions.length > 0) {
        sectionsHtml += `
          <div class="section-title">SECTION - A (Short Answer Questions)</div>
          <div class="section-desc">Answer ALL questions. Each question carries equal marks.</div>
          <div class="questions-list">
            ${shortQuestions.map((q, idx) => renderQuestionRow(q, idx + 1)).join('')}
          </div>

          <div class="section-title" style="margin-top: 30px;">SECTION - B (Descriptive / Long Answer Questions)</div>
          <div class="section-desc">Answer ALL questions. Each question carries equal marks.</div>
          <div class="questions-list">
            ${longQuestions.map((q, idx) => renderQuestionRow(q, shortQuestions.length + idx + 1)).join('')}
          </div>
        `;
      } else {
        sectionsHtml += `
          <div class="section-title">SECTION - A</div>
          <div class="section-desc">Answer ALL questions. Figures to the right indicate full marks.</div>
          <div class="questions-list">
            ${paper.content.map((q, idx) => renderQuestionRow(q, idx + 1)).join('')}
          </div>
        `;
      }
    }

    const totalMarks = paper.content.reduce((sum, q) => sum + (q.marks || 0), 0) || 70;

    printWindow.document.write(`
      <html>
        <head>
          <title>${paper.title}</title>
          <style>
            @media print {
              body {
                padding: 10px;
                background-color: #fff;
              }
              .writing-lines {
                border-bottom-style: dotted !important;
              }
              .solution-container {
                background-color: #fff !important;
                border: 1px solid #000 !important;
              }
            }

            body {
              font-family: 'Times New Roman', Times, serif;
              color: #000;
              line-height: 1.5;
              padding: 30px;
              max-width: 850px;
              margin: 0 auto;
              background-color: #fff;
            }

            /* Roll Number Box */
            .roll-num-wrapper {
              display: flex;
              justify-content: flex-end;
              align-items: center;
              margin-bottom: 15px;
              font-size: 13px;
              font-weight: bold;
            }
            .roll-label {
              margin-right: 8px;
            }
            .roll-boxes {
              display: flex;
            }
            .roll-box {
              width: 22px;
              height: 22px;
              border: 1px solid #000;
              margin-left: -1px;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            /* University Header */
            .univ-header {
              text-align: center;
              margin-bottom: 20px;
            }
            .univ-name {
              font-size: 19px;
              font-weight: bold;
              letter-spacing: 0.5px;
              text-transform: uppercase;
              margin: 0 0 4px 0;
            }
            .univ-subtitle {
              font-size: 13px;
              font-weight: bold;
              text-transform: uppercase;
              margin: 0 0 4px 0;
            }
            .univ-exam-type {
              font-size: 14px;
              font-weight: bold;
              text-decoration: underline;
              margin: 0 0 10px 0;
            }

            /* Meta Info Table */
            .meta-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 13.5px;
            }
            .meta-table td {
              border: 1px solid #000;
              padding: 6px 10px;
              vertical-align: middle;
            }
            .meta-table td strong {
              text-transform: uppercase;
              font-size: 12px;
            }

            /* Instructions */
            .instructions-container {
              border: 1px solid #000;
              padding: 10px 15px;
              margin-bottom: 25px;
              font-size: 12.5px;
            }
            .instructions-title {
              font-weight: bold;
              text-transform: uppercase;
              margin-bottom: 4px;
              font-size: 13px;
            }
            .instructions-container ol {
              margin: 0;
              padding-left: 20px;
            }
            .instructions-container li {
              margin-bottom: 3px;
            }

            /* Section Headers */
            .section-title {
              font-size: 14px;
              font-weight: bold;
              text-align: center;
              text-transform: uppercase;
              margin: 25px 0 5px 0;
              letter-spacing: 0.5px;
              text-decoration: underline;
            }
            .section-desc {
              font-size: 12.5px;
              text-align: center;
              font-style: italic;
              margin-bottom: 15px;
            }

            /* Questions */
            .questions-list {
              margin-top: 10px;
            }
            .question-row {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-top: 15px;
              font-size: 14px;
              page-break-inside: avoid;
            }
            .question-left {
              display: flex;
              align-items: flex-start;
              flex-grow: 1;
              text-align: justify;
            }
            .q-num {
              font-weight: bold;
              margin-right: 8px;
              flex-shrink: 0;
              width: 25px;
            }
            .q-text {
              flex-grow: 1;
            }
            .q-marks {
              font-weight: bold;
              margin-left: 20px;
              flex-shrink: 0;
              font-size: 13px;
              white-space: nowrap;
            }

            /* Writing lines space for printing */
            .writing-lines {
              height: 100px;
              border-bottom: 1px dashed #bbb;
              margin-left: 33px;
              margin-bottom: 15px;
            }

            /* Answer Sheet block */
            .solution-container {
              margin: 10px 0 15px 33px;
              padding: 10px 15px;
              background-color: #f7f9fa;
              border-left: 3px solid #000;
              font-size: 13px;
              text-align: justify;
            }
            .solution-container strong {
              display: block;
              margin-bottom: 4px;
              text-transform: uppercase;
              font-size: 11px;
              letter-spacing: 0.5px;
            }
          </style>
        </head>
        <body>
          <!-- Roll Number Box -->
          <div class="roll-num-wrapper">
            <span class="roll-label">Hall Ticket No / Roll No:</span>
            <div class="roll-boxes">
              <div class="roll-box"></div>
              <div class="roll-box"></div>
              <div class="roll-box"></div>
              <div class="roll-box"></div>
              <div class="roll-box"></div>
              <div class="roll-box"></div>
              <div class="roll-box"></div>
              <div class="roll-box"></div>
              <div class="roll-box"></div>
              <div class="roll-box"></div>
            </div>
          </div>

          <!-- University Header -->
          <div class="univ-header">
            <h1 class="univ-name">CENTRAL UNIVERSITY OF TECHNOLOGY & SCIENCE</h1>
            <h2 class="univ-subtitle">B.Tech / BCA / B.Sc Degree End Semester Examinations, May 2026</h2>
            <div class="univ-exam-type">RE-ACCREDITED B++ GRADE NATIONAL BOARD OF ACCREDITATION</div>
          </div>

          <!-- Meta Info Table -->
          <table class="meta-table">
            <tr>
              <td width="20%"><strong>Subject Code:</strong></td>
              <td width="30%">EP-${paper.id.substring(0, 4).toUpperCase()}</td>
              <td width="20%"><strong>Time Allowed:</strong></td>
              <td width="30%">3 Hours</td>
            </tr>
            <tr>
              <td><strong>Subject Name:</strong></td>
              <td><strong>${syllabus?.title.toUpperCase() || 'EXAMINATION PLAN'}</strong></td>
              <td><strong>Maximum Marks:</strong></td>
              <td><strong>${totalMarks} Marks</strong></td>
            </tr>
          </table>

          <!-- General Instructions -->
          <div class="instructions-container">
            <div class="instructions-title">Instructions to Candidates:</div>
            <ol>
              <li>Write your Hall Ticket Number/Roll Number clearly in the boxes provided at the top.</li>
              <li>This question paper contains all topics from the syllabus curriculum study plan.</li>
              <li>Answer all questions. Write your answers legibly in the booklets provided.</li>
              <li>Figures to the right indicate full marks allocated to each sub-question.</li>
            </ol>
          </div>

          <!-- Sections -->
          ${sectionsHtml}

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };



  // Helper to format countdown
  const getExamCountdown = (examDateStr: string | null) => {
    if (!examDateStr) return null;
    const examDate = new Date(examDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'Exam passed', isPassed: true };
    if (diffDays === 0) return { label: 'EXAM IS TODAY! 🚨', isCritical: true };
    if (diffDays === 1) return { label: 'Exam tomorrow! ⏳', isCritical: true };
    if (diffDays <= 7) return { label: `${diffDays} days left ⏳`, isWarning: true };
    return { label: `${diffDays} days left`, isNormal: true };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm font-medium">Loading your study plan…</p>
      </div>
    );
  }

  if (!syllabus) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 space-y-4">
        <h2 className="text-xl font-bold text-red-500">Syllabus plan not found</h2>
        <p className="text-muted-foreground">It might have been deleted or you do not have permission to view it.</p>
        <Link href="/dashboard/syllabus" className="inline-flex items-center gap-2 text-primary hover:underline font-bold">
          <ArrowLeft className="w-4 h-4" /> Go back
        </Link>
      </div>
    );
  }

  const countdown = getExamCountdown(syllabus.exam_date);
  const completedTopics = topics.filter((t) => t.status === 'completed').length;
  const progressPercent = topics.length > 0 ? Math.round((completedTopics / topics.length) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in space-y-8">
      {/* Top Navigation */}
      <Link href="/dashboard/syllabus" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Exam Plans
      </Link>

      {/* Header Panel */}
      <div className="glass rounded-3xl border border-border bg-card/60 backdrop-blur-md p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-4 max-w-xl">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5" /> Study Plan
            </span>
            {countdown && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                  countdown.isPassed
                    ? 'bg-muted text-muted-foreground'
                    : countdown.isCritical
                    ? 'bg-red-500/10 text-red-500 animate-pulse-soft'
                    : countdown.isWarning
                    ? 'bg-orange-500/10 text-orange-500'
                    : 'bg-primary/10 text-primary'
                }`}
              >
                <Clock className="w-3.5 h-3.5" /> {countdown.label}
              </span>
            )}
          </div>

          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{syllabus.title}</h1>
            <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
              Extracted from your curriculum file. We've built {topics.length} study topics to prep you for your exams.
            </p>
          </div>

          {/* Exam date editor */}
          <div className="flex items-center gap-2 pt-1 text-sm">
            {isEditingDate ? (
              <div className="flex items-center gap-2 animate-scale-in">
                <input
                  type="date"
                  value={newExamDate}
                  onChange={(e) => setNewExamDate(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-muted border border-border text-xs focus-ring-glow focus:outline-none"
                />
                <button
                  onClick={handleUpdateExamDate}
                  disabled={updatingDate}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-primary cursor-pointer active-press"
                >
                  {updatingDate ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setIsEditingDate(false)}
                  className="px-2 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingDate(true)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
              >
                <Calendar className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span>
                  {syllabus.exam_date
                    ? `Exam on ${new Date(syllabus.exam_date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}`
                    : 'Set Exam Date'}
                </span>
                <span className="text-[10px] text-primary/70 opacity-0 group-hover:opacity-100 transition-opacity ml-1 font-semibold">
                  (edit)
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Ring / Dashboard Block */}
        <div className="shrink-0 flex items-center gap-4 bg-muted/40 p-5 rounded-2xl border border-border/40 min-w-[200px]">
          <div className="space-y-1 flex-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Syllabus Progress</span>
            <span className="text-2xl font-black">{progressPercent}%</span>
            <span className="text-xs text-muted-foreground block font-medium">
              {completedTopics} of {topics.length} studied
            </span>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-muted flex items-center justify-center relative">
            <div
              className="absolute inset-0 rounded-full border-4 border-primary transition-all duration-500"
              style={{
                clipPath: `polygon(50% 50%, -50% -50%, ${progressPercent >= 25 ? '150%' : '50%'} ${
                  progressPercent >= 50 ? '150%' : '-50%'
                }, ${progressPercent >= 75 ? '-50%' : '150%'} ${
                  progressPercent >= 75 ? '150%' : '150%'
                }, -50% -50%)`,
                transform: 'rotate(-45deg)',
              }}
            />
            <CheckCircle className={`w-6 h-6 ${progressPercent === 100 ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-border/40 gap-2">
        <button
          onClick={() => setActiveTab('topics')}
          className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === 'topics'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          📚 Study Plan & Topics
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 cursor-pointer transition-all flex items-center gap-1.5 ${
            activeTab === 'calendar'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Calendar className="w-4 h-4 text-yellow-500" />
          <span>📅 AI Study Planner</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Topics List - Left/Main side */}
        {activeTab === 'topics' && (
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              📚 Study Plan & Topics
            </h2>

            <div className="space-y-3">
              {topics.map((topic, index) => {
                const isExpanded = expandedTopic === topic.id;
                const isGenerating = generating[topic.id] || null;

                return (
                  <div
                    key={topic.id}
                    className={`rounded-2xl border transition-all duration-300 bg-card overflow-hidden ${
                      isExpanded
                        ? 'border-primary shadow-lg shadow-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/5'
                    }`}
                  >
                    {/* Topic Accordion Header */}
                    <div
                      onClick={() => setExpandedTopic(isExpanded ? null : topic.id)}
                      className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center font-bold text-sm text-muted-foreground shrink-0">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-foreground truncate">{topic.title}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-md">
                            {topic.description || 'No description available.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Status select (Stops propagation so it doesn't trigger expand) */}
                        <select
                          value={topic.status}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleUpdateTopicStatus(topic.id, e.target.value as any);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className={`text-xs font-bold px-2.5 py-1.5 rounded-full border border-border cursor-pointer active-press ${
                            topic.status === 'completed'
                              ? 'bg-success/15 border-success/35 text-success'
                              : topic.status === 'in_progress'
                              ? 'bg-orange-500/15 border-orange-500/35 text-orange-500'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <option value="not_started">Not Started</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>

                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>

                    {/* Topic Expandable Content */}
                    {isExpanded && (
                      <div className="border-t border-border/40 p-5 bg-muted/20 space-y-4 animate-slide-down">
                        {topic.description && (
                          <div>
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Topic Focus</span>
                            <p className="text-sm text-foreground/80 mt-1 leading-relaxed">{topic.description}</p>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-3 pt-2">
                          {/* 1. Study Notes Button */}
                          {topic.note_id ? (
                            <Link
                              href={`/dashboard/notes/${topic.note_id}`}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-success/10 hover:bg-success/20 text-success border border-success/20 transition-all"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View Study Notes</span>
                            </Link>
                          ) : (
                            <button
                              onClick={() => handleGenerateMaterial(topic.id, 'notes')}
                              disabled={!!isGenerating}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-white border border-primary/20 transition-all cursor-pointer active-press"
                            >
                              {isGenerating === 'notes' ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Sparkles className="w-3.5 h-3.5" />
                              )}
                              <span>Generate Study Notes</span>
                            </button>
                          )}

                          {/* 2. Flashcards Button */}
                          <button
                            onClick={() => handleGenerateMaterial(topic.id, 'flashcards')}
                            disabled={!!isGenerating}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-card hover:bg-muted border border-border text-foreground transition-all cursor-pointer active-press"
                          >
                            {isGenerating === 'flashcards' ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CreditCard className="w-3.5 h-3.5" />
                            )}
                            <span>Generate Flashcards</span>
                          </button>

                          {/* 3. Quiz Button */}
                          <button
                            onClick={() => handleGenerateMaterial(topic.id, 'quiz')}
                            disabled={!!isGenerating}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-card hover:bg-muted border border-border text-foreground transition-all cursor-pointer active-press"
                          >
                            {isGenerating === 'quiz' ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <HelpCircle className="w-3.5 h-3.5" />
                            )}
                            <span>Generate Practice Quiz</span>
                          </button>
                        </div>

                        {!topic.note_id && (
                          <p className="text-[10px] text-muted-foreground italic">
                            💡 Generating flashcards or quizzes will automatically generate comprehensive notes for this topic first.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Calendar Checklist View */}
        {activeTab === 'calendar' && (
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                📅 AI Study Calendar
              </h2>
              {syllabus.exam_date && (
                <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-lg">
                  Spaced Distribution Roadmap
                </span>
              )}
            </div>

            {!syllabus.exam_date ? (
              <div className="glass rounded-3xl p-8 text-center space-y-4 border border-dashed border-border bg-card">
                <div className="w-12 h-12 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center mx-auto">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-sm">Exam Date Required</h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    To generate your day-by-day study roadmap, please set your target exam date using the editor in the header.
                  </p>
                </div>
                <button
                  onClick={() => setIsEditingDate(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary cursor-pointer active-press"
                >
                  Set Exam Date
                </button>
              </div>
            ) : (
              <div className="relative pl-6 border-l-2 border-primary/20 space-y-6">
                {(() => {
                  const examDate = new Date(syllabus.exam_date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const diffTime = examDate.getTime() - today.getTime();
                  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  const scheduledDays = (() => {
                    if (daysLeft <= 0) {
                      return [{
                        dayNumber: 1,
                        date: today,
                        topics: topics
                      }];
                    }

                    const numDays = daysLeft;
                    const result = [];

                    if (numDays >= topics.length) {
                      const interval = numDays / topics.length;
                      topics.forEach((topic, index) => {
                        const dayOffset = Math.floor(index * interval);
                        const scheduledDate = new Date(today);
                        scheduledDate.setDate(today.getDate() + dayOffset);
                        result.push({
                          dayNumber: dayOffset + 1,
                          date: scheduledDate,
                          topics: [topic]
                        });
                      });
                    } else {
                      const topicsPerDay = Math.ceil(topics.length / numDays);
                      for (let i = 0; i < numDays; i++) {
                        const scheduledDate = new Date(today);
                        scheduledDate.setDate(today.getDate() + i);
                        const dayTopics = topics.slice(i * topicsPerDay, (i + 1) * topicsPerDay);
                        if (dayTopics.length > 0) {
                          result.push({
                            dayNumber: i + 1,
                            date: scheduledDate,
                            topics: dayTopics
                          });
                        }
                      }
                    }
                    return result;
                  })();

                  return scheduledDays.map((day, idx) => {
                    const completedCount = day.topics.filter(t => t.status === 'completed').length;
                    const totalCount = day.topics.length;
                    const dayPercent = Math.round((completedCount / totalCount) * 100);

                    return (
                      <div key={idx} className="relative group">
                        {/* Timeline dot */}
                        <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 bg-background transition-all ${
                          dayPercent === 100 
                            ? 'border-success bg-success' 
                            : dayPercent > 0 
                            ? 'border-orange-500 bg-orange-500/20' 
                            : 'border-primary'
                        }`} />

                        <div className="glass rounded-2xl border border-border bg-card p-5 space-y-4">
                          {/* Day Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                            <div>
                              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                                <span>Day {day.dayNumber}</span>
                                <span className="text-xs text-muted-foreground font-medium">
                                  • {day.date.toLocaleDateString(undefined, {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                              </h3>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-semibold text-muted-foreground">
                                {completedCount}/{totalCount} completed
                              </span>
                              <div className="w-16 bg-muted h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-primary h-full transition-all duration-300"
                                  style={{ width: `${dayPercent}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Topics list for this day */}
                          <div className="space-y-3">
                            {day.topics.map((topic) => {
                              const isGenerating = generating[topic.id] || null;

                              return (
                                <div key={topic.id} className="flex items-start justify-between gap-3 text-xs p-2 rounded-lg hover:bg-muted/30 transition-colors">
                                  <div className="flex items-start gap-2.5 min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={topic.status === 'completed'}
                                      onChange={() => {
                                        const nextStatus = topic.status === 'completed' ? 'not_started' : 'completed';
                                        handleUpdateTopicStatus(topic.id, nextStatus);
                                      }}
                                      className="mt-0.5 rounded border-border text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                                    />
                                    <div className="min-w-0">
                                      <span className={`font-semibold block text-foreground truncate max-w-sm ${topic.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                                        {topic.title}
                                      </span>
                                      {topic.description && (
                                        <span className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                                          {topic.description}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="shrink-0 flex items-center gap-2">
                                    {topic.note_id ? (
                                      <Link
                                        href={`/dashboard/notes/${topic.note_id}`}
                                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-success/30 bg-success/5 text-success hover:bg-success/15 transition-all"
                                      >
                                        Read Notes
                                      </Link>
                                    ) : (
                                      <button
                                        onClick={() => handleGenerateMaterial(topic.id, 'notes')}
                                        disabled={!!isGenerating}
                                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-primary text-white hover:bg-primary/95 cursor-pointer transition-all active-press"
                                      >
                                        {isGenerating === 'notes' ? (
                                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                        ) : (
                                          <Sparkles className="w-2.5 h-2.5 text-yellow-300" />
                                        )}
                                        <span>Study</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        )}

        {/* Custom Sample Paper Panel - Right side */}
        <div className="space-y-6">
          {/* Sample Paper Generator Card */}
          <div className="glass rounded-3xl border border-border bg-card/60 backdrop-blur-md p-6 space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              📝 Practice Exam Generator
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Create a custom mock exam based on your syllabus. Specify the format, and AI will construct questions and sample answers.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Exam Format Specification
                </label>
                <textarea
                  value={paperFormat}
                  onChange={(e) => setPaperFormat(e.target.value)}
                  placeholder="e.g. 5 MCQs, 3 Short Answers, 1 Long Essay"
                  rows={3}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-muted border border-border focus-ring-glow focus:outline-none resize-none text-foreground leading-normal"
                  disabled={isGeneratingPaper}
                />
              </div>

              <button
                onClick={handleGenerateSamplePaper}
                disabled={isGeneratingPaper || !paperFormat.trim()}
                className="w-full py-3.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer active-press hover:shadow-md transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, hsl(255 85% 68%), hsl(280 70% 65%))' }}
              >
                {isGeneratingPaper ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Exam Paper...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Practice Paper</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated Papers List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Your Practice Papers ({samplePapers.length})
            </h4>

            {samplePapers.length === 0 ? (
              <div className="text-center py-8 bg-muted/20 border border-dashed border-border/60 rounded-2xl text-xs text-muted-foreground">
                No mock exams generated yet.
              </div>
            ) : (
              <div className="space-y-3">
                {samplePapers.map((paper) => {
                  const isPaperExpanded = expandedPaper === paper.id;
                  const showAnswers = showPaperAnswers[paper.id] || false;

                  return (
                    <div
                      key={paper.id}
                      className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:border-primary/50 transition-colors"
                    >
                      {/* Paper Header */}
                      <div
                        onClick={() => setExpandedPaper(isPaperExpanded ? null : paper.id)}
                        className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                      >
                        <div className="min-w-0 flex-1">
                          <h5 className="font-bold text-sm truncate">{paper.title}</h5>
                          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                            {paper.format_description}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrintPaper(paper, false);
                            }}
                            className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer active-press transition-all"
                            title="Print Exam Paper (Without Answers)"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrintPaper(paper, true);
                            }}
                            className="p-1 rounded text-muted-foreground hover:text-success hover:bg-success/10 cursor-pointer active-press transition-all"
                            title="Print Answer Key (With Answers)"
                          >
                            <Printer className="w-3.5 h-3.5 text-success" />
                          </button>
                          <button
                            onClick={(e) => handleDeletePaper(paper.id, e)}
                            className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 cursor-pointer active-press transition-all"
                            title="Delete Practice Paper"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          {isPaperExpanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {/* Paper Questions details */}
                      {isPaperExpanded && (
                        <div className="border-t border-border/40 p-4 bg-muted/10 space-y-4 max-h-[400px] overflow-y-auto animate-slide-down">
                          <div className="flex items-center justify-between border-b border-border/40 pb-2">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">
                              Exam Questions
                            </span>
                            <button
                              onClick={() =>
                                setShowPaperAnswers((prev) => ({ ...prev, [paper.id]: !showAnswers }))
                              }
                              className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline cursor-pointer"
                            >
                              {showAnswers ? (
                                <>
                                  <EyeOff className="w-3 h-3" /> Hide Answer Keys
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3 h-3" /> Show Answer Keys
                                </>
                              )}
                            </button>
                          </div>

                          <div className="space-y-4">
                            {paper.content &&
                              paper.content.map((q, qidx) => (
                                <div key={q.id || qidx} className="space-y-1.5 text-xs">
                                  <div className="flex justify-between items-start gap-4">
                                    <span className="font-bold text-foreground leading-normal">
                                      Q{qidx + 1}. {q.question}
                                    </span>
                                    {q.marks && (
                                      <span className="shrink-0 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">
                                        {q.marks} {q.marks === 1 ? 'mark' : 'marks'}
                                      </span>
                                    )}
                                  </div>

                                  {showAnswers && q.answer_key && (
                                    <div className="bg-success/5 border border-success/15 rounded-lg p-2.5 mt-1">
                                      <span className="text-[10px] font-black text-success uppercase block">
                                        Answer Key:
                                      </span>
                                      <p className="text-[11px] text-foreground/80 mt-0.5 leading-relaxed">
                                        {q.answer_key}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
