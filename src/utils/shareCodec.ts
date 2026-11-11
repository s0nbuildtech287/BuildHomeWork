import LZString from 'lz-string';
import { Homework } from '../types';

export function encodeHomeworkToHash(homework: Homework): string {
  const json = JSON.stringify(homework);
  return LZString.compressToEncodedURIComponent(json);
}

export function decodeHomeworkFromHash(encoded: string): Homework | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const parsed = JSON.parse(json) as Homework;
    if (!parsed || !Array.isArray(parsed.sections)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function buildStandaloneQuizUrl(homework: Homework): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const compressed = encodeHomeworkToHash(homework);
  return `${origin}/#/quiz?data=${compressed}`;
}

export function buildServerQuizUrl(homeworkId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/#/quiz/${homeworkId}`;
}

