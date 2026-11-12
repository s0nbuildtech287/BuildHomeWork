import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  Headphones,
  ImagePlus,
  Loader2,
  Plus,
  Printer,
  Save,
  Shuffle,
  Trash2,
  Users,
  Volume2,
  X,
} from 'lucide-react';
import { MathText } from './MathText';
import { generateTtsAudio } from '../services/gemini';
import { resolveGoogleScriptUrl } from '../services/googleSheet';
import { fetchSubmissions } from '../services/storage';
import { Homework, HomeworkSection, Question, StudentSubmission } from '../types';
import { DocxExportMode, exportHomeworkToDocx } from '../utils/docxExport';
import {
  countHomeworkQuestions,
  isChoiceQuestion,
  isEssayQuestion,
  resolveCorrectOptionIndex,
  stripOptionPrefix,
} from '../utils/grading';
import { extractClipboardImage, uploadQuestionImage } from '../utils/imageUpload';
import { createId } from '../utils/promptBuilder';
import { buildServerQuizUrl, buildStandaloneQuizUrl } from '../utils/shareCodec';

interface HomeworkEditorProps {
  homework: Homework;
  serverOnline: boolean;
  onSave: (updated: Homework) => Promise<void>;
  onOpenPrint: () => void;
  onPreviewQuiz: (homework: Homework) => void;
  onBackToLibrary: () => void;
}

