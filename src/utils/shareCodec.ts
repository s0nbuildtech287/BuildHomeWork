import LZString from 'lz-string';
import { Homework } from '../types';
import { extractDeploymentId } from '../services/googleSheet';

function compactHomeworkForUrl(homework: Homework): Record<string, unknown> {
  return {
    id: homework.id,
    subject: homework.subject,
    title: homework.title,
    subtitle: homework.subtitle || undefined,
    level: homework.level,
    gradeOrClass: homework.gradeOrClass || undefined,
    topicSummary: homework.topicSummary || undefined,
    estimatedMinutes: homework.estimatedMinutes,
    teacherName: homework.teacherName || undefined,
    centerName: homework.centerName || undefined,
    sections: homework.sections.map((s) => ({
      id: s.id,
      title: s.title,
      instruction: s.instruction || undefined,
      type: s.type,
      readingPassage: s.readingPassage || undefined,
      listeningScript: s.listeningScript || undefined,
      audioUrl: s.audioUrl || undefined,
      imageUrl: s.imageUrl || undefined,
      wordBank: s.wordBank && s.wordBank.length > 0 ? s.wordBank : undefined,
      questions: s.questions.map((q) => ({
        id: q.id,
        type: q.type,
        prompt: q.prompt,
        options: q.options && q.options.length > 0 ? q.options : undefined,
        words: q.words && q.words.length > 0 ? q.words : undefined,
        imageUrl: q.imageUrl || undefined,
        hint: q.hint || undefined,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || undefined,
      })),
    })),
  };
}

export function encodeHomeworkToHash(homework: Homework): string {
  const json = JSON.stringify(compactHomeworkForUrl(homework));
  return LZString.compressToEncodedURIComponent(json);
}

export function decodeHomeworkFromHash(encoded: string): Homework | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const parsed = JSON.parse(json) as Homework;
    if (!parsed || !Array.isArray(parsed.sections)) return null;
    return {
      ...parsed,
      subtitle: parsed.subtitle || '',
      gradeOrClass: parsed.gradeOrClass || '',
      topicSummary: parsed.topicSummary || '',
      createdAt: parsed.createdAt || new Date().toISOString(),
      updatedAt: parsed.updatedAt || new Date().toISOString(),
      sections: parsed.sections.map((s) => ({
        ...s,
        instruction: s.instruction || '',
        questions: Array.isArray(s.questions) ? s.questions : [],
      })),
    };
  } catch {
    return null;
  }
}

export function buildStandaloneQuizUrl(homework: Homework): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const compressed = encodeHomeworkToHash(homework);
  return `${origin}/#/quiz?data=${compressed}`;
}

export function buildServerQuizUrl(homeworkId: string, googleScriptUrl?: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const base = `${origin}/#/quiz/${homeworkId}`;
  const depId = googleScriptUrl ? extractDeploymentId(googleScriptUrl) : '';
  return depId ? `${base}?gs=${encodeURIComponent(depId)}` : base;
}

