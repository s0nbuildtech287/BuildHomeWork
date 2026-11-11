import { GeneratorConfig, Homework } from '../types';
import { AttachedMaterial } from '../utils/fileExtractor';
import { buildHomeworkPrompt, parseAiHomeworkResponse } from '../utils/promptBuilder';

export async function generateHomeworkWithGemini(params: {
  apiKey: string;
  model: string;
  config: GeneratorConfig;
  materials?: AttachedMaterial[];
  teacherName?: string;
  centerName?: string;
}): Promise<Homework> {
  const { apiKey, model, config, materials = [], teacherName, centerName } = params;

  const binaryFiles = materials.filter(
    (m): m is Extract<AttachedMaterial, { kind: 'image' | 'pdf' }> =>
      m.kind === 'image' || m.kind === 'pdf'
  );
  const textDocuments = materials
    .filter((m): m is Extract<AttachedMaterial, { kind: 'text' }> => m.kind === 'text')
    .map((m) => ({ name: m.name, content: m.content }));

  const prompt = buildHomeworkPrompt(config, binaryFiles.length > 0, textDocuments);
  const parts: Array<Record<string, unknown>> = [{ text: prompt }];

  for (const file of binaryFiles) {
    parts.push({
      inline_data: {
        mime_type: file.mimeType,
        data: file.base64Data,
      },
    });
  }

  const cleanKey = apiKey.trim();
  let response: Response;

  if (cleanKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model || 'gemini-3.8-flash'
    )}:generateContent?key=${encodeURIComponent(cleanKey)}`;

    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          temperature: 0.65,
          responseMimeType: 'application/json',
        },
      }),
    });
  } else {
    response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'gemini-3.8-flash',
        parts,
      }),
    });
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errMsg =
      data?.error?.message ||
      data?.error ||
      `Lỗi kết nối trợ lý AI (HTTP ${response.status}).`;
    throw new Error(errMsg);
  }

  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text || '')
      .join('\n') || '';

  if (!text) {
    throw new Error('Hệ thống chưa trả về nội dung bài tập. Bạn hãy thử bấm tạo lại nhé.');
  }

  return parseAiHomeworkResponse(text, {
    level: config.level,
    gradeOrClass: config.gradeOrClass,
    teacherName,
    centerName,
  });
}
