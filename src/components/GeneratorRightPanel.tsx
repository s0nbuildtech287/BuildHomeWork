import React, { useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  FolderOpen,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  getSubjectDefinition,
  SUBJECT_TEMPLATES,
  SubjectTemplate,
} from '../config/subjects';
import { GeneratorConfig, Homework } from '../types';
import { countHomeworkQuestions } from '../utils/grading';

interface GeneratorRightPanelProps {
  config: GeneratorConfig;
  hasMaterials: boolean;
  totalQuestions: number;
  recentHomeworks: Homework[];
  onApplyTemplate: (template: SubjectTemplate) => void;
  onOpenHomework: (hw: Homework) => void;
}

const DIFFICULTY_TEXT: Record<GeneratorConfig['difficulty'], { label: string; cls: string }> = {
  easy: { label: 'Cơ bản', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  medium: { label: 'Chuẩn BTVN', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  hard: { label: 'Nâng cao', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
};

export const GeneratorRightPanel: React.FC<GeneratorRightPanelProps> = ({
  config,
  hasMaterials,
  totalQuestions,
  recentHomeworks,
  onApplyTemplate,
  onOpenHomework,
}) => {
  const subjectDef = useMemo(() => getSubjectDefinition(config.subject), [config.subject]);
  const templates = SUBJECT_TEMPLATES[subjectDef.id] || [];

  const activeItems = useMemo(() => {
    return subjectDef.questionOptions
      .map((opt) => ({
        key: opt.key,
        label: opt.label,
        count: config.counts[opt.key] || 0,
      }))
      .filter((item) => item.count > 0);
  }, [subjectDef, config.counts]);

  const estimatedMinutes = useMemo(() => {
    let mins = 0;
    for (const item of activeItems) {
      if (item.key === 'writing' || item.key === 'essay') {
        mins += item.count * 6;
      } else if (item.key === 'true_false_group') {
        mins += item.count * 3;
      } else if (item.key === 'listening_questions' || item.key === 'reading_questions') {
        mins += item.count * 2;
      } else {
        mins += item.count * 1.2;
      }
    }
    return Math.max(5, Math.round(mins));
  }, [activeItems]);

  const subjectRecent = useMemo(
    () =>
      recentHomeworks
        .filter((hw) => (hw.subject || 'english') === subjectDef.id)
        .slice(0, 3),
    [recentHomeworks, subjectDef.id]
  );

  const hasTopicOrMaterial =
    Boolean(config.topic.trim()) ||
    Boolean(config.grammarFocus.trim()) ||
    Boolean(config.vocabularyFocus.trim()) ||
    hasMaterials;

  const hasQuestions = totalQuestions > 0 || Boolean(config.extraInstructions?.trim());
  const diff = DIFFICULTY_TEXT[config.difficulty];

  return (
    <aside className="space-y-4 xl:sticky xl:top-20">
      {/* 1. Live Blueprint Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Khung đề dự kiến</h3>
              <p className="text-[11px] text-slate-500">Cập nhật theo cấu hình đang chọn</p>
            </div>
          </div>
          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${diff.cls}`}>
            {diff.label}
          </span>
        </div>

        {/* Summary Stats */}
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <div className="rounded-xl bg-slate-50 p-2.5">
            <div className="text-[11px] font-medium text-slate-500">Tổng số câu</div>
            <div className="mt-0.5 text-lg font-extrabold text-slate-900">
              {totalQuestions}{' '}
              <span className="text-xs font-semibold text-slate-500">câu</span>
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 p-2.5">
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
              <Clock className="h-3 w-3" /> Thời lượng
            </div>
            <div className="mt-0.5 text-lg font-extrabold text-slate-900">
              ~{estimatedMinutes}{' '}
              <span className="text-xs font-semibold text-slate-500">phút</span>
            </div>
          </div>
        </div>

        {/* Section Breakdown */}
        <div className="mt-3 space-y-2">
          {activeItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-3 text-center text-xs text-slate-400">
              Chưa chọn dạng bài nào
            </div>
          ) : (
            activeItems.map((item) => {
              const pct =
                totalQuestions > 0 ? Math.round((item.count / totalQuestions) * 100) : 0;
              return (
                <div key={item.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate pr-2 font-medium text-slate-700">
                      {item.label}
                    </span>
                    <span className="shrink-0 font-bold text-slate-900">
                      {item.count} câu
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all"
                      style={{ width: `${Math.max(8, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Readiness Checklist */}
        <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs">
          <div className="flex items-center gap-2">
            {hasTopicOrMaterial ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-slate-300" />
            )}
            <span className={hasTopicOrMaterial ? 'font-medium text-slate-700' : 'text-slate-400'}>
              Đã có chủ đề hoặc tài liệu bài học
            </span>
          </div>
          <div className="flex items-center gap-2">
            {hasQuestions ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-slate-300" />
            )}
            <span className={hasQuestions ? 'font-medium text-slate-700' : 'text-slate-400'}>
              Đã chọn cấu trúc câu hỏi ({totalQuestions} câu)
            </span>
          </div>
        </div>
      </div>

      {/* 2. Quick Templates Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Gợi ý nhanh {subjectDef.shortName}</h3>
            <p className="text-[11px] text-slate-500">Bấm để điền mẫu bài học tức thì</p>
          </div>
        </div>

        <div className="space-y-2">
          {templates.map((tpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onApplyTemplate(tpl)}
              className="group w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-left transition hover:border-indigo-300 hover:bg-indigo-50/50"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">
                  {tpl.label}
                </span>
                <span className="shrink-0 rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200">
                  {tpl.gradeOrClass}
                </span>
              </div>
              <p className="mt-1 line-clamp-1 text-[11px] text-slate-500">{tpl.topic}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Recent Homeworks for this Subject */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Đề {subjectDef.shortName} gần đây
              </h3>
              <p className="text-[11px] text-slate-500">Mở lại nhanh để sửa hoặc giao</p>
            </div>
          </div>
        </div>

        {subjectRecent.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-5 text-center">
            <FolderOpen className="mx-auto h-6 w-6 text-slate-300" />
            <p className="mt-1 text-[11px] text-slate-400">
              Chưa có đề {subjectDef.shortName} nào được lưu.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {subjectRecent.map((hw) => (
              <button
                key={hw.id}
                type="button"
                onClick={() => onOpenHomework(hw)}
                className="flex w-full items-start gap-2.5 rounded-xl border border-slate-200 p-2.5 text-left transition hover:border-indigo-300 hover:bg-slate-50"
              >
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-bold text-slate-800">{hw.title}</div>
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    {countHomeworkQuestions(hw)} câu •{' '}
                    {new Date(hw.updatedAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};

