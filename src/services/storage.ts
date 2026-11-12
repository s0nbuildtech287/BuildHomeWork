import { AppSettings, GeneratorConfig, Homework, ReferenceSource, StudentSubmission, SubjectId } from '../types';
import { getDefaultCountsForSubject, getSubjectDefinition } from '../config/subjects';
import { AttachedMaterial } from '../utils/fileExtractor';
import { fetchSubmissionsFromSheet, saveHomeworkToSheet } from './googleSheet';

const HOMEWORKS_KEY = 'bhw_homeworks_v1';
const SETTINGS_KEY = 'bhw_settings_v1';
const SUBMISSIONS_KEY = 'bhw_submissions_v1';
const GENERATOR_DRAFT_KEY = 'bhw_generator_draft_v1';
const SUBJECT_DRAFTS_KEY = 'bhw_subject_drafts_v1';

export function createDefaultConfigForSubject(subject: SubjectId = 'english'): GeneratorConfig {
  const def = getSubjectDefinition(subject);
  return {
    subject,
    level: 'secondary',
    gradeOrClass: def.defaultGrade,
    topic: '',
    grammarFocus: '',
    vocabularyFocus: '',
    studentMistakes: '',
    extraInstructions: '',
    listeningStyle: 'multiple_choice',
    includeStepByStep: true,
    useLatexFormulas: def.supportsStemOptions,
    difficulty: 'medium',
    counts: getDefaultCountsForSubject(subject),
  };
}

export const DEFAULT_GENERATOR_CONFIG: GeneratorConfig = createDefaultConfigForSubject('english');

export interface SavedGeneratorDraft {
  config: GeneratorConfig;
  aiMode: 'gemini' | 'manual_prompt';
  textMaterials: Array<Extract<AttachedMaterial, { kind: 'text' }>>;
}

export function loadGeneratorDraft(): SavedGeneratorDraft {
  try {
    const raw = localStorage.getItem(GENERATOR_DRAFT_KEY);
    if (!raw) {
      return { config: DEFAULT_GENERATOR_CONFIG, aiMode: 'manual_prompt', textMaterials: [] };
    }
    const parsed = JSON.parse(raw);
    let aiMode: 'gemini' | 'manual_prompt' =
      parsed.aiMode === 'gemini' ? 'gemini' : 'manual_prompt';
    if (!localStorage.getItem('bhw_default_manual_v1')) {
      aiMode = 'manual_prompt';
      localStorage.setItem('bhw_default_manual_v1', '1');
    }
    return {
      config: {
        ...DEFAULT_GENERATOR_CONFIG,
        ...(parsed.config || {}),
        counts: {
          ...DEFAULT_GENERATOR_CONFIG.counts,
          ...(parsed.config?.counts || {}),
        },
      },
      aiMode,
      textMaterials: Array.isArray(parsed.textMaterials) ? parsed.textMaterials : [],
    };
  } catch {
    return { config: DEFAULT_GENERATOR_CONFIG, aiMode: 'manual_prompt', textMaterials: [] };
  }
}

export function saveGeneratorDraft(
  config: GeneratorConfig,
  aiMode: 'gemini' | 'manual_prompt',
  materials: AttachedMaterial[]
): void {
  try {
    const textMaterials = materials.filter(
      (m): m is Extract<AttachedMaterial, { kind: 'text' }> => m.kind === 'text'
    );
    localStorage.setItem(
      GENERATOR_DRAFT_KEY,
      JSON.stringify({ config, aiMode, textMaterials })
    );
    // Also persist per-subject config so switching subjects in the sidebar preserves each form
    const rawMap = localStorage.getItem(SUBJECT_DRAFTS_KEY);
    const map = rawMap ? JSON.parse(rawMap) : {};
    map[config.subject || 'english'] = config;
    localStorage.setItem(SUBJECT_DRAFTS_KEY, JSON.stringify(map));
  } catch {
    // ignore storage quota errors
  }
}

export function loadSubjectConfig(subject: SubjectId): GeneratorConfig {
  const base = createDefaultConfigForSubject(subject);
  try {
    const rawMap = localStorage.getItem(SUBJECT_DRAFTS_KEY);
    if (!rawMap) return base;
    const map = JSON.parse(rawMap);
    const saved = map?.[subject];
    if (!saved) return base;
    return {
      ...base,
      ...saved,
      subject,
      counts: {
        ...base.counts,
        ...(saved.counts || {}),
      },
    };
  } catch {
    return base;
  }
}

export const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: '',
  geminiModel: 'gemini-3.8-flash',
  teacherName: '',
  centerName: '',
  enableBrandHeaderFooter: true,
  headerLeft: 'MS. HUONG - 0327161636',
  headerRight: 'T-CLASS EDUCATION - 0978386622',
  footerLeft: 'T-CLASS EDUCATION - Số nhà 9,12,14-16 Ngõ 71 Khu Dịch vụ 3, Văn Phú, Hà Đông, HN',
  headerFooterColor: '7075B8',
  googleScriptUrl:
    'https://script.google.com/macros/s/AKfycbxz_bSM136QVuexjpy3DUWKnIkE9xOboKO0zwZF-VjDi9zVatQG7WlwivNkN5dNp5Q6AA/exec',
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const merged = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    if (merged.geminiModel === 'gemini-2.5-flash' || merged.geminiModel === 'gemini-2.0-flash') {
      merged.geminiModel = 'gemini-3.8-flash';
    }
    if (!merged.googleScriptUrl) {
      merged.googleScriptUrl = DEFAULT_SETTINGS.googleScriptUrl;
    }
    return merged;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

