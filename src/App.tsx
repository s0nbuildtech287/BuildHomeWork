import { useEffect, useState } from 'react';
import { Menu, Settings } from 'lucide-react';
import { BrandLogo } from './components/BrandLogo';
import { GeneratorView } from './components/GeneratorView';
import { HomeworkEditor } from './components/HomeworkEditor';
import { LibraryView } from './components/LibraryView';
import { OnlineQuizView } from './components/OnlineQuizView';
import { PrintWorksheet } from './components/PrintWorksheet';
import { SettingsModal } from './components/SettingsModal';
import { SidebarNav } from './components/SidebarNav';
import { getSubjectDefinition } from './config/subjects';
import {
  createDefaultConfigForSubject,
  fetchHomeworks,
  loadGeneratorDraft,
  loadSettings,
  loadSubjectConfig,
  removeHomework,
  saveGeneratorDraft,
  saveSettings,
  upsertHomework,
} from './services/storage';
import { AppSettings, GeneratorConfig, Homework, SubjectId } from './types';
import { AttachedMaterial } from './utils/fileExtractor';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [showSettings, setShowSettings] = useState(false);

  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({});
  const [serverOnline, setServerOnline] = useState(false);
  const [hasServerGeminiKey, setHasServerGeminiKey] = useState(false);

  const [activeHomework, setActiveHomework] = useState<Homework | null>(null);

  const [initialDraft] = useState(() => loadGeneratorDraft());
  const [generatorConfig, setGeneratorConfig] = useState<GeneratorConfig>(initialDraft.config);
  const [generatorAiMode, setGeneratorAiMode] = useState<'gemini' | 'manual_prompt'>(
    initialDraft.aiMode
  );
  const [generatorMaterials, setGeneratorMaterials] = useState<AttachedMaterial[]>(
    initialDraft.textMaterials
  );
  const [generatorPastedResult, setGeneratorPastedResult] = useState('');

  useEffect(() => {
    saveGeneratorDraft(generatorConfig, generatorAiMode, generatorMaterials);
  }, [generatorConfig, generatorAiMode, generatorMaterials]);

  const handleResetGenerator = () => {
    setGeneratorConfig(createDefaultConfigForSubject(generatorConfig.subject || 'english'));
    setGeneratorMaterials([]);
    setGeneratorPastedResult('');
  };

  const handleSelectSubject = (subject: SubjectId) => {
    if ((generatorConfig.subject || 'english') !== subject) {
      setGeneratorConfig(loadSubjectConfig(subject));
      setGeneratorPastedResult('');
    }
    setPage('generate');
  };

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

  const activeSubject = generatorConfig.subject || 'english';
  const activeSubjectDef = getSubjectDefinition(activeSubject);

  return (
    <div className="min-h-screen bg-slate-50/80">
      <SidebarNav
        activePage={page === 'library' ? 'library' : page === 'editor' ? 'editor' : 'generate'}
        activeSubject={activeSubject}
        homeworkCount={homeworks.length}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onSelectSubject={handleSelectSubject}
        onOpenLibrary={() => {
          refreshLibrary();
          setPage('library');
        }}
        onOpenSettings={() => setShowSettings(true)}
      />

      <div className="lg:pl-72">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-xs">
          <div className="mx-auto flex h-14 w-full max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 lg:hidden"
                aria-label="Mở menu môn học"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2 lg:hidden">
                <BrandLogo className="h-7 w-7 rounded-lg" />
                <span className="text-sm font-bold text-slate-900">EduLab Studio</span>
              </div>

              <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-400">Không gian soạn đề</span>
                <span>/</span>
                <span className="font-bold text-slate-800">
                  {page === 'generate' && `Môn ${activeSubjectDef.name}`}
                  {page === 'library' && 'Kho bài tập đã lưu'}
                  {page === 'editor' && (activeHomework?.title || 'Chỉnh sửa bài tập')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasServerGeminiKey && (
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  AI sẵn sàng
                </span>
              )}
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Settings className="h-3.5 w-3.5 text-slate-500" />
                <span className="hidden sm:inline">
                  {settings.teacherName ? settings.teacherName : 'Thông tin GV'}
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-4 py-5 sm:px-6 pb-14">
        {page === 'generate' && (
          <GeneratorView
            settings={settings}
            hasServerGeminiKey={hasServerGeminiKey}
            config={generatorConfig}
            onChangeConfig={setGeneratorConfig}
            aiMode={generatorAiMode}
            onChangeAiMode={setGeneratorAiMode}
            materials={generatorMaterials}
            onChangeMaterials={setGeneratorMaterials}
            pastedResult={generatorPastedResult}
            onChangePastedResult={setGeneratorPastedResult}
            onResetForm={handleResetGenerator}
            onCreated={handleCreatedHomework}
            onOpenSettings={() => setShowSettings(true)}
            recentHomeworks={homeworks}
            onOpenHomework={(hw) => {
              setActiveHomework(hw);
              setPage('editor');
            }}
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
      </div>

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
