import React from 'react';
import {
  Atom,
  BookMarked,
  BookOpenText,
  Calculator,
  Compass,
  FlaskConical,
  FolderHeart,
  Globe2,
  GraduationCap,
  Landmark,
  Languages,
  ScrollText,
  Settings,
  X,
} from 'lucide-react';
import { SUBJECT_LIST } from '../config/subjects';
import { SubjectId } from '../types';
import { BrandLogo } from './BrandLogo';

interface SidebarNavProps {
  activePage: 'generate' | 'library' | 'editor' | 'sources';
  activeSubject: SubjectId;
  homeworkCount: number;
  sourceCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onSelectSubject: (subject: SubjectId) => void;
  onOpenLibrary: () => void;
  onOpenSources: () => void;
  onOpenSettings: () => void;
}

const SUBJECT_ICONS: Record<SubjectId, React.ComponentType<{ className?: string }>> = {
  english: Languages,
  math: Calculator,
  physics: Atom,
  chemistry: FlaskConical,
  literature: BookOpenText,
  history: Landmark,
  geography: Globe2,
  higher_math: GraduationCap,
  philosophy_marx: Compass,
  party_history: ScrollText,
};

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activePage,
  activeSubject,
  homeworkCount,
  sourceCount,
  mobileOpen,
  onCloseMobile,
  onSelectSubject,
  onOpenLibrary,
  onOpenSources,
  onOpenSettings,
}) => {
  const navContent = (
    <div className="flex h-full flex-col bg-white border-r border-slate-200/90">
      {/* Brand */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
        <div
          onClick={() => {
            onSelectSubject(activeSubject);
            onCloseMobile();
          }}
          className="flex cursor-pointer items-center gap-2.5"
        >
          <BrandLogo className="h-9 w-9 shrink-0 rounded-xl shadow-xs" />
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-slate-900">
              EduLab Studio
            </div>
            <div className="truncate text-[11px] font-medium text-slate-500">
              Trợ lý soạn bài tập đa môn
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onCloseMobile}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
          aria-label="Đóng menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Subject List */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-2 px-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          Phổ thông (K-12)
        </div>

        <nav className="space-y-1">
          {SUBJECT_LIST.filter((s) => !['higher_math', 'philosophy_marx', 'party_history'].includes(s.id)).map((subject) => {
            const Icon = SUBJECT_ICONS[subject.id];
            const isActive = activePage === 'generate' && activeSubject === subject.id;
            return (
              <button
                key={subject.id}
                type="button"
                onClick={() => {
                  onSelectSubject(subject.id);
                  onCloseMobile();
                }}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-2xs ring-1 ring-indigo-200/80'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-slate-700 group-hover:shadow-2xs'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`truncate text-sm ${isActive ? 'font-bold' : 'font-semibold'}`}>
                    {subject.name}
                  </div>
                  <div className="truncate text-[11px] text-slate-400">
                    {subject.tagline}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="mt-5 mb-2 flex items-center justify-between px-2">
          <span className="text-[11px] font-bold tracking-wider text-purple-700 uppercase">
            Đại học &amp; Cao đẳng
          </span>
          <span className="rounded bg-purple-100 px-1.5 py-0.2 text-[10px] font-extrabold text-purple-800">
            Môn lõi
          </span>
        </div>

        <nav className="space-y-1">
          {SUBJECT_LIST.filter((s) => ['higher_math', 'philosophy_marx', 'party_history'].includes(s.id)).map((subject) => {
            const Icon = SUBJECT_ICONS[subject.id];
            const isActive = activePage === 'generate' && activeSubject === subject.id;
            return (
              <button
                key={subject.id}
                type="button"
                onClick={() => {
                  onSelectSubject(subject.id);
                  onCloseMobile();
                }}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                  isActive
                    ? 'bg-purple-50 text-purple-700 shadow-2xs ring-1 ring-purple-200/80'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-slate-700 group-hover:shadow-2xs'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`truncate text-sm ${isActive ? 'font-bold' : 'font-semibold'}`}>
                    {subject.name}
                  </div>
                  <div className="truncate text-[11px] text-slate-400">
                    {subject.tagline}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="mt-6 mb-2 px-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          Quản lý
        </div>

        <nav className="space-y-1">
          <button
            type="button"
            onClick={() => {
              onOpenLibrary();
              onCloseMobile();
            }}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition ${
              activePage === 'library' || activePage === 'editor'
                ? 'bg-indigo-50 font-bold text-indigo-700 ring-1 ring-indigo-200/80'
                : 'font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-3 text-sm">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  activePage === 'library' || activePage === 'editor'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <FolderHeart className="h-4 w-4" />
              </span>
              Kho bài tập
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                activePage === 'library' || activePage === 'editor'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {homeworkCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenSources();
              onCloseMobile();
            }}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition ${
              activePage === 'sources'
                ? 'bg-indigo-50 font-bold text-indigo-700 ring-1 ring-indigo-200/80'
                : 'font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-3 text-sm">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  activePage === 'sources'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <BookMarked className="h-4 w-4" />
              </span>
              Nguồn tham khảo
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                activePage === 'sources'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {sourceCount}
            </span>
          </button>
        </nav>
      </div>

      {/* Bottom Settings */}
      <div className="border-t border-slate-100 p-3">
        <button
          type="button"
          onClick={() => {
            onOpenSettings();
            onCloseMobile();
          }}
          className="flex w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          <Settings className="h-4 w-4 text-slate-500" />
          <span>Thông tin giáo viên & AI</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block lg:w-72">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};