export const HomeworkEditor: React.FC<HomeworkEditorProps> = ({
  homework,
  serverOnline,
  onSave,
  onOpenPrint,
  onPreviewQuiz,
  onBackToLibrary,
}) => {
  const [draft, setDraft] = useState<Homework>(homework);
  const [activeTab, setActiveTab] = useState<'questions' | 'share' | 'submissions'>('questions');
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [showAnswersInEditor, setShowAnswersInEditor] = useState(true);
  const [docxMode, setDocxMode] = useState<DocxExportMode>('student_with_key');
  const [copiedKey, setCopiedKey] = useState<'server' | 'standalone' | null>(null);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [generatingAudioSecId, setGeneratingAudioSecId] = useState<string | null>(null);
  const [uploadingImageKey, setUploadingImageKey] = useState<string | null>(null);

  useEffect(() => {
    setDraft(homework);
  }, [homework]);

  useEffect(() => {
    if (activeTab === 'submissions') {
      setLoadingSubs(true);
      fetchSubmissions(draft.id)
        .then(setSubmissions)
        .finally(() => setLoadingSubs(false));
    }
  }, [activeTab, draft.id]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const updateQuestion = (sectionId: string, qId: string, patch: Partial<Question>) => {
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) =>
        sec.id !== sectionId
          ? sec
          : {
              ...sec,
              questions: sec.questions.map((q) => (q.id === qId ? { ...q, ...patch } : q)),
            }
      ),
    }));
  };

  const deleteQuestion = (sectionId: string, qId: string) => {
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections
        .map((sec) =>
          sec.id !== sectionId
            ? sec
            : { ...sec, questions: sec.questions.filter((q) => q.id !== qId) }
        )
        .filter((sec) => sec.questions.length > 0),
    }));
  };

  const addQuestion = (sectionId: string) => {
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        const newQ: Question = {
          id: createId('q'),
          type: sec.type,
          prompt:
            sec.type === 'sentence_order'
              ? 'Arrange the words:'
              : sec.type === 'writing'
                ? 'Write 4-5 sentences about your topic:'
                : 'New question ______ here.',
          options:
            sec.type === 'multiple_choice' || sec.type === 'find_mistake'
              ? ['Option A', 'Option B', 'Option C', 'Option D']
              : undefined,
          words: sec.type === 'sentence_order' ? ['I', 'like', 'English.'] : undefined,
          correctAnswer:
            sec.type === 'multiple_choice' || sec.type === 'find_mistake'
              ? 'Option A'
              : sec.type === 'sentence_order'
                ? 'I like English.'
                : sec.type === 'writing'
                  ? 'Sample writing answer.'
                  : 'answer',
          explanation: 'Giải thích ngắn gọn bằng tiếng Việt.',
        };
        return { ...sec, questions: [...sec.questions, newQ] };
      }),
    }));
  };

  const shuffleQuestions = () => {
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) => {
        const copy = [...sec.questions];
        for (let i = copy.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return {
          ...sec,
          questions: copy.map((q) => {
            if (q.type === 'multiple_choice' && q.options && q.options.length > 1) {
              const opts = [...q.options];
              for (let i = opts.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [opts[i], opts[j]] = [opts[j], opts[i]];
              }
              return { ...q, options: opts };
            }
            return q;
          }),
        };
      }),
    }));
  };

  const handleAttachSectionImage = async (sectionId: string, file: File) => {
    setUploadingImageKey(`sec_${sectionId}`);
    try {
      const imageUrl = await uploadQuestionImage(file);
      setDraft((prev) => ({
        ...prev,
        sections: prev.sections.map((s) => (s.id === sectionId ? { ...s, imageUrl } : s)),
      }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không chèn được ảnh.');
    } finally {
      setUploadingImageKey(null);
    }
  };

  const handleAttachQuestionImage = async (sectionId: string, qId: string, file: File) => {
    setUploadingImageKey(`q_${qId}`);
    try {
      const imageUrl = await uploadQuestionImage(file);
      updateQuestion(sectionId, qId, { imageUrl });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không chèn được ảnh.');
    } finally {
      setUploadingImageKey(null);
    }
  };

  const handleRegenerateAudio = async (sec: HomeworkSection) => {
    const scriptText = (sec.listeningScript || '').trim();
    if (!scriptText) {
      alert('Hãy nhập nội dung lời thoại tiếng Anh trước khi tạo file MP3.');
      return;
    }
    setGeneratingAudioSecId(sec.id);
    try {
      const voice = sec.audioVoice || 'en-US-AriaNeural';
      const rate = sec.audioRate || (draft.level === 'elementary' ? '-15%' : '+0%');
      const audioUrl = await generateTtsAudio({ text: scriptText, voice, rate });
      const nextDraft: Homework = {
        ...draft,
        sections: draft.sections.map((s) =>
          s.id === sec.id ? { ...s, audioUrl, audioVoice: voice, audioRate: rate } : s
        ),
      };
      setDraft(nextDraft);
      await onSave(nextDraft);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không tạo được file MP3.');
    } finally {
      setGeneratingAudioSecId(null);
    }
  };

  const copyLink = async (type: 'server' | 'standalone') => {
    await onSave(draft);
    const scriptUrl = resolveGoogleScriptUrl();
    const url =
      type === 'server'
        ? buildServerQuizUrl(draft.id, scriptUrl)
        : buildStandaloneQuizUrl(draft);
    await navigator.clipboard.writeText(url);
    setCopiedKey(type);
    setTimeout(() => setCopiedKey(null), 2200);
  };

  const totalQ = countHomeworkQuestions(draft);
  const listeningSections = draft.sections.filter(
    (s) => Boolean(s.listeningScript) || Boolean(s.audioUrl) || s.title.toLowerCase().includes('listen')
  );
  let questionNumber = 1;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToLibrary}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" /> Kho bài tập
          </button>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
            {totalQ} câu hỏi
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Word Export */}
          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
            <select
              value={docxMode}
              onChange={(e) => setDocxMode(e.target.value as DocxExportMode)}
              className="bg-transparent px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="student">Word: Chỉ Đề bài</option>
              <option value="student_with_key">Word: Đề + Đáp án</option>
              <option value="teacher">Word: Giáo viên (Có giải thích)</option>
            </select>
            <button
              type="button"
              onClick={() => exportHomeworkToDocx(draft, docxMode)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
            >
              <Download className="h-3.5 w-3.5" /> Tải .DOCX
            </button>
          </div>

          {/* Print / PDF */}
          <button
            type="button"
            onClick={async () => {
              await onSave(draft);
              onOpenPrint();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            <Printer className="h-3.5 w-3.5 text-rose-600" /> Xuất PDF / In
          </button>

          {/* Save */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
          >
            {savedNotice ? (
              <>
                <Check className="h-3.5 w-3.5" /> Đã lưu!
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" /> {saving ? 'Đang lưu...' : 'Lưu vào kho'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metadata Header Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Tiêu đề bài tập</label>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Mô tả ngắn</label>
            <input
              type="text"
              value={draft.subtitle || ''}
              onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Lớp / Nhóm</label>
            <input
              type="text"
              value={draft.gradeOrClass || ''}
              onChange={(e) => setDraft({ ...draft, gradeOrClass: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Giáo viên</label>
            <input
              type="text"
              value={draft.teacherName || ''}
              onChange={(e) => setDraft({ ...draft, teacherName: e.target.value })}
              placeholder="VD: Cô Lan Anh"
              className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Trung tâm / Trường</label>
            <input
              type="text"
              value={draft.centerName || ''}
              onChange={(e) => setDraft({ ...draft, centerName: e.target.value })}
              placeholder="VD: English Corner"
              className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Top Listening Audio Summary Banner (so teacher doesn't have to scroll down on long exams) */}
      {listeningSections.length > 0 && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 shadow-xs">
          <div className="space-y-3">
            {listeningSections.map((sec) => (
              <div
                key={sec.id}
                className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                    <Headphones className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-indigo-950">
                      File nghe MP3: {sec.title}
                    </div>
                    <div className="text-xs text-indigo-700">
                      {sec.audioUrl
                        ? 'Đã có file MP3 sẵn sàng để nghe thử, tải về hoặc phát trên đề Online.'
                        : 'Chưa có file MP3 — bấm "Tạo file MP3 ngay" để chuyển lời thoại thành giọng đọc.'}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {sec.audioUrl ? (
                    <>
                      <audio controls src={sec.audioUrl} className="h-9 max-w-[260px]" />
                      <a
                        href={sec.audioUrl}
                        download={`${draft.title.replace(/[^a-zA-Z0-9_-]+/g, '_')}_listening.mp3`}
                        className="inline-flex items-center gap-1 rounded-xl border border-indigo-300 bg-white px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
                      >
                        <Download className="h-3.5 w-3.5" /> Tải .MP3
                      </a>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={generatingAudioSecId === sec.id}
                      onClick={() => handleRegenerateAudio(sec)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {generatingAudioSecId === sec.id ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tạo MP3...
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-3.5 w-3.5" /> Tạo file MP3 ngay
                        </>
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('questions');
                      setTimeout(() => {
                        document
                          .getElementById(`sec_${sec.id}`)
                          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 50);
                    }}
                    className="rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                  >
                    Tới Phần Nghe ↓
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('questions')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold ${
              activeTab === 'questions'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="h-4 w-4" /> Nội dung câu hỏi
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('share')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold ${
              activeTab === 'share'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Globe className="h-4 w-4" /> Link làm bài Online
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('submissions')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold ${
              activeTab === 'submissions'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="h-4 w-4" /> Kết quả học sinh
          </button>
        </div>

        {activeTab === 'questions' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={shuffleQuestions}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Shuffle className="h-3.5 w-3.5" /> Trộn thứ tự câu
            </button>
            <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={showAnswersInEditor}
                onChange={(e) => setShowAnswersInEditor(e.target.checked)}
              />
              Hiện đáp án & giải thích
            </label>
          </div>
        )}
      </div>

      {/* Tab Content: Questions */}
      {activeTab === 'questions' && (
        <div className="space-y-5">
          {draft.sections.map((section) => (
            <div
              key={section.id}
              id={`sec_${section.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex-1 space-y-1">
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        sections: prev.sections.map((s) =>
                          s.id === section.id ? { ...s, title: e.target.value } : s
                        ),
                      }))
                    }
                    className="w-full text-base font-bold text-indigo-700 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={section.instruction}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        sections: prev.sections.map((s) =>
                          s.id === section.id ? { ...s, instruction: e.target.value } : s
                        ),
                      }))
                    }
                    className="w-full text-xs text-slate-500 italic focus:outline-none"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                    {uploadingImageKey === `sec_${section.id}` ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                    ) : (
                      <ImagePlus className="h-3.5 w-3.5 text-indigo-600" />
                    )}
                    Ảnh chung
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleAttachSectionImage(section.id, f);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => addQuestion(section.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                  >
                    <Plus className="h-3.5 w-3.5" /> Thêm câu
                  </button>
                </div>
              </div>

              {section.imageUrl && (
                <div className="relative mb-4 inline-block rounded-xl border border-slate-200 bg-slate-50 p-2">
                  <img
                    src={section.imageUrl}
                    alt="Section illustration"
                    className="max-h-52 w-auto rounded-lg object-contain"
                  />
                  <button
                    type="button"
                    title="Gỡ ảnh này"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        sections: prev.sections.map((s) =>
                          s.id === section.id ? { ...s, imageUrl: undefined } : s
                        ),
                      }))
                    }
                    className="absolute top-3 right-3 rounded-full bg-slate-900/75 p-1 text-white hover:bg-red-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {section.readingPassage !== undefined && section.readingPassage !== '' && (
                <div className="mb-4">
                  <label className="mb-1 block text-xs font-semibold text-slate-500">
                    Đoạn văn đọc hiểu (có thể chỉnh sửa)
                  </label>
                  <textarea
                    rows={4}
                    value={section.readingPassage}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        sections: prev.sections.map((s) =>
                          s.id === section.id ? { ...s, readingPassage: e.target.value } : s
                        ),
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>
              )}

              {section.wordBank && section.wordBank.length > 0 && (
                <div className="mb-4">
                  <label className="mb-1 block text-xs font-semibold text-slate-500">
                    Bảng từ / Các lựa chọn nối (mỗi dòng 1 mục)
                  </label>
                  <textarea
                    rows={Math.min(8, Math.max(3, section.wordBank.length))}
                    value={section.wordBank.join('\n')}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        sections: prev.sections.map((s) =>
                          s.id === section.id
                            ? {
                                ...s,
                                wordBank: e.target.value
                                  .split(/\r?\n/)
                                  .map((line) => line.trim())
                                  .filter(Boolean),
                              }
                            : s
                        ),
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>
              )}

              {(section.listeningScript !== undefined || section.audioUrl) && (
                <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                      <Headphones className="h-4 w-4 text-indigo-600" />
                      File nghe MP3 & Lời thoại (Tapescript)
                    </div>
                    {section.audioUrl && (
                      <a
                        href={section.audioUrl}
                        download={`${draft.title.replace(/[^a-zA-Z0-9_-]+/g, '_')}_listening.mp3`}
                        className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                      >
                        <Download className="h-3.5 w-3.5" /> Tải file .MP3
                      </a>
                    )}
                  </div>

                  {section.audioUrl && (
                    <audio controls src={section.audioUrl} className="h-9 w-full" />
                  )}

                  <textarea
                    rows={3}
                    value={section.listeningScript || ''}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        sections: prev.sections.map((s) =>
                          s.id === section.id ? { ...s, listeningScript: e.target.value } : s
                        ),
                      }))
                    }
                    placeholder="Nội dung bài nghe tiếng Anh để tạo giọng đọc MP3..."
                    className="w-full rounded-xl border border-indigo-200 bg-white p-3 text-sm leading-relaxed text-slate-800 focus:border-indigo-500 focus:outline-none"
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={section.audioVoice || 'en-US-AriaNeural'}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          sections: prev.sections.map((s) =>
                            s.id === section.id ? { ...s, audioVoice: e.target.value } : s
                          ),
                        }))
                      }
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700"
                    >
                      <option value="en-US-AriaNeural">Giọng Nữ Mỹ (Aria)</option>
                      <option value="en-US-GuyNeural">Giọng Nam Mỹ (Guy)</option>
                      <option value="en-GB-SoniaNeural">Giọng Nữ Anh (Sonia)</option>
                      <option value="en-GB-RyanNeural">Giọng Nam Anh (Ryan)</option>
                      <option value="en-AU-NatashaNeural">Giọng Nữ Úc (Natasha)</option>
                    </select>

                    <select
                      value={
                        section.audioRate || (draft.level === 'elementary' ? '-15%' : '+0%')
                      }
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          sections: prev.sections.map((s) =>
                            s.id === section.id ? { ...s, audioRate: e.target.value } : s
                          ),
                        }))
                      }
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700"
                    >
                      <option value="-20%">Rất chậm (-20% - Tiểu học)</option>
                      <option value="-15%">Chậm vừa (-15%)</option>
                      <option value="+0%">Tốc độ chuẩn</option>
                      <option value="+10%">Nhanh hơn (+10%)</option>
                    </select>

                    <button
                      type="button"
                      disabled={generatingAudioSecId === section.id}
                      onClick={() => handleRegenerateAudio(section)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {generatingAudioSecId === section.id ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tạo MP3...
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-3.5 w-3.5" />{' '}
                          {section.audioUrl ? 'Tạo lại file MP3' : 'Tạo file MP3 từ lời thoại'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {section.questions.map((q) => {
                  const qNum = questionNumber++;
                  const correctIdx = isChoiceQuestion(q) ? resolveCorrectOptionIndex(q) : -1;

                  return (
                    <div
                      key={q.id}
                      onPaste={(e) => {
                        const img = extractClipboardImage(e);
                        if (img) {
                          e.preventDefault();
                          handleAttachQuestionImage(section.id, q.id, img);
                        }
                      }}
                      className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 focus-within:border-indigo-300"
                    >
                      <div className="flex items-start gap-2">
                        <span className="mt-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                          {qNum}
                        </span>
                        <div className="flex-1 space-y-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              type="text"
                              value={q.prompt}
                              onChange={(e) =>
                                updateQuestion(section.id, q.id, { prompt: e.target.value })
                              }
                              className="min-w-[220px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:outline-none"
                            />
                            <label
                              title="Chọn file ảnh hoặc bấm vào câu hỏi rồi nhấn Ctrl+V để dán ảnh"
                              className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                            >
                              {uploadingImageKey === `q_${q.id}` ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                              ) : (
                                <ImagePlus className="h-3.5 w-3.5 text-indigo-600" />
                              )}
                              Chèn / Ctrl+V ảnh
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) handleAttachQuestionImage(section.id, q.id, f);
                                  e.target.value = '';
                                }}
                              />
                            </label>
                          </div>

                          {q.prompt.includes('$') && (
                            <div className="rounded-lg border border-blue-100 bg-blue-50/40 px-3 py-1.5 text-xs text-slate-700">
                              <span className="mr-1.5 font-semibold text-blue-700">Xem trước công thức:</span>
                              <MathText text={q.prompt} />
                            </div>
                          )}

                          {q.imageUrl && (
                            <div className="relative inline-block rounded-lg border border-slate-200 bg-white p-1.5">
                              <img
                                src={q.imageUrl}
                                alt={`Câu ${qNum}`}
                                className="max-h-44 w-auto rounded object-contain"
                              />
                              <button
                                type="button"
                                title="Gỡ ảnh khỏi câu này"
                                onClick={() =>
                                  updateQuestion(section.id, q.id, { imageUrl: undefined })
                                }
                                className="absolute top-2.5 right-2.5 rounded-full bg-slate-900/75 p-1 text-white hover:bg-red-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          )}

                          {q.type === 'sentence_order' && (
                            <div>
                              <label className="text-[11px] font-semibold text-slate-500">
                                Các từ cần sắp xếp (cách nhau bằng dấu | ):
                              </label>
                              <input
                                type="text"
                                value={(q.words || []).join(' | ')}
                                onChange={(e) =>
                                  updateQuestion(section.id, q.id, {
                                    words: e.target.value
                                      .split('|')
                                      .map((w) => w.trim())
                                      .filter(Boolean),
                                  })
                                }
                                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
                              />
                            </div>
                          )}

                          {isChoiceQuestion(q) && q.options && (
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {q.options.map((opt, idx) => {
                                const isAns = idx === correctIdx;
                                return (
                                  <div
                                    key={idx}
                                    className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${
                                      showAnswersInEditor && isAns
                                        ? 'border-emerald-400 bg-emerald-50'
                                        : 'border-slate-200 bg-white'
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      title="Đặt làm đáp án đúng"
                                      onClick={() =>
                                        updateQuestion(section.id, q.id, {
                                          correctAnswer: stripOptionPrefix(opt),
                                        })
                                      }
                                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                        isAns
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                      }`}
                                    >
                                      {String.fromCharCode(65 + idx)}
                                    </button>
                                    <input
                                      type="text"
                                      value={stripOptionPrefix(opt)}
                                      onChange={(e) => {
                                        const nextOpts = [...(q.options || [])];
                                        nextOpts[idx] = e.target.value;
                                        const patch: Partial<Question> = { options: nextOpts };
                                        if (isAns) {
                                          patch.correctAnswer = e.target.value;
                                        }
                                        updateQuestion(section.id, q.id, patch);
                                      }}
                                      className="w-full bg-transparent text-sm text-slate-800 focus:outline-none"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {showAnswersInEditor && (
                            <div className="grid grid-cols-1 gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5 sm:grid-cols-2">
                              <div>
                                <label className="block text-[11px] font-bold text-emerald-800">
                                  {isEssayQuestion(q)
                                    ? 'Bài mẫu / Đáp án chuẩn'
                                    : 'Đáp án chuẩn (nhiều đáp án ngăn cách bởi | )'}
                                </label>
                                {isEssayQuestion(q) ? (
                                  <textarea
                                    rows={3}
                                    value={q.correctAnswer}
                                    onChange={(e) =>
                                      updateQuestion(section.id, q.id, {
                                        correctAnswer: e.target.value,
                                      })
                                    }
                                    className="mt-0.5 w-full rounded border border-emerald-200 bg-white px-2.5 py-1 text-xs text-emerald-900"
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    value={q.correctAnswer}
                                    onChange={(e) =>
                                      updateQuestion(section.id, q.id, {
                                        correctAnswer: e.target.value,
                                      })
                                    }
                                    className="mt-0.5 w-full rounded border border-emerald-200 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-900"
                                  />
                                )}
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600">
                                  {isEssayQuestion(q)
                                    ? 'Hướng dẫn giải / Thang điểm'
                                    : 'Giải thích cho học sinh'}
                                </label>
                                {isEssayQuestion(q) ? (
                                  <textarea
                                    rows={3}
                                    value={q.explanation}
                                    onChange={(e) =>
                                      updateQuestion(section.id, q.id, {
                                        explanation: e.target.value,
                                      })
                                    }
                                    className="mt-0.5 w-full rounded border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700"
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    value={q.explanation}
                                    onChange={(e) =>
                                      updateQuestion(section.id, q.id, {
                                        explanation: e.target.value,
                                      })
                                    }
                                    className="mt-0.5 w-full rounded border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700"
                                  />
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteQuestion(section.id, q.id)}
                          title="Xóa câu này"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Content: Online Quiz Links */}
      {activeTab === 'share' && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Gửi Link cho học sinh làm Online & Tự chấm điểm
              </h3>
              <p className="text-xs text-slate-500">
                Học sinh bấm link trên điện thoại/máy tính, nhập tên, làm bài và xem đáp án + giải thích ngay lập tức.
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                await onSave(draft);
                onPreviewQuiz(draft);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
            >
              <Eye className="h-4 w-4" /> Xem thử giao diện Học sinh
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Server / Google Sheet Short URL */}
            {(() => {
              const scriptUrl = resolveGoogleScriptUrl();
              const isConnected = serverOnline || Boolean(scriptUrl);
              const shortUrl = buildServerQuizUrl(draft.id, scriptUrl);
              return (
                <div
                  className={`rounded-xl border p-4 ${
                    isConnected
                      ? 'border-emerald-200 bg-emerald-50/50'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      Link Ngắn (Khuyên dùng gửi Zalo)
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        isConnected
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {scriptUrl
                        ? 'Google Sheet • Ngắn gọn'
                        : serverOnline
                          ? 'Đang kết nối • Ngắn gọn'
                          : 'Chưa nối Sheet/Server'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    {scriptUrl
                      ? 'Đề & điểm 100 học sinh tự động lưu vào Google Sheet của bạn. Link rất ngắn, copy gửi Zalo cực tiện.'
                      : serverOnline
                        ? 'Đang dùng máy chủ cục bộ. Muốn gửi cho học sinh ngoài mạng qua Zalo, hãy dán URL Google Apps Script trong Cài đặt hoặc chạy trên domain/VPS.'
                        : 'Vào Cài đặt (Thông tin giáo viên) dán Google Apps Script URL để lưu đề & thu điểm 100 học sinh vào Google Sheet miễn phí.'}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      readOnly
                      value={shortUrl}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => copyLink('server')}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      {copiedKey === 'server' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedKey === 'server' ? 'Đã copy' : 'Copy'}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Standalone Compressed Link */}
            {(() => {
              const standaloneUrl = buildStandaloneQuizUrl(draft);
              const isTooLongForZalo = standaloneUrl.length > 2000;
              return (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-indigo-950">
                      Link Độc Lập (Không cần server)
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        isTooLongForZalo
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {standaloneUrl.length.toLocaleString()} ký tự
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    {isTooLongForZalo
                      ? 'Đề nhiều câu nên link này khá dài, Zalo có thể cắt bớt khi gửi. Nếu dùng trên máy chủ/VPS hãy ưu tiên Link Ngắn bên cạnh.'
                      : 'Toàn bộ câu hỏi được gói sẵn trong đường link. Học sinh bấm vào làm và xem điểm ngay.'}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      readOnly
                      value={standaloneUrl}
                      className="w-full rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-xs text-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => copyLink('standalone')}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      {copiedKey === 'standalone' ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <ExternalLink className="h-3.5 w-3.5" />
                      )}
                      {copiedKey === 'standalone' ? 'Đã copy' : 'Copy'}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Tab Content: Student Submissions */}
      {activeTab === 'submissions' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Bảng điểm học sinh đã nộp</h3>
              <p className="text-xs text-slate-500">
                Hiển thị các bài nộp qua Link ngắn khi server đang chạy
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setLoadingSubs(true);
                fetchSubmissions(draft.id)
                  .then(setSubmissions)
                  .finally(() => setLoadingSubs(false));
              }}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Làm mới
            </button>
          </div>

          {loadingSubs ? (
            <p className="py-8 text-center text-sm text-slate-500">Đang tải danh sách...</p>
          ) : submissions.length === 0 ? (
            <div className="rounded-xl bg-slate-50 py-10 text-center text-sm text-slate-500">
              Chưa có học sinh nào nộp bài cho đề này.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase">
                    <th className="py-2 pr-4">Học sinh</th>
                    <th className="py-2 pr-4">Lớp</th>
                    <th className="py-2 pr-4">Điểm số</th>
                    <th className="py-2">Thời gian nộp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {submissions.map((sub) => (
                    <tr key={sub.id}>
                      <td className="py-2.5 pr-4 font-semibold text-slate-900">
                        {sub.studentName}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-600">{sub.studentClass || '—'}</td>
                      <td className="py-2.5 pr-4">
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                          {sub.score} / {sub.totalQuestions}
                        </span>
                      </td>
                      <td className="py-2.5 text-xs text-slate-500">
                        {new Date(sub.submittedAt).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