const MOCK_SAMPLE_IDS = new Set(['sample_elementary_1', 'sample_secondary_1']);

function loadLocalHomeworks(): Homework[] {
  try {
    const raw = localStorage.getItem(HOMEWORKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const cleaned = parsed.filter((item) => item && !MOCK_SAMPLE_IDS.has(item.id));
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(HOMEWORKS_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
  }
}

function saveLocalHomeworks(list: Homework[]): void {
  localStorage.setItem(HOMEWORKS_KEY, JSON.stringify(list));
}

export async function fetchHomeworks(): Promise<{
  homeworks: Homework[];
  submissionCounts: Record<string, number>;
  serverOnline: boolean;
}> {
  try {
    const res = await fetch('/api/homeworks');
    if (!res.ok) throw new Error('Server error');
    const data = await res.json();
    const serverList: Homework[] = (Array.isArray(data.homeworks) ? data.homeworks : []).filter(
      (item: Homework) => item && !MOCK_SAMPLE_IDS.has(item.id)
    );

    saveLocalHomeworks(serverList);
    return {
      homeworks: serverList,
      submissionCounts: data.submissionCounts || {},
      serverOnline: true,
    };
  } catch {
    return {
      homeworks: loadLocalHomeworks(),
      submissionCounts: {},
      serverOnline: false,
    };
  }
}

export async function upsertHomework(hw: Homework): Promise<Homework> {
  const updated = { ...hw, updatedAt: new Date().toISOString() };
  const local = loadLocalHomeworks();
  const idx = local.findIndex((x) => x.id === updated.id);
  const nextLocal =
    idx >= 0 ? local.map((x) => (x.id === updated.id ? updated : x)) : [updated, ...local];
  saveLocalHomeworks(nextLocal);

  // Best-effort sync to Google Sheet if configured
  void saveHomeworkToSheet(updated);

  try {
    const res = await fetch('/api/homeworks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    if (res.ok) {
      const data = await res.json();
      return data.homework || updated;
    }
  } catch {
    // fallback to localStorage already saved
  }
  return updated;
}

export async function removeHomework(id: string): Promise<void> {
  const local = loadLocalHomeworks().filter((x) => x.id !== id);
  saveLocalHomeworks(local);
  try {
    await fetch(`/api/homeworks/${encodeURIComponent(id)}`, { method: 'DELETE' });
  } catch {
    // ignore offline error
  }
}

export async function fetchSubmissions(homeworkId: string): Promise<StudentSubmission[]> {
  const byId = new Map<string, StudentSubmission>();

  const sheetList = await fetchSubmissionsFromSheet(homeworkId);
  for (const s of sheetList) {
    if (s && s.id) byId.set(s.id, s);
  }

  try {
    const res = await fetch(`/api/submissions/${encodeURIComponent(homeworkId)}`);
    if (res.ok) {
      const data = await res.json();
      const serverList = Array.isArray(data.submissions) ? (data.submissions as StudentSubmission[]) : [];
      for (const s of serverList) {
        if (s && s.id && !byId.has(s.id)) byId.set(s.id, s);
      }
    }
  } catch {
    try {
      const raw = localStorage.getItem(SUBMISSIONS_KEY);
      const list: StudentSubmission[] = raw ? JSON.parse(raw) : [];
      for (const s of list.filter((x) => x.homeworkId === homeworkId)) {
        if (s && s.id && !byId.has(s.id)) byId.set(s.id, s);
      }
    } catch {
      // ignore
    }
  }

  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
}

export function saveLocalSubmission(sub: StudentSubmission): void {
  try {
    const raw = localStorage.getItem(SUBMISSIONS_KEY);
    const list: StudentSubmission[] = raw ? JSON.parse(raw) : [];
    list.unshift(sub);
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(list.slice(0, 200)));
  } catch {
    // ignore
  }
}

const SOURCES_KEY = 'bhw_reference_sources_v1';

export function loadSources(): ReferenceSource[] {
  try {
    const raw = localStorage.getItem(SOURCES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSourceItem(source: ReferenceSource): ReferenceSource[] {
  const current = loadSources();
  const idx = current.findIndex((s) => s.id === source.id);
  const next =
    idx >= 0
      ? current.map((s) => (s.id === source.id ? source : s))
      : [source, ...current];
  try {
    localStorage.setItem(SOURCES_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

export function deleteSourceItem(id: string): ReferenceSource[] {
  const next = loadSources().filter((s) => s.id !== id);
  try {
    localStorage.setItem(SOURCES_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

