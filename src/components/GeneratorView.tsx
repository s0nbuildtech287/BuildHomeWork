import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronDown,
  ClipboardCopy,
  FilePlus2,
  FileText,
  FileUp,
  Headphones,
  Loader2,
  MessageSquare,
  RotateCcw,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';
import { createEmptyCounts, getSubjectDefinition, SubjectTemplate } from '../config/subjects';
import { GeneratorRightPanel } from './GeneratorRightPanel';
import { VocabQuizModal } from './VocabQuizModal';
import { attachAudioToListeningSections, generateHomeworkWithGemini } from '../services/gemini';
import {
  AppSettings,
  GeneratorConfig,
  Homework,
  ListeningStyle,
  SectionCountConfig,
  TargetLevel,
} from '../types';
import { AttachedMaterial, extractAttachedMaterial } from '../utils/fileExtractor';
import { buildHomeworkPrompt, parseAiHomeworkResponse } from '../utils/promptBuilder';

interface GeneratorViewProps {
  settings: AppSettings;
  hasServerGeminiKey: boolean;
  config: GeneratorConfig;
  onChangeConfig: React.Dispatch<React.SetStateAction<GeneratorConfig>>;
  aiMode: 'gemini' | 'manual_prompt';
  onChangeAiMode: React.Dispatch<React.SetStateAction<'gemini' | 'manual_prompt'>>;
  materials: AttachedMaterial[];
  onChangeMaterials: React.Dispatch<React.SetStateAction<AttachedMaterial[]>>;
  pastedResult: string;
  onChangePastedResult: React.Dispatch<React.SetStateAction<string>>;
  onResetForm: () => void;
  onCreated: (homework: Homework) => void;
  onOpenSettings: () => void;
  recentHomeworks?: Homework[];
  onOpenHomework?: (homework: Homework) => void;
}

const DEFAULT_COUNTS_BY_LEVEL: Record<TargetLevel, SectionCountConfig> = {
  elementary: {
    ...createEmptyCounts(),
    multiple_choice: 5,
    fill_blank: 4,
    sentence_order: 3,
  },
  secondary: {
    ...createEmptyCounts(),
    multiple_choice: 6,
    fill_blank: 4,
    word_form: 3,
    rewrite: 3,
    reading_questions: 4,
  },
  communication: {
    ...createEmptyCounts(),
    multiple_choice: 5,
    fill_blank: 5,
    sentence_order: 3,
    rewrite: 2,
  },
};

