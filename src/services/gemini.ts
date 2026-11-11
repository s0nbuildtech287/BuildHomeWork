import { GeneratorConfig, Homework, TargetLevel } from '../types';
import { AttachedMaterial } from '../utils/fileExtractor';
import { buildHomeworkPrompt, parseAiHomeworkResponse } from '../utils/promptBuilder';

export async function uploadAudioToServer(params: {
  filename: string;
  base64Data: string;
  mimeType: string;
}): Promise<string> {
  const res = await fetch('/api/audio/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.audioUrl) {
    throw new Error(data?.error || 'Không lưu được file âm thanh lên hệ thống.');
  }
  return String(data.audioUrl);
}

export async function generateTtsAudio(params: {
  text: string;
  voice?: string;
  rate?: string;
}): Promise<string> {
  const res = await fetch('/api/audio/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.audioUrl) {
    throw new Error(data?.error || 'Không tạo được file MP3 cho bài nghe.');
  }
  return String(data.audioUrl);
}

export async function attachAudioToListeningSections(
  homework: Homework,
  level: TargetLevel,
  audioFiles: Array<Extract<AttachedMaterial, { kind: 'audio' }>> = []
): Promise<Homework> {
  let uploadedAudioUrl: string | undefined;
  if (audioFiles.length > 0) {
    try {
      uploadedAudioUrl = await uploadAudioToServer({
        filename: audioFiles[0].name,
        base64Data: audioFiles[0].base64Data,
        mimeType: audioFiles[0].mimeType,
      });
    } catch {
      uploadedAudioUrl = undefined;
    }
  }

  const defaultVoice = 'en-US-AriaNeural';
  const defaultRate = level === 'elementary' ? '-15%' : '+0%';

  for (let i = 0; i < homework.sections.length; i++) {
    const sec = homework.sections[i];
    const isListeningSec =
      Boolean(sec.listeningScript) || sec.title.toLowerCase().includes('listen');

    if (!isListeningSec) continue;

    if (uploadedAudioUrl) {
      sec.audioUrl = uploadedAudioUrl;
    } else if (sec.listeningScript && !sec.audioUrl) {
      try {
        sec.audioUrl = await generateTtsAudio({
          text: sec.listeningScript,
          voice: defaultVoice,
          rate: defaultRate,
        });
        sec.audioVoice = defaultVoice;
        sec.audioRate = defaultRate;
      } catch {
        // Keep listeningScript so browser speechSynthesis fallback still works
      }
    }
  }

  return homework;
}

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
    (m): m is Extract<AttachedMaterial, { kind: 'image' | 'pdf' | 'audio' }> =>
      m.kind === 'image' || m.kind === 'pdf' || m.kind === 'audio'
  );
  const audioFiles = materials.filter(
    (m): m is Extract<AttachedMaterial, { kind: 'audio' }> => m.kind === 'audio'
  );
  const textDocuments = materials
    .filter((m): m is Extract<AttachedMaterial, { kind: 'text' }> => m.kind === 'text')
    .map((m) => ({ name: m.name, content: m.content }));

  const prompt = buildHomeworkPrompt(
    config,
    binaryFiles.length > 0,
    textDocuments,
    audioFiles.length > 0
  );
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
          maxOutputTokens: 32768,
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

  const homework = parseAiHomeworkResponse(text, {
    level: config.level,
    gradeOrClass: config.gradeOrClass,
    teacherName,
    centerName,
  });

  return attachAudioToListeningSections(homework, config.level, audioFiles);
}
