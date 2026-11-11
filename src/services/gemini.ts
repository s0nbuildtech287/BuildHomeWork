import { GeneratorConfig, Homework } from '../types';
import { buildHomeworkPrompt, parseAiHomeworkResponse } from '../utils/promptBuilder';

export interface AttachedImage {
  name: string;
  mimeType: string;
  base64Data: string; // raw base64 without data:... prefix
  previewUrl: string;
}

export async function generateHomeworkWithGemini(params: {
  apiKey: string;
  model: string;
  config: GeneratorConfig;
  images?: AttachedImage[];
  teacherName?: string;
  centerName?: string;
}): Promise<Homework> {
  const { apiKey, model, config, images = [], teacherName, centerName } = params;

  const prompt = buildHomeworkPrompt(config, images.length > 0);
  const parts: Array<Record<string, unknown>> = [{ text: prompt }];

  for (const img of images) {
    parts.push({
      inline_data: {
        mime_type: img.mimeType,
        data: img.base64Data,
      },
    });
  }

  const cleanKey = apiKey.trim();
  let response: Response;

  if (cleanKey) {
    // Call Gemini REST API directly using user's configured key
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
    // Fallback to server proxy if GEMINI_API_KEY is configured in server environment
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
      `Lỗi gọi Gemini API (HTTP ${response.status}). Kiểm tra lại API Key hoặc model.`;
    throw new Error(errMsg);
  }

  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text || '')
      .join('\n') || '';

  if (!text) {
    throw new Error('Gemini không trả về nội dung bài tập. Bạn hãy thử bấm tạo lại nhé.');
  }

  return parseAiHomeworkResponse(text, {
    level: config.level,
    gradeOrClass: config.gradeOrClass,
    teacherName,
    centerName,
  });
}