export const GeneratorView: React.FC<GeneratorViewProps> = ({
  settings,
  hasServerGeminiKey,
  config,
  onChangeConfig: setConfig,
  aiMode,
  onChangeAiMode: setAiMode,
  materials,
  onChangeMaterials: setMaterials,
  pastedResult,
  onChangePastedResult: setPastedResult,
  onResetForm,
  onCreated,
  onOpenSettings,
  recentHomeworks = [],
  onOpenHomework,
}) => {
  const [readingFiles, setReadingFiles] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showVocabModal, setShowVocabModal] = useState(false);
  const [listeningMenuOpen, setListeningMenuOpen] = useState(false);
  const subjectDef = useMemo(() => getSubjectDefinition(config.subject), [config.subject]);

  const listeningStyleOptions: Array<{ value: ListeningStyle; short: string; label: string }> = [
    { value: 'multiple_choice', short: 'Khoanh A/B/C/D', label: 'Khoanh trắc nghiệm A/B/C/D' },
    {
      value: 'note_fill',
      short: 'Điền từ / Điền phiếu',
      label: 'Điền từ / Điền phiếu (không cho đáp án)',
    },
    { value: 'matching_box', short: 'Nối bảng A–G', label: 'Nối bảng lựa chọn A–G' },
    { value: 'true_false', short: 'Đúng / Sai', label: 'Đúng / Sai (True / False)' },
  ];
  const currentListeningStyle =
    listeningStyleOptions.find((o) => o.value === (config.listeningStyle || 'multiple_choice')) ||
    listeningStyleOptions[0];

  const totalQuestions = useMemo(() => {
    return subjectDef.questionOptions.reduce(
      (sum, opt) => sum + (config.counts[opt.key] || 0),
      0
    );
  }, [config.counts, subjectDef]);

  const binaryFilesCount = useMemo(
    () =>
      materials.filter(
        (m) => m.kind === 'image' || m.kind === 'pdf' || m.kind === 'audio'
      ).length,
    [materials]
  );

  const hasAttachedAudio = useMemo(
    () => materials.some((m) => m.kind === 'audio'),
    [materials]
  );

  const textDocuments = useMemo(
    () =>
      materials
        .filter((m): m is Extract<AttachedMaterial, { kind: 'text' }> => m.kind === 'text')
        .map((m) => ({ name: m.name, content: m.content })),
    [materials]
  );

  const generatedPrompt = useMemo(
    () =>
      buildHomeworkPrompt(config, binaryFilesCount > 0, textDocuments, hasAttachedAudio),
    [config, binaryFilesCount, textDocuments, hasAttachedAudio]
  );

  const handleLevelChange = (level: TargetLevel) => {
    if ((config.subject || 'english') === 'english') {
      setConfig((prev) => ({
        ...prev,
        level,
        counts: { ...DEFAULT_COUNTS_BY_LEVEL[level] },
      }));
    } else {
      setConfig((prev) => ({ ...prev, level }));
    }
  };

  const applyPresetCounts = (
    preset: 'light' | 'standard' | 'medium30' | 'exam50' | 'gs40'
  ) => {
    if ((config.subject || 'english') !== 'english') {
      const base = { ...createEmptyCounts(), ...subjectDef.defaultCounts };
      if (preset === 'standard' || preset === 'gs40') {
        setConfig((p) => ({ ...p, counts: base }));
        return;
      }
      const factor = preset === 'light' ? 0.65 : preset === 'medium30' ? 2 : 3.2;
      const scaled = createEmptyCounts();
      for (const opt of subjectDef.questionOptions) {
        const val = base[opt.key] || 0;
        scaled[opt.key] = val > 0 ? Math.max(1, Math.round(val * factor)) : 0;
      }
      setConfig((p) => ({ ...p, counts: scaled }));
      return;
    }

    if (preset === 'gs40') {
      setConfig((p) => ({
        ...p,
        level: 'secondary',
        counts: {
          ...createEmptyCounts(),
          pronunciation_stress: 4,
          multiple_choice: 8,
          announcement_cloze: 4,
          paragraph_order: 2,
          guided_cloze: 6,
          sentence_transform_mcq: 4,
          sign_notice: 2,
          reading_questions: 6,
          removed_sentences: 4,
        },
      }));
      return;
    }

    if (preset === 'light') {
      setConfig((p) => ({
        ...p,
        counts: {
          ...createEmptyCounts(),
          multiple_choice: 5,
          fill_blank: 3,
          sentence_order: 2,
        },
      }));
    } else if (preset === 'standard') {
      setConfig((p) => ({
        ...p,
        counts: { ...DEFAULT_COUNTS_BY_LEVEL[p.level] },
      }));
    } else if (preset === 'medium30') {
      setConfig((p) => ({
        ...p,
        counts: {
          ...createEmptyCounts(),
          multiple_choice: 10,
          fill_blank: 5,
          word_form: 4,
          rewrite: 3,
          reading_questions: 5,
          find_mistake: 3,
        },
      }));
    } else {
      setConfig((p) => ({
        ...p,
        counts: {
          ...createEmptyCounts(),
          multiple_choice: 20,
          fill_blank: 6,
          word_form: 5,
          rewrite: 5,
          reading_questions: 8,
          find_mistake: 6,
        },
      }));
    }
  };

  const setExactCount = (key: keyof SectionCountConfig, value: number) => {
    const safeVal = Number.isNaN(value) ? 0 : Math.max(0, Math.min(50, Math.floor(value)));
    setConfig((prev) => ({
      ...prev,
      counts: {
        ...prev.counts,
        [key]: safeVal,
      },
    }));
  };

  const updateCount = (key: keyof SectionCountConfig, delta: number) => {
    setConfig((prev) => ({
      ...prev,
      counts: {
        ...prev.counts,
        [key]: Math.max(0, Math.min(50, prev.counts[key] + delta)),
      },
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setError('');
    setReadingFiles(true);
    const nextMaterials: AttachedMaterial[] = [];

    try {
      for (const file of files.slice(0, Math.max(0, 5 - materials.length))) {
        const extracted = await extractAttachedMaterial(file);
        nextMaterials.push(extracted);
      }
      setMaterials((prev) => [...prev, ...nextMaterials].slice(0, 5));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không đọc được tệp vừa tải lên.');
    } finally {
      setReadingFiles(false);
      e.target.value = '';
    }
  };

  const handleGenerateGemini = async () => {
    setError('');
    if (
      !config.topic.trim() &&
      !config.grammarFocus.trim() &&
      !config.vocabularyFocus.trim() &&
      materials.length === 0
    ) {
      setError('Bạn hãy nhập tên bài học / ngữ pháp hôm nay hoặc tải lên tài liệu / ảnh bài học nhé.');
      return;
    }
    if (totalQuestions === 0 && !config.extraInstructions?.trim()) {
      setError('Hãy chọn ít nhất 1 dạng câu hỏi hoặc nhập yêu cầu thêm bên dưới để tạo bài.');
      return;
    }
    if (!settings.geminiApiKey.trim() && !hasServerGeminiKey) {
      setError('Hệ thống tạo bài tự động chưa được kết nối. Bạn có thể chuyển sang "Cách 2: Dùng qua ChatGPT / Gemini web" ngay bên cạnh.');
      return;
    }

    setLoading(true);
    try {
      const homework = await generateHomeworkWithGemini({
        apiKey: settings.geminiApiKey,
        model: settings.geminiModel,
        config,
        materials,
        teacherName: settings.teacherName,
        centerName: settings.centerName,
      });
      onCreated(homework);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi khi tạo bài tập tự động.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(generatedPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleImportPasted = async () => {
    setError('');
    if (!pastedResult.trim()) {
      setError('Hãy dán phần bài tập mà ChatGPT hoặc Gemini web trả về vào ô bên trên.');
      return;
    }
    setLoading(true);
    try {
      const homework = parseAiHomeworkResponse(pastedResult, {
        subject: config.subject,
        level: config.level,
        gradeOrClass: config.gradeOrClass,
        teacherName: settings.teacherName,
        centerName: settings.centerName,
      });
      const audioFiles = materials.filter(
        (m): m is Extract<AttachedMaterial, { kind: 'audio' }> => m.kind === 'audio'
      );
      await attachAudioToListeningSections(homework, config.level, audioFiles);
      onCreated(homework);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không đọc được kết quả AI.');
    } finally {
      setLoading(false);
    }
  };

  const levelIcons = [BookOpen, FilePlus2, MessageSquare];

  const handleApplyTemplate = (tpl: SubjectTemplate) => {
    setError('');
    setConfig((prev) => ({
      ...prev,
      gradeOrClass: tpl.gradeOrClass,
      topic: tpl.topic,
      grammarFocus: tpl.grammarFocus,
      vocabularyFocus: tpl.vocabularyFocus,
    }));
  };

  return (
    <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 space-y-5">
      {/* Subject Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-xs">
        <div className="flex items-center gap-3">
          <span className={`rounded-xl px-3 py-1.5 text-xs font-bold ${subjectDef.badgeClass}`}>
            Môn {subjectDef.name}
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Soạn bài tập & đề kiểm tra {subjectDef.name}
            </h2>
            <p className="text-xs text-slate-500">{subjectDef.tagline}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setError('');
            onResetForm();
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Xóa để nhập bài mới
        </button>
      </div>

      {/* Target Level */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-900">1. Chọn cấp học / đối tượng</h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {subjectDef.levels.map((item, idx) => {
            const Icon = levelIcons[idx % levelIcons.length];
            const active = config.level === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => handleLevelChange(item.value)}
                className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition ${
                  active
                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-100'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">{item.label}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{item.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lesson Input */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="mb-3 text-base font-bold text-slate-900">
          2. Hôm nay bạn vừa dạy bài gì?
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Chủ đề / Chương / Bài học hôm nay *
            </label>
            <input
              type="text"
              value={config.topic}
              onChange={(e) => setConfig({ ...config, topic: e.target.value })}
              placeholder={subjectDef.topicPlaceholder}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Lớp / Nhóm học sinh
            </label>
            <input
              type="text"
              value={config.gradeOrClass}
              onChange={(e) => setConfig({ ...config, gradeOrClass: e.target.value })}
              placeholder={`VD: ${subjectDef.defaultGrade}...`}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              {subjectDef.focus1Label}
            </label>
            <textarea
              rows={2}
              value={config.grammarFocus}
              onChange={(e) => setConfig({ ...config, grammarFocus: e.target.value })}
              placeholder={subjectDef.focus1Placeholder}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              {subjectDef.focus2Label}
            </label>
            <textarea
              rows={2}
              value={config.vocabularyFocus}
              onChange={(e) => setConfig({ ...config, vocabularyFocus: e.target.value })}
              placeholder={subjectDef.focus2Placeholder}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              {subjectDef.mistakesLabel}
            </label>
            <input
              type="text"
              value={config.studentMistakes}
              onChange={(e) => setConfig({ ...config, studentMistakes: e.target.value })}
              placeholder={subjectDef.mistakesPlaceholder}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Độ khó</label>
            <select
              value={config.difficulty}
              onChange={(e) =>
                setConfig({
                  ...config,
                  difficulty: e.target.value as GeneratorConfig['difficulty'],
                })
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
            >
              <option value="easy">Nhẹ nhàng (Cơ bản)</option>
              <option value="medium">Chuẩn bài tập về nhà</option>
              <option value="hard">Nâng cao / Phân hóa</option>
            </select>
          </div>
        </div>

        {subjectDef.supportsStemOptions && (
          <div className="mt-3 flex flex-wrap gap-4 rounded-xl border border-blue-100 bg-blue-50/50 px-3.5 py-2.5 text-xs text-slate-700">
            <label className="inline-flex cursor-pointer items-center gap-2 font-medium">
              <input
                type="checkbox"
                checked={config.useLatexFormulas !== false}
                onChange={(e) =>
                  setConfig({ ...config, useLatexFormulas: e.target.checked })
                }
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Hiển thị công thức Toán / Lý / Hóa đẹp mắt (x², a/b, H₂SO₄)
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2 font-medium">
              <input
                type="checkbox"
                checked={config.includeStepByStep !== false}
                onChange={(e) =>
                  setConfig({ ...config, includeStepByStep: e.target.checked })
                }
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Kèm lời giải chi tiết từng bước trong đáp án
            </label>
          </div>
        )}

        {/* Lesson Materials Upload (Images, Word .docx, PDF, TXT, Audio MP3) */}
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-slate-600">
              <strong className="text-slate-800">
                Tải tài liệu buổi học (Ảnh, Word .docx, PDF, TXT, Âm thanh MP3 — tùy chọn):
              </strong>{' '}
              Tải file từ mới, ngữ pháp, ảnh trang sách hoặc file nghe MP3 có sẵn để hệ thống soạn đề bám sát bài (tối đa 5 tệp).
            </div>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
              {readingFiles ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-600" /> Đang đọc tệp...
                </>
              ) : (
                <>
                  <FileUp className="h-4 w-4 text-indigo-600" /> Chọn tệp / ảnh / MP3
                </>
              )}
              <input
                type="file"
                accept="image/*,audio/*,.mp3,.wav,.m4a,.ogg,.pdf,.docx,.txt,.md,.csv"
                multiple
                disabled={readingFiles || materials.length >= 5}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {materials.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {materials.map((item) => {
                if (item.kind === 'image') {
                  return (
                    <div
                      key={item.id}
                      className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-1"
                    >
                      <img
                        src={item.previewUrl}
                        alt={item.name}
                        className="h-20 w-24 rounded object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setMaterials((prev) => prev.filter((m) => m.id !== item.id))
                        }
                        className="absolute top-1.5 right-1.5 rounded-full bg-slate-900/70 p-1 text-white hover:bg-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  );
                }

                if (item.kind === 'audio') {
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col gap-1.5 rounded-xl border border-indigo-200 bg-white p-2.5 text-xs shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-semibold text-indigo-900">
                          <Headphones className="h-4 w-4 text-indigo-600" />
                          <span className="max-w-[180px] truncate" title={item.name}>
                            {item.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setMaterials((prev) => prev.filter((m) => m.id !== item.id))
                          }
                          className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <audio controls src={item.previewUrl} className="h-8 w-56" />
                    </div>
                  );
                }

                const isPdf = item.kind === 'pdf';
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-2xs"
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold ${
                        isPdf
                          ? 'bg-rose-50 text-rose-600'
                          : 'bg-blue-50 text-blue-600'
                      }`}
                    >
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="max-w-[180px]">
                      <div className="truncate font-semibold text-slate-800" title={item.name}>
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {isPdf
                          ? `PDF • ${(item.sizeBytes / 1024).toFixed(0)} KB`
                          : `Đã đọc ${item.content.length.toLocaleString('vi-VN')} ký tự`}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setMaterials((prev) => prev.filter((m) => m.id !== item.id))
                      }
                      className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {binaryFilesCount > 0 && aiMode === 'manual_prompt' && (
            <p className="mt-2 text-[11px] text-amber-700">
              Lưu ý: File Word (.docx) và file chữ đã được ghép tự động vào yêu cầu bên dưới; riêng file Ảnh hoặc PDF bạn nhớ đính kèm thêm khi dán vào ChatGPT / Gemini web (hoặc dùng Cách 1 để hệ thống tự đọc luôn).
            </p>
          )}
        </div>
      </div>

      {/* Exercise Types & Counts */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              3. Chọn dạng bài & số câu ({totalQuestions} câu)
            </h2>
            <p className="text-xs text-slate-500">
              Chọn mẫu nhanh hoặc tùy chỉnh từng phần
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => applyPresetCounts('light')}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Nhẹ nhàng (10 câu)
            </button>
            <button
              type="button"
              onClick={() => applyPresetCounts('standard')}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Chuẩn theo cấp học
            </button>
            <button
              type="button"
              onClick={() => applyPresetCounts('medium30')}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Tổng hợp (30 câu)
            </button>
            <button
              type="button"
              onClick={() => applyPresetCounts('exam50')}
              className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              Đề thi chuẩn (50 câu)
            </button>
            {(config.subject || 'english') === 'english' && (
              <>
                <button
                  type="button"
                  onClick={() => setShowVocabModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 shadow-2xs hover:bg-purple-100"
                >
                  <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                  Kiểm tra từ vựng (Dán bảng YourHomework)
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetCounts('gs40')}
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                >
                  Form Vào 10 / GS (40 câu)
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {subjectDef.questionOptions.map((item) => {
            const count = config.counts[item.key] || 0;
            const isListeningCard = item.key === 'listening_questions';

            return (
              <div
                key={item.key}
                className={`relative flex items-center justify-between rounded-xl border p-3 ${
                  count > 0 ? 'border-indigo-200 bg-indigo-50/40' : 'border-slate-200 bg-slate-50/40'
                }`}
              >
                <div className="pr-2 min-w-0">
                  <div className="text-sm font-semibold text-slate-800">{item.label}</div>
                  {isListeningCard ? (
                    <div className="relative mt-0.5 inline-block">
                      <button
                        type="button"
                        onClick={() => setListeningMenuOpen((v) => !v)}
                        className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-50"
                      >
                        <span>Kiểu: {currentListeningStyle.short}</span>
                        <ChevronDown className="h-3 w-3" />
                      </button>

                      {listeningMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setListeningMenuOpen(false)}
                          />
                          <div className="absolute top-full left-0 z-20 mt-1.5 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                            {listeningStyleOptions.map((opt) => {
                              const active = opt.value === currentListeningStyle.value;
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => {
                                    setConfig((prev) => ({
                                      ...prev,
                                      listeningStyle: opt.value,
                                    }));
                                    setListeningMenuOpen(false);
                                  }}
                                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition ${
                                    active
                                      ? 'bg-indigo-50 font-bold text-indigo-700'
                                      : 'text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <span>{opt.label}</span>
                                  {active && <Check className="h-3.5 w-3.5 text-indigo-600" />}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500">{item.desc}</div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateCount(item.key, -1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={count}
                    onChange={(e) => setExactCount(item.key, Number(e.target.value))}
                    className="w-11 rounded-lg border border-slate-200 bg-white py-1 text-center text-sm font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => updateCount(item.key, 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Yêu cầu thêm hoặc dạng bài khác (tùy chọn — viết tự nhiên bằng lời)
          </label>
          <textarea
            rows={2}
            value={config.extraInstructions || ''}
            onChange={(e) => setConfig({ ...config, extraInstructions: e.target.value })}
            placeholder="VD: Thêm 5 câu tìm từ khác loại (Odd one out), 4 câu tìm lỗi sai, hoặc 5 câu dịch Việt - Anh ngắn; ưu tiên câu gần gũi với học sinh..."
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
          />
        </div>
      </div>

      {/* Generation Mode */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
          <button
            type="button"
            onClick={() => setAiMode('gemini')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              aiMode === 'gemini'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="h-4 w-4" /> Cách 1: Tạo bài tự động ngay tại đây
          </button>
          <button
            type="button"
            onClick={() => setAiMode('manual_prompt')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              aiMode === 'manual_prompt'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Wand2 className="h-4 w-4" /> Cách 2: Tạo qua ChatGPT / Gemini web
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {aiMode === 'gemini' ? (
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="text-sm text-slate-600">
              {settings.geminiApiKey || hasServerGeminiKey ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
                  <Check className="h-4 w-4" /> Trợ lý soạn bài tự động đã sẵn sàng
                </span>
              ) : (
                <div>
                  <span className="font-medium text-amber-700">
                    Chưa bật chế độ tạo tự động.
                  </span>{' '}
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="font-semibold text-indigo-600 underline"
                  >
                    Thiết lập nhanh
                  </button>{' '}
                  hoặc dùng <strong>Cách 2</strong> bên cạnh.
                </div>
              )}
              <p className="mt-1 text-xs text-slate-500">
                Hệ thống sẽ tự soạn đề, đáp án và giải thích tiếng Việt để bạn tải file Word, in PDF hoặc gửi link cho học sinh làm online.
              </p>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleGenerateGemini}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Đang soạn bài tập...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Tạo Bài Tập Ngay
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-3.5">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700">
                  Bước 1: Sao chép yêu cầu dưới đây, mở ChatGPT hoặc Gemini trên web rồi dán vào gửi
                </span>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  {copiedPrompt ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" /> Đã sao chép!
                    </>
                  ) : (
                    <>
                      <ClipboardCopy className="h-3.5 w-3.5" /> Sao chép yêu cầu
                    </>
                  )}
                </button>
              </div>
              <pre className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 text-xs whitespace-pre-wrap text-slate-600">
                {generatedPrompt}
              </pre>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Bước 2: Sao chép toàn bộ câu trả lời từ ChatGPT / Gemini dán vào ô này
              </label>
              <textarea
                rows={5}
                value={pastedResult}
                onChange={(e) => setPastedResult(e.target.value)}
                placeholder='Dán toàn bộ kết quả mà ChatGPT hoặc Gemini vừa trả lời vào đây...'
                className="w-full rounded-xl border border-slate-300 p-3 text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleImportPasted}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  <Wand2 className="h-4 w-4" /> Tạo Đề Từ Kết Quả Này
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>

      <GeneratorRightPanel
        config={config}
        hasMaterials={materials.length > 0}
        totalQuestions={totalQuestions}
        recentHomeworks={recentHomeworks}
        onApplyTemplate={handleApplyTemplate}
        onOpenHomework={(hw) => onOpenHomework?.(hw)}
      />

      <VocabQuizModal
        isOpen={showVocabModal}
        onClose={() => setShowVocabModal(false)}
        onApply={({ vocabularyFocus, topicName, counts }) => {
          setConfig((prev) => ({
            ...prev,
            topic: topicName ? `Kiểm tra từ vựng - ${topicName}` : prev.topic || 'Kiểm tra từ vựng',
            vocabularyFocus,
            counts: {
              ...createEmptyCounts(),
              ...counts,
            },
          }));
        }}
      />
    </div>
  );
};

