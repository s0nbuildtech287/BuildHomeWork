import { AppSettings, GeneratorConfig, Homework, StudentSubmission } from '../types';
import { AttachedMaterial } from '../utils/fileExtractor';

const HOMEWORKS_KEY = 'bhw_homeworks_v1';
const SETTINGS_KEY = 'bhw_settings_v1';
const SUBMISSIONS_KEY = 'bhw_submissions_v1';
const GENERATOR_DRAFT_KEY = 'bhw_generator_draft_v1';

export const DEFAULT_GENERATOR_CONFIG: GeneratorConfig = {
  level: 'secondary',
  gradeOrClass: 'Lớp 7',
  topic: '',
  grammarFocus: '',
  vocabularyFocus: '',
  studentMistakes: '',
  extraInstructions: '',
  listeningStyle: 'multiple_choice',
  difficulty: 'medium',
  counts: {
    multiple_choice: 6,
    fill_blank: 4,
    word_form: 3,
    sentence_order: 0,
    rewrite: 3,
    reading_questions: 4,
    find_mistake: 0,
    listening_questions: 0,
    writing: 0,
  },
};

export interface SavedGeneratorDraft {
  config: GeneratorConfig;
  aiMode: 'gemini' | 'manual_prompt';
  textMaterials: Array<Extract<AttachedMaterial, { kind: 'text' }>>;
}

export function loadGeneratorDraft(): SavedGeneratorDraft {
  try {
    const raw = localStorage.getItem(GENERATOR_DRAFT_KEY);
    if (!raw) {
      return { config: DEFAULT_GENERATOR_CONFIG, aiMode: 'gemini', textMaterials: [] };
    }
    const parsed = JSON.parse(raw);
    return {
      config: {
        ...DEFAULT_GENERATOR_CONFIG,
        ...(parsed.config || {}),
        counts: {
          ...DEFAULT_GENERATOR_CONFIG.counts,
          ...(parsed.config?.counts || {}),
        },
      },
      aiMode: parsed.aiMode === 'manual_prompt' ? 'manual_prompt' : 'gemini',
      textMaterials: Array.isArray(parsed.textMaterials) ? parsed.textMaterials : [],
    };
  } catch {
    return { config: DEFAULT_GENERATOR_CONFIG, aiMode: 'gemini', textMaterials: [] };
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
  } catch {
    // ignore storage quota errors
  }
}

export const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: '',
  geminiModel: 'gemini-3.8-flash',
  teacherName: '',
  centerName: '',
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const merged = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    if (merged.geminiModel === 'gemini-2.5-flash' || merged.geminiModel === 'gemini-2.0-flash') {
      merged.geminiModel = 'gemini-3.8-flash';
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
  try {
    const res = await fetch(`/api/submissions/${encodeURIComponent(homeworkId)}`);
    if (!res.ok) throw new Error('Error');
    const data = await res.json();
    return Array.isArray(data.submissions) ? data.submissions : [];
  } catch {
    try {
      const raw = localStorage.getItem(SUBMISSIONS_KEY);
      const list: StudentSubmission[] = raw ? JSON.parse(raw) : [];
      return list.filter((s) => s.homeworkId === homeworkId);
    } catch {
      return [];
    }
  }
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

