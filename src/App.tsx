import { useEffect, useState } from 'react';
import { FolderHeart, GraduationCap, Settings, Sparkles } from 'lucide-react';
import { GeneratorView } from './components/GeneratorView';
import { HomeworkEditor } from './components/HomeworkEditor';
import { LibraryView } from './components/LibraryView';
import { OnlineQuizView } from './components/OnlineQuizView';
import { PrintWorksheet } from './components/PrintWorksheet';
import { SettingsModal } from './components/SettingsModal';
import {
  fetchHomeworks,
  loadSettings,
  removeHomework,
  saveSettings,
  upsertHomework,
} from './services/storage';
import { AppSettings, Homework } from './types';
import { createId } from './utils/promptBuilder';

type TeacherPage = 'generate' | 'library' | 'editor' | 'print' | 'previewQuiz';

function parseQuizHashRoute(): { quizId?: string; encodedData?: string } | null {
  const hash = window.location.hash || '';
  if (!hash.startsWith('#/quiz')) return null;

  const queryIdx = hash.indexOf('?');
  if (queryIdx >= 0) {
    const params = new URLSearchParams(hash.slice(queryIdx + 1));
    const data = params.get('data');
    if (data) return { encodedData: data };
  }

  const match = hash.match(/^#\/quiz\/([^?]+)/);
  if (match && match[1]) {
    return { quizId: decodeURIComponent(match[1]) };
  }

  return null;
}

export function App() {
  const [quizRoute, setQuizRoute] = useState<{ quizId?: string; encodedData?: string } | null>(() =>
    parseQuizHashRoute()
  );

  const [page, setPage] = useState<TeacherPage>('generate');
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [showSettings, setShowSettings] = useState(false);

  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({});
  const [serverOnline, setServerOnline] = useState(false);
  const [hasServerGeminiKey, setHasServerGeminiKey] = useState(false);

  const [activeHomework, setActiveHomework] = useState<Homework | null>(null);

  useEffect(() => {
    const onHashChange = () => setQuizRoute(parseQuizHashRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const refreshLibrary = async () => {
    const res = await fetchHomeworks();
    setHomeworks(res.homeworks);
    setSubmissionCounts(res.submissionCounts);
    setServerOnline(res.serverOnline);
  };

  useEffect(() => {
    if (quizRoute) return;
    refreshLibrary();
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => {
        if (data?.hasServerGeminiKey) setHasServerGeminiKey(true);
      })
      .catch(() => null);
  }, [quizRoute]);

  // Student Quiz Standalone / Link View
  if (quizRoute) {
    return (
      <OnlineQuizView
        quizId={quizRoute.quizId}
        encodedData={quizRoute.encodedData}
      />
    );
  }

  // Teacher Previewing Student Quiz
  if (page === 'previewQuiz' && activeHomework) {
    return (
      <OnlineQuizView
        previewHomework={activeHomework}
        onExitPreview={() => setPage('editor')}
      />
    );
  }

  // Teacher Print / PDF View
  if (page === 'print' && activeHomework) {
    return (
      <PrintWorksheet
        homework={activeHomework}
        onBack={() => setPage('editor')}
      />
    );
  }

  const handleCreatedHomework = async (hw: Homework) => {
    const saved = await upsertHomework(hw);
    setActiveHomework(saved);
    await refreshLibrary();
    setPage('editor');
  };

  const handleSaveEditor = async (updated: Homework) => {
    const saved = await upsertHomework(updated);
    setActiveHomework(saved);
    await refreshLibrary();
  };

  const handleDuplicate = async (hw: Homework) => {
    const now = new Date().toISOString();
    const copy: Homework = {
      ...hw,
      id: createId('hw'),
      title: `${hw.title} (Bản sao)`,
      createdAt: now,
      updatedAt: now,
    };
    const saved = await upsertHomework(copy);
    await refreshLibrary();
    setActiveHomework(saved);
    setPage('editor');
  };

  const handleDelete = async (id: string) => {
    await removeHomework(id);
    if (activeHomework?.id === id) setActiveHomework(null);
    await refreshLibrary();
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div
            onClick={() => setPage('generate')}
            className="flex cursor-pointer items-center gap-2.5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                Trợ Lý Giao Bài Tập Tiếng Anh
              </h1>
              <p className="text-[11px] text-slate-500">
                Tạo đề bằng AI • Xuất Word / PDF • Link làm bài tự chấm
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage('generate')}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                page === 'generate'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="h-4 w-4" /> Tạo bài mới
            </button>

            <button
              type="button"
              onClick={() => {
                refreshLibrary();
                setPage('library');
              }}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                page === 'library' || page === 'editor'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FolderHeart className="h-4 w-4" /> Kho bài tập ({homeworks.length})
            </button>

            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Settings className="h-4 w-4 text-slate-500" />
              <span className="hidden sm:inline">Thông tin GV</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 pt-6">
        {page === 'generate' && (
          <GeneratorView
            settings={settings}
            hasServerGeminiKey={hasServerGeminiKey}
            onCreated={handleCreatedHomework}
            onOpenSettings={() => setShowSettings(true)}
          />
        )}

        {page === 'library' && (
          <LibraryView
            homeworks={homeworks}
            submissionCounts={submissionCounts}
            onOpenHomework={(hw) => {
              setActiveHomework(hw);
              setPage('editor');
            }}
            onDuplicateHomework={handleDuplicate}
            onDeleteHomework={handleDelete}
            onCreateNew={() => setPage('generate')}
          />
        )}

        {page === 'editor' && activeHomework && (
          <HomeworkEditor
            homework={activeHomework}
            serverOnline={serverOnline}
            onSave={handleSaveEditor}
            onOpenPrint={() => setPage('print')}
            onPreviewQuiz={(hw) => {
              setActiveHomework(hw);
              setPage('previewQuiz');
            }}
            onBackToLibrary={() => {
              refreshLibrary();
              setPage('library');
            }}
          />
        )}
      </main>

      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={(next) => {
            setSettings(next);
            saveSettings(next);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

export default App;
