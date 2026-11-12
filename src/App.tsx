import { useEffect, useState } from 'react';
import { Menu, Settings, Sparkles } from 'lucide-react';
import { BrandLogo } from './components/BrandLogo';
import { GeneratorView } from './components/GeneratorView';
import { HomeworkEditor } from './components/HomeworkEditor';
import { IntroLanding } from './components/IntroLanding';
import { LibraryView } from './components/LibraryView';
import { OnlineQuizView } from './components/OnlineQuizView';
import { PrintWorksheet } from './components/PrintWorksheet';
import { SettingsModal } from './components/SettingsModal';
import { SidebarNav } from './components/SidebarNav';
import { SourcesView } from './components/SourcesView';
import { SUBJECT_MAP } from './config/subjects';
import {
  createDefaultConfigForSubject,
  deleteSourceItem,
  fetchHomeworks,
  loadGeneratorDraft,
  loadSettings,
  loadSources,
  loadSubjectConfig,
  removeHomework,
  saveGeneratorDraft,
  saveSettings,
  saveSourceItem,
  upsertHomework,
} from './services/storage';
import { AppSettings, GeneratorConfig, Homework, ReferenceSource, SubjectId } from './types';
import { AttachedMaterial } from './utils/fileExtractor';
import { createId } from './utils/promptBuilder';

type TeacherPage = 'generate' | 'library' | 'sources' | 'editor' | 'print' | 'previewQuiz';

type AppRoute =
  | { kind: 'quiz'; quizId?: string; encodedData?: string; gsParam?: string }
  | { kind: 'intro' }
  | { kind: 'create'; subject: SubjectId }
  | { kind: 'library' }
  | { kind: 'sources' }
  | { kind: 'editor'; homeworkId: string }
  | { kind: 'print'; homeworkId: string }
  | { kind: 'previewQuiz'; homeworkId: string };

