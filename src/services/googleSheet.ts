import { Homework, StudentSubmission } from '../types';
import { loadSettings } from './storage';
import GOOGLE_APPS_SCRIPT_TEMPLATE from '../../Code.gs?raw';

export { GOOGLE_APPS_SCRIPT_TEMPLATE };

export function resolveGoogleScriptUrl(overrideParam?: string | null): string {
  const raw =
    (overrideParam || '').trim() ||
    (loadSettings().googleScriptUrl || '').trim() ||
    ((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_GOOGLE_SCRIPT_URL || '').trim();

  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw;
  }
  return `https://script.google.com/macros/s/${raw}/exec`;
}

export function extractDeploymentId(scriptUrl: string): string {
  const trimmed = (scriptUrl || '').trim();
  if (!trimmed) return '';
  const match = trimmed.match(/\/macros\/s\/([^/]+)\/exec/i);
  if (match && match[1]) return match[1];
  return trimmed;
}

export async function pingGoogleScript(scriptUrl: string): Promise<{ ok: boolean; message: string }> {
  const resolved = resolveGoogleScriptUrl(scriptUrl);
  if (!resolved) return { ok: false, message: 'Chưa nhập URL Apps Script.' };
  try {
    const res = await fetch(`${resolved}?action=ping`);
    if (!res.ok) return { ok: false, message: `Lỗi HTTP ${res.status}` };
    const data = await res.json();
    if (data && data.ok) {
      return { ok: true, message: data.message || 'Kết nối Google Sheet thành công!' };
    }
    return { ok: false, message: data?.error || 'Phản hồi không hợp lệ từ Apps Script.' };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Không kết nối được tới Apps Script.',
    };
  }
}

export async function saveHomeworkToSheet(
  homework: Homework,
  scriptUrlOverride?: string
): Promise<boolean> {
  const url = resolveGoogleScriptUrl(scriptUrlOverride);
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'saveHomework',
        homework,
      }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data && data.ok);
  } catch {
    return false;
  }
}

export async function fetchHomeworkFromSheet(
  homeworkId: string,
  scriptUrlOverride?: string
): Promise<Homework | null> {
  const url = resolveGoogleScriptUrl(scriptUrlOverride);
  if (!url) return null;
  try {
    const res = await fetch(
      `${url}?action=getHomework&id=${encodeURIComponent(homeworkId)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.ok && data.homework) {
      return data.homework as Homework;
    }
    return null;
  } catch {
    return null;
  }
}

export async function submitResultToSheet(
  submission: StudentSubmission,
  homeworkTitle: string,
  scriptUrlOverride?: string
): Promise<boolean> {
  const url = resolveGoogleScriptUrl(scriptUrlOverride);
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'submitResult',
        homeworkTitle,
        submission: {
          id: submission.id,
          homeworkId: submission.homeworkId,
          studentName: submission.studentName,
          studentClass: submission.studentClass,
          submittedAt: submission.submittedAt,
          score: submission.score,
          totalQuestions: submission.totalQuestions,
        },
      }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data && data.ok);
  } catch {
    return false;
  }
}

export async function fetchSubmissionsFromSheet(
  homeworkId: string,
  scriptUrlOverride?: string
): Promise<StudentSubmission[]> {
  const url = resolveGoogleScriptUrl(scriptUrlOverride);
  if (!url) return [];
  try {
    const res = await fetch(
      `${url}?action=getSubmissions&homeworkId=${encodeURIComponent(homeworkId)}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.submissions) ? (data.submissions as StudentSubmission[]) : [];
  } catch {
    return [];
  }
}
