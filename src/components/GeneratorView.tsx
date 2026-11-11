import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  ClipboardCopy,
  FilePlus2,
  FileText,
  FileUp,
  Loader2,
  MessageSquare,
  RotateCcw,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';
import { generateHomeworkWithGemini } from '../services/gemini';
import {
  AppSettings,
  GeneratorConfig,
  Homework,
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
}

const DEFAULT_COUNTS_BY_LEVEL: Record<TargetLevel, SectionCountConfig> = {
  elementary: {
    multiple_choice: 5,
    fill_blank: 4,
    word_form: 0,
    sentence_order: 3,
    rewrite: 0,
    reading_questions: 0,
  },
  secondary: {
    multiple_choice: 6,
    fill_blank: 4,
    word_form: 3,
    sentence_order: 0,
    rewrite: 3,
    reading_questions: 4,
  },
  communication: {
    multiple_choice: 5,
    fill_blank: 5,
    word_form: 0,
    sentence_order: 3,
    rewrite: 2,
    reading_questions: 0,
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
}) => {
  const [readingFiles, setReadingFiles] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const totalQuestions = useMemo(() => {
    const c = config.counts;
    return (
      c.multiple_choice +
      c.fill_blank +
      c.word_form +
      c.sentence_order +
      c.rewrite +
      c.reading_questions
    );
  }, [config.counts]);

  const binaryFilesCount = useMemo(
    () => materials.filter((m) => m.kind === 'image' || m.kind === 'pdf').length,
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
    () => buildHomeworkPrompt(config, binaryFilesCount > 0, textDocuments),
    [config, binaryFilesCount, textDocuments]
  );

  const handleLevelChange = (level: TargetLevel) => {
    setConfig((prev) => ({
      ...prev,
      level,
      counts: { ...DEFAULT_COUNTS_BY_LEVEL[level] },
    }));
  };

  const applyPresetCounts = (preset: 'light' | 'standard' | 'full') => {
    if (preset === 'light') {
      setConfig((p) => ({
        ...p,
        counts: {
          multiple_choice: 5,
          fill_blank: 3,
          word_form: 0,
          sentence_order: 2,
          rewrite: 0,
          reading_questions: 0,
        },
      }));
    } else if (preset === 'standard') {
      setConfig((p) => ({
        ...p,
        counts: { ...DEFAULT_COUNTS_BY_LEVEL[p.level] },
      }));
    } else {
      setConfig((p) => ({
        ...p,
        counts: {
          multiple_choice: 6,
          fill_blank: 4,
          word_form: 3,
          sentence_order: 2,
          rewrite: 3,
          reading_questions: 4,
        },
      }));
    }
  };

  const updateCount = (key: keyof SectionCountConfig, delta: number) => {
    setConfig((prev) => ({
      ...prev,
      counts: {
        ...prev.counts,
        [key]: Math.max(0, Math.min(15, prev.counts[key] + delta)),
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

  const handleImportPasted = () => {
    setError('');
    if (!pastedResult.trim()) {
      setError('Hãy dán phần bài tập mà ChatGPT hoặc Gemini web trả về vào ô bên trên.');
      return;
    }
    try {
      const homework = parseAiHomeworkResponse(pastedResult, {
        level: config.level,
        gradeOrClass: config.gradeOrClass,
        teacherName: settings.teacherName,
        centerName: settings.centerName,
      });
      onCreated(homework);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không đọc được kết quả AI.');
    }
  };

  const questionTypesMeta: Array<{
    key: keyof SectionCountConfig;
    label: string;
    desc: string;
  }> = [
    { key: 'multiple_choice', label: 'Trắc nghiệm (A/B/C/D)', desc: 'Phù hợp mọi cấp, tự chấm nhanh' },
    { key: 'fill_blank', label: 'Điền từ vào chỗ trống', desc: 'Ôn từ vựng & cấu trúc câu' },
    { key: 'word_form', label: 'Chia động từ / Dạng từ', desc: 'Rất tốt cho THCS / THPT' },
    { key: 'sentence_order', label: 'Sắp xếp từ thành câu', desc: 'Rất hợp Tiểu học & Giao tiếp' },
    { key: 'rewrite', label: 'Viết lại câu', desc: 'Luyện biến đổi cấu trúc' },
    { key: 'reading_questions', label: 'Đọc hiểu + câu hỏi', desc: '1 đoạn văn ngắn kèm câu hỏi' },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Target Level */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-900">1. Chọn đối tượng học sinh</h2>
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              id: 'elementary' as TargetLevel,
              title: 'Tiểu học (Lớp 1–5)',
              desc: 'Câu ngắn, từ vựng gần gũi, sắp xếp câu & trắc nghiệm vui',
              icon: BookOpen,
            },
            {
              id: 'secondary' as TargetLevel,
              title: 'THCS / THPT (Lớp 6–12)',
              desc: 'Sát form đề trường: chia động từ, viết lại câu, đọc hiểu',
              icon: FilePlus2,
            },
            {
              id: 'communication' as TargetLevel,
              title: 'Giao tiếp / Trung tâm',
              desc: 'Hội thoại thực tế, mẫu câu tự nhiên, phản xạ tình huống',
              icon: MessageSquare,
            },
          ].map((item) => {
            const Icon = item.icon;
            const active = config.level === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleLevelChange(item.id)}
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
                  <div className="text-sm font-bold text-slate-900">{item.title}</div>
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
              Chủ đề / Unit / Bài học hôm nay *
            </label>
            <input
              type="text"
              value={config.topic}
              onChange={(e) => setConfig({ ...config, topic: e.target.value })}
              placeholder="VD: Unit 4 - Present Continuous & Weather vocabulary"
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
              placeholder="VD: Lớp 7A, Starters..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Ngữ pháp trọng tâm
            </label>
            <textarea
              rows={2}
              value={config.grammarFocus}
              onChange={(e) => setConfig({ ...config, grammarFocus: e.target.value })}
              placeholder="VD: S + am/is/are + V-ing; phân biệt với Hiện tại đơn..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Từ vựng cần ôn (nếu có)
            </label>
            <textarea
              rows={2}
              value={config.vocabularyFocus}
              onChange={(e) => setConfig({ ...config, vocabularyFocus: e.target.value })}
              placeholder="VD: sunny, rainy, coat, umbrella, play football..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Lỗi học sinh hay nhầm khi giảng trên lớp (AI sẽ bẫy nhẹ để luyện kỹ)
            </label>
            <input
              type="text"
              value={config.studentMistakes}
              onChange={(e) => setConfig({ ...config, studentMistakes: e.target.value })}
              placeholder="VD: Hay quên gấp đôi phụ âm (run -> running), hay thiếu động từ to be"
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

        {/* Lesson Materials Upload (Images, Word .docx, PDF, TXT) */}
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-slate-600">
              <strong className="text-slate-800">
                Tải tài liệu buổi học (Ảnh, Word .docx, PDF, TXT — tùy chọn):
              </strong>{' '}
              Tải lên file từ mới (New Words), tài liệu ngữ pháp hoặc ảnh chụp trang sách để ra bài sát nhất (tối đa 5 tệp).
            </div>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
              {readingFiles ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-600" /> Đang đọc tệp...
                </>
              ) : (
                <>
                  <FileUp className="h-4 w-4 text-indigo-600" /> Chọn tệp / ảnh
                </>
              )}
              <input
                type="file"
                accept="image/*,.pdf,.docx,.txt,.md,.csv"
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
              onClick={() => applyPresetCounts('full')}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Tổng hợp + Đọc hiểu (22 câu)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {questionTypesMeta.map((item) => {
            const count = config.counts[item.key];
            return (
              <div
                key={item.key}
                className={`flex items-center justify-between rounded-xl border p-3 ${
                  count > 0 ? 'border-indigo-200 bg-indigo-50/40' : 'border-slate-200 bg-slate-50/40'
                }`}
              >
                <div className="pr-2">
                  <div className="text-sm font-semibold text-slate-800">{item.label}</div>
                  <div className="text-[11px] text-slate-500">{item.desc}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateCount(item.key, -1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100"
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-slate-900">{count}</span>
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
  );
};

