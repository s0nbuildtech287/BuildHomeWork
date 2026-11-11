import React, { useMemo, useState } from 'react';
import { Copy, FileText, FolderOpen, Plus, Search, Trash2, Users } from 'lucide-react';
import { Homework, TargetLevel } from '../types';
import { countHomeworkQuestions } from '../utils/grading';

interface LibraryViewProps {
  homeworks: Homework[];
  submissionCounts: Record<string, number>;
  onOpenHomework: (hw: Homework) => void;
  onDuplicateHomework: (hw: Homework) => void;
  onDeleteHomework: (id: string) => void;
  onCreateNew: () => void;
}

const LEVEL_BADGES: Record<TargetLevel, { label: string; cls: string }> = {
  elementary: { label: 'Tiểu học', cls: 'bg-amber-100 text-amber-800' },
  secondary: { label: 'THCS / THPT', cls: 'bg-indigo-100 text-indigo-800' },
  communication: { label: 'Giao tiếp', cls: 'bg-emerald-100 text-emerald-800' },
};

export const LibraryView: React.FC<LibraryViewProps> = ({
  homeworks,
  submissionCounts,
  onOpenHomework,
  onDuplicateHomework,
  onDeleteHomework,
  onCreateNew,
}) => {
  const [query, setQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<TargetLevel | 'all'>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return homeworks.filter((hw) => {
      if (filterLevel !== 'all' && hw.level !== filterLevel) return false;
      if (!q) return true;
      return (
        hw.title.toLowerCase().includes(q) ||
        (hw.subtitle || '').toLowerCase().includes(q) ||
        hw.topicSummary.toLowerCase().includes(q) ||
        (hw.gradeOrClass || '').toLowerCase().includes(q)
      );
    });
  }, [homeworks, query, filterLevel]);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm bài tập theo chủ đề, lớp, ngữ pháp..."
            className="w-full rounded-xl border border-slate-200 py-2 pr-3 pl-9 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value as TargetLevel | 'all')}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
          >
            <option value="all">Tất cả cấp độ</option>
            <option value="elementary">Tiểu học</option>
            <option value="secondary">THCS / THPT</option>
            <option value="communication">Giao tiếp</option>
          </select>

          <button
            type="button"
            onClick={onCreateNew}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> Tạo bài mới
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-14 text-center">
          <FolderOpen className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Không tìm thấy bài tập nào phù hợp.
          </p>
          <button
            type="button"
            onClick={onCreateNew}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> Tạo bài tập mới bằng AI
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((hw) => {
            const badge = LEVEL_BADGES[hw.level];
            const count = countHomeworkQuestions(hw);
            const subCount = submissionCounts[hw.id] || 0;

            return (
              <div
                key={hw.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-indigo-300"
              >
                <div>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${badge.cls}`}>
                      {badge.label}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      {hw.gradeOrClass && (
                        <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                          {hw.gradeOrClass}
                        </span>
                      )}
                      <span>{count} câu</span>
                    </div>
                  </div>

                  <h3
                    onClick={() => onOpenHomework(hw)}
                    className="cursor-pointer text-base font-bold text-slate-900 hover:text-indigo-600"
                  >
                    {hw.title}
                  </h3>
                  {hw.subtitle && (
                    <p className="mt-1 text-xs text-slate-600 line-clamp-2">{hw.subtitle}</p>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{new Date(hw.updatedAt).toLocaleDateString('vi-VN')}</span>
                    {subCount > 0 && (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                        <Users className="h-3.5 w-3.5" /> {subCount} bài nộp
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onDuplicateHomework(hw)}
                      title="Nhân bản bài tập này"
                      className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Xóa bài tập "${hw.title}"?`)) {
                          onDeleteHomework(hw.id);
                        }
                      }}
                      title="Xóa bài tập"
                      className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenHomework(hw)}
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
                    >
                      <FileText className="h-3.5 w-3.5" /> Mở & Xuất bài
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