function parseAppRoute(): AppRoute {
  const hash = window.location.hash || '';

  if (hash.startsWith('#/quiz')) {
    const queryIdx = hash.indexOf('?');
    let gsParam: string | undefined;
    if (queryIdx >= 0) {
      const params = new URLSearchParams(hash.slice(queryIdx + 1));
      gsParam = params.get('gs') || undefined;
      const data = params.get('data');
      if (data) return { kind: 'quiz', encodedData: data, gsParam };
    }
    const match = hash.match(/^#\/quiz\/([^?]+)/);
    if (match && match[1]) {
      return { kind: 'quiz', quizId: decodeURIComponent(match[1]), gsParam };
    }
  }

  if (hash.startsWith('#/create/')) {
    const rawSubject = hash.slice('#/create/'.length).split('?')[0] as SubjectId;
    const subject: SubjectId = SUBJECT_MAP[rawSubject] ? rawSubject : 'english';
    return { kind: 'create', subject };
  }
  if (hash === '#/create') {
    return { kind: 'create', subject: 'english' };
  }
  if (hash.startsWith('#/library')) {
    return { kind: 'library' };
  }
  if (hash.startsWith('#/sources')) {
    return { kind: 'sources' };
  }
  if (hash.startsWith('#/editor/')) {
    return { kind: 'editor', homeworkId: decodeURIComponent(hash.slice('#/editor/'.length)) };
  }
  if (hash.startsWith('#/print/')) {
    return { kind: 'print', homeworkId: decodeURIComponent(hash.slice('#/print/'.length)) };
  }
  if (hash.startsWith('#/preview/')) {
    return { kind: 'previewQuiz', homeworkId: decodeURIComponent(hash.slice('#/preview/'.length)) };
  }
  if (hash.startsWith('#/intro')) {
    return { kind: 'intro' };
  }

  // Default route when no hash is set
  try {
    if (sessionStorage.getItem('edulab_entered')) {
      return { kind: 'create', subject: 'english' };
    }
  } catch {
    // ignore
  }
  return { kind: 'intro' };
}

function navigateHash(hash: string) {
  if (window.location.hash !== hash) {
    window.location.hash = hash;
  }
}

export function App() {
  const [route, setRoute] = useState<AppRoute>(() => parseAppRoute());
  const quizRoute = route.kind === 'quiz' ? route : null;

  const [page, setPage] = useState<TeacherPage>(() => {
    if (route.kind === 'library') return 'library';
    if (route.kind === 'sources') return 'sources';
    if (route.kind === 'editor') return 'editor';
    if (route.kind === 'print') return 'print';
    if (route.kind === 'previewQuiz') return 'previewQuiz';
    return 'generate';
  });
  const [showIntro, setShowIntro] = useState<boolean>(() => route.kind === 'intro');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [showSettings, setShowSettings] = useState(false);

  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [sources, setSources] = useState<ReferenceSource[]>(() => loadSources());
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({});
  const [serverOnline, setServerOnline] = useState(false);
  const [hasServerGeminiKey, setHasServerGeminiKey] = useState(false);

  const [activeHomework, setActiveHomework] = useState<Homework | null>(null);

  const [initialDraft] = useState(() => loadGeneratorDraft());
  const [generatorConfig, setGeneratorConfig] = useState<GeneratorConfig>(() => {
    if (route.kind === 'create') {
      return loadSubjectConfig(route.subject);
    }
    return initialDraft.config;
  });
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
    setShowIntro(false);
    setPage('generate');
    navigateHash(`#/create/${subject}`);
  };

  useEffect(() => {
    const onHashChange = () => {
      const next = parseAppRoute();
      setRoute(next);
      if (next.kind === 'quiz') return;
      if (next.kind === 'intro') {
        setShowIntro(true);
        return;
      }
      setShowIntro(false);
      if (next.kind === 'create') {
        setGeneratorConfig((prev) =>
          (prev.subject || 'english') === next.subject ? prev : loadSubjectConfig(next.subject)
        );
        setPage('generate');
      } else if (next.kind === 'library') {
        setPage('library');
      } else if (next.kind === 'sources') {
        setPage('sources');
      } else if (next.kind === 'editor' || next.kind === 'print' || next.kind === 'previewQuiz') {
        const found = homeworks.find((h) => h.id === next.homeworkId);
        if (found) setActiveHomework(found);
        setPage(next.kind);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [homeworks]);

  useEffect(() => {
    if (
      (route.kind === 'editor' || route.kind === 'print' || route.kind === 'previewQuiz') &&
      !activeHomework &&
      homeworks.length > 0
    ) {
      const found = homeworks.find((h) => h.id === route.homeworkId);
      if (found) setActiveHomework(found);
    }
  }, [route, activeHomework, homeworks]);

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
        gsParam={quizRoute.gsParam}
      />
    );
  }

  const markEntered = () => {
    try {
      sessionStorage.setItem('edulab_entered', '1');
    } catch {
      // ignore
    }
    setShowIntro(false);
  };

  if (showIntro) {
    return (
      <IntroLanding
        homeworkCount={homeworks.length}
        onEnterWorkspace={(subject) => {
          const targetSubject = subject || generatorConfig.subject || 'english';
          markEntered();
          handleSelectSubject(targetSubject);
        }}
        onOpenLibrary={() => {
          refreshLibrary();
          markEntered();
          setPage('library');
          navigateHash('#/library');
        }}
      />
    );
  }

  // Teacher Previewing Student Quiz
  if (page === 'previewQuiz' && activeHomework) {
    return (
      <OnlineQuizView
        previewHomework={activeHomework}
        onExitPreview={() => {
          setPage('editor');
          navigateHash(`#/editor/${encodeURIComponent(activeHomework.id)}`);
        }}
      />
    );
  }

  // Teacher Print / PDF View
  if (page === 'print' && activeHomework) {
    return (
      <PrintWorksheet
        homework={activeHomework}
        onBack={() => {
          setPage('editor');
          navigateHash(`#/editor/${encodeURIComponent(activeHomework.id)}`);
        }}
      />
    );
  }

  const handleCreatedHomework = async (hw: Homework) => {
    const saved = await upsertHomework(hw);
    setActiveHomework(saved);
    await refreshLibrary();
    setPage('editor');
    navigateHash(`#/editor/${encodeURIComponent(saved.id)}`);
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
    navigateHash(`#/editor/${encodeURIComponent(saved.id)}`);
  };

  const handleDelete = async (id: string) => {
    await removeHomework(id);
    if (activeHomework?.id === id) setActiveHomework(null);
    await refreshLibrary();
  };

  const activeSubject = generatorConfig.subject || 'english';
  const activeSubjectDef = SUBJECT_MAP[activeSubject] || SUBJECT_MAP.english;

  const handleUseSourceForGenerator = (src: ReferenceSource) => {
    const newMat: AttachedMaterial = {
      id: createId('mat'),
      kind: 'text',
      name: `Nguồn: ${src.title}`,
      sizeBytes: new Blob([src.content]).size,
      content: src.content,
    };
    setGeneratorMaterials((prev) => {
      const filtered = prev.filter((m) => m.name !== newMat.name);
      return [newMat, ...filtered].slice(0, 5);
    });
    handleSelectSubject(src.subject);
  };

  return (
    <div className="min-h-screen bg-slate-50/80">
      <SidebarNav
        activePage={
          page === 'library'
            ? 'library'
            : page === 'sources'
            ? 'sources'
            : page === 'editor'
            ? 'editor'
            : 'generate'
        }
        activeSubject={activeSubject}
        homeworkCount={homeworks.length}
        sourceCount={sources.length}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onSelectSubject={handleSelectSubject}
        onOpenLibrary={() => {
          refreshLibrary();
          setPage('library');
          navigateHash('#/library');
        }}
        onOpenSources={() => {
          setPage('sources');
          navigateHash('#/sources');
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
                  {page === 'sources' && 'Nguồn tham khảo'}
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
                onClick={() => {
                  setShowIntro(true);
                  navigateHash('#/intro');
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100/70"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Giới thiệu</span>
              </button>
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
              navigateHash(`#/editor/${encodeURIComponent(hw.id)}`);
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
              navigateHash(`#/editor/${encodeURIComponent(hw.id)}`);
            }}
            onDuplicateHomework={handleDuplicate}
            onDeleteHomework={handleDelete}
            onCreateNew={() => handleSelectSubject(activeSubject)}
          />
        )}

        {page === 'sources' && (
          <SourcesView
            sources={sources}
            defaultSubject={activeSubject}
            onSaveSource={(src) => setSources(saveSourceItem(src))}
            onDeleteSource={(id) => setSources(deleteSourceItem(id))}
            onUseSourceForGenerator={handleUseSourceForGenerator}
          />
        )}

        {page === 'editor' && activeHomework && (
          <HomeworkEditor
            homework={activeHomework}
            serverOnline={serverOnline}
            onSave={handleSaveEditor}
            onOpenPrint={() => {
              setPage('print');
              navigateHash(`#/print/${encodeURIComponent(activeHomework.id)}`);
            }}
            onPreviewQuiz={(hw) => {
              setActiveHomework(hw);
              setPage('previewQuiz');
              navigateHash(`#/preview/${encodeURIComponent(hw.id)}`);
            }}
            onBackToLibrary={() => {
              refreshLibrary();
              setPage('library');
              navigateHash('#/library');
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
