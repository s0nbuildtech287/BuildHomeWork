import { HomeworkSection, Question } from '../types';

export interface VocabTableRowData {
  num: number;
  wordOrMeaning: string;
  phonetic: string;
  answer: string;
  explanation?: string;
  isWriteEn: boolean;
}

/**
 * Checks if a section should be rendered as a 4-column vocabulary table:
 * Col 1: STT
 * Col 2: Word / Meaning
 * Col 3: Phonetic
 * Col 4: Student input / filled answer
 */
export function isVocabTableSection(section: HomeworkSection): boolean {
  if (!section.questions || section.questions.length === 0) return false;
  // If section has a matching box word bank, it's not a 1-1 vocab table
  if (section.wordBank && section.wordBank.length > 0) return false;

  // Questions must be fill_blank or short_answer
  const isAllFill = section.questions.every(
    (q) => q.type === 'fill_blank' || q.type === 'short_answer'
  );
  if (!isAllFill) return false;

  const combined = `${section.title} ${section.instruction || ''}`.toLowerCase();
  if (
    combined.includes('vocabulary') ||
    combined.includes('từ vựng') ||
    combined.includes('vietnamese meaning') ||
    combined.includes('english word') ||
    combined.includes('nghĩa tiếng việt') ||
    combined.includes('từ tiếng anh') ||
    combined.includes('điền từ') ||
    combined.includes('điền nghĩa') ||
    combined.includes('vocab_write')
  ) {
    return true;
  }

  // Fallback: every question prompt has ______ and either a phonetic slash or is short 1-1 cue
  return section.questions.every((q) => {
    const p = q.prompt || '';
    return p.includes('______') && (p.includes('/') || p.length < 90);
  });
}

export function isSectionWritingEnglish(section: HomeworkSection): boolean {
  const combined = `${section.title} ${section.instruction || ''}`.toLowerCase();
  return (
    combined.includes('english word') ||
    combined.includes('từ tiếng anh') ||
    combined.includes('viết từ')
  );
}

export function parseVocabTableRow(
  q: Question,
  qNum: number,
  isWriteEn = false
): VocabTableRowData {
  let raw = (q.prompt || '').trim();
  // Strip leading question number: "1. ", "1) "
  raw = raw.replace(/^\d+[\.\)]\s*/, '');
  // Strip trailing blank: ": ______", "______"
  raw = raw.replace(/[:\-–—]?\s*_{2,}\s*$/, '').trim();

  let phonetic = '';
  if (q.hint && /^\/?[^\/]+\/?$/.test(q.hint.trim())) {
    phonetic = q.hint.trim();
    if (!phonetic.startsWith('/')) phonetic = `/${phonetic}/`;
  }

  // Extract phonetic from prompt e.g. (/ˌvjetnəˈmiːz/) or /ˌvjetnəˈmiːz/
  const pMatch = raw.match(/\(\/([^)]+?)\/\)|\/([^\s,)]+?)\//);
  if (pMatch) {
    if (!phonetic) {
      const p = pMatch[1] || pMatch[2] || '';
      phonetic = p.startsWith('/') ? p : `/${p}/`;
    }
    raw = raw.replace(pMatch[0], '').trim();
  }

  // Clean HTML/markdown tags
  const cleanWord = raw
    .replace(/<\/?(?:b|strong|u|i|em)>/gi, '')
    .replace(/\*\*/g, '')
    .replace(/[:\-–—]\s*$/, '')
    .trim();

  return {
    num: qNum,
    wordOrMeaning: cleanWord || q.prompt,
    phonetic: phonetic || '',
    answer: q.correctAnswer || '',
    explanation: q.explanation,
    isWriteEn,
  };
}
