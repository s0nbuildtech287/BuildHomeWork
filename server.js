import cors from 'cors';
import express from 'express';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { fetchAndExtractSource } from './api/_htmlExtractor.js';
import { fetchSubjectNewsFeed } from './api/_feedFetcher.js';

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadDotEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx <= 0) continue;
    const key = line.slice(0, eqIdx).trim();
    let val = line.slice(eqIdx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadDotEnv();

const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, 'data');
const AUDIO_DIR = path.join(DATA_DIR, 'audio');
const IMAGE_DIR = path.join(DATA_DIR, 'images');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const DIST_DIR = path.join(__dirname, 'dist');

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }
  if (!fs.existsSync(IMAGE_DIR)) {
    fs.mkdirSync(IMAGE_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initial = { homeworks: [], submissions: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
  }
}

function readDb() {
  ensureDb();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      homeworks: Array.isArray(parsed.homeworks) ? parsed.homeworks : [],
      submissions: Array.isArray(parsed.submissions) ? parsed.submissions : [],
    };
  } catch {
    return { homeworks: [], submissions: [] };
  }
}

function writeDb(data) {
  ensureDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function normalizeAnswer(value, stripTrailingPunctuation = true) {
  let normalized = String(value || '')
    .trim()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, ' ')
    .toLowerCase();
  if (stripTrailingPunctuation) {
    normalized = normalized.replace(/[.!?]+$/g, '').trim();
  }
  return normalized;
}

function stripOptionPrefix(text) {
  return String(text || '').replace(/^[A-Da-d][.)]\s*/, '').trim();
}

function resolveCorrectOptionIndex(question) {
  const options = Array.isArray(question.options) ? question.options : [];
  if (options.length === 0) return -1;
  const rawCorrect = String(question.correctAnswer || '').trim();
  const letterMatch = rawCorrect.match(/^([A-Da-d])(?:[.)].*)?$/);
  if (letterMatch && rawCorrect.length <= 3) {
    const idx = letterMatch[1].toUpperCase().charCodeAt(0) - 65;
    if (idx >= 0 && idx < options.length) return idx;
  }
  const targetNorm = normalizeAnswer(stripOptionPrefix(rawCorrect), false);
  return options.findIndex(
    (opt) => normalizeAnswer(stripOptionPrefix(opt), false) === targetNorm
  );
}

function isChoiceQuestion(question) {
  return question.type === 'multiple_choice' || question.type === 'find_mistake';
}

function isCorrect(question, studentAnswer) {
  if (question.type === 'writing') {
    return String(studentAnswer || '').trim().length > 0;
  }

  const studentNorm = normalizeAnswer(studentAnswer);
  if (!studentNorm) return false;

  if (isChoiceQuestion(question) && Array.isArray(question.options) && question.options.length > 0) {
    const correctIdx = resolveCorrectOptionIndex(question);
    if (correctIdx >= 0) {
      const correctOptionText = stripOptionPrefix(question.options[correctIdx]);
      const studentClean = normalizeAnswer(stripOptionPrefix(studentAnswer), false);
      const correctLetter = String.fromCharCode(65 + correctIdx).toLowerCase();
      return (
        studentClean === normalizeAnswer(correctOptionText, false) ||
        studentClean === correctLetter
      );
    }
  }

  const accepted = String(question.correctAnswer || '')
    .split('|')
    .map((s) => normalizeAnswer(s))
    .filter(Boolean);
  return accepted.some((a) => a === studentNorm);
}

const ALLOWED_TTS_VOICES = new Set([
  'en-US-AriaNeural',
  'en-US-GuyNeural',
  'en-GB-SoniaNeural',
  'en-GB-RyanNeural',
  'en-AU-NatashaNeural',
]);

const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' }));

ensureDb();
app.use('/api/audio', express.static(AUDIO_DIR));
app.use('/api/images', express.static(IMAGE_DIR));

// Upload image attached or pasted by teacher into a question/section
app.post('/api/images/upload', (req, res) => {
  const { filename = 'image.png', base64Data, mimeType = 'image/png' } = req.body || {};
  if (!base64Data || typeof base64Data !== 'string') {
    return res.status(400).json({ error: 'Thiếu dữ liệu ảnh để tải lên.' });
  }

  const extMatch = String(filename).toLowerCase().match(/\.(png|jpg|jpeg|gif|webp)$/);
  const extFromMime =
    mimeType === 'image/jpeg'
      ? '.jpg'
      : mimeType === 'image/gif'
        ? '.gif'
        : mimeType === 'image/webp'
          ? '.webp'
          : '.png';
  const ext = extMatch ? `.${extMatch[1] === 'jpeg' ? 'jpg' : extMatch[1]}` : extFromMime;

  const outName = `img_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}${ext}`;
  const outPath = path.join(IMAGE_DIR, outName);

  try {
    ensureDb();
    fs.writeFileSync(outPath, Buffer.from(base64Data, 'base64'));
    return res.json({ imageUrl: `/api/images/${outName}` });
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Không lưu được file ảnh.' });
  }
});

// Upload MP3 / audio file attached by teacher
app.post('/api/audio/upload', (req, res) => {
  const { filename = 'audio.mp3', base64Data, mimeType = 'audio/mpeg' } = req.body || {};
  if (!base64Data || typeof base64Data !== 'string') {
    return res.status(400).json({ error: 'Thiếu dữ liệu âm thanh để tải lên.' });
  }

  const extMatch = String(filename).toLowerCase().match(/\.(mp3|wav|m4a|ogg)$/);
  const extFromMime =
    mimeType === 'audio/wav'
      ? '.wav'
      : mimeType === 'audio/mp4'
        ? '.m4a'
        : mimeType === 'audio/ogg'
          ? '.ogg'
          : '.mp3';
  const ext = extMatch ? `.${extMatch[1]}` : extFromMime;

  const outName = `upload_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}${ext}`;
  const outPath = path.join(AUDIO_DIR, outName);

  try {
    ensureDb();
    fs.writeFileSync(outPath, Buffer.from(base64Data, 'base64'));
    return res.json({ audioUrl: `/api/audio/${outName}` });
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Không lưu được file âm thanh.' });
  }
});

// Generate MP3 from listening script using Microsoft Edge Neural Voices (edge-tts)
app.post('/api/audio/tts', async (req, res) => {
  const { text, voice = 'en-US-AriaNeural', rate = '+0%' } = req.body || {};
  const cleanText = String(text || '').trim();
  if (!cleanText) {
    return res.status(400).json({ error: 'Chưa có nội dung bài nghe để tạo file MP3.' });
  }
  if (cleanText.length > 5000) {
    return res.status(400).json({ error: 'Nội dung bài nghe quá dài (tối đa 5.000 ký tự).' });
  }

  const safeVoice = ALLOWED_TTS_VOICES.has(voice) ? voice : 'en-US-AriaNeural';
  const safeRate = /^[+-]\d{1,2}%$/.test(String(rate)) ? String(rate) : '+0%';

  // Strip speaker labels like "Speaker A:" if formatted as plain reading, or keep readable pauses
  const spokenText = cleanText.replace(/\r?\n+/g, ' ... ');
  const outName = `tts_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}.mp3`;
  const outPath = path.join(AUDIO_DIR, outName);

  try {
    ensureDb();
    await execFileAsync(
      'python',
      [
        '-m',
        'edge_tts',
        '--text',
        spokenText,
        '--voice',
        safeVoice,
        `--rate=${safeRate}`,
        '--write-media',
        outPath,
      ],
      { timeout: 45000 }
    );
    return res.json({ audioUrl: `/api/audio/${outName}` });
  } catch (err) {
    return res.status(500).json({
      error: err?.message || 'Không tạo được file MP3 từ nội dung nghe.',
    });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    hasServerGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Optional server-side Gemini proxy if GEMINI_API_KEY is set in env
app.post('/api/generate', async (req, res) => {
  const serverKey = process.env.GEMINI_API_KEY;
  if (!serverKey) {
    return res.status(400).json({
      error: 'Chưa cấu hình GEMINI_API_KEY. Hãy bấm "Cài đặt" trên giao diện để dán API Key Gemini miễn phí.',
    });
  }

  const { model = 'gemini-3.8-flash', parts = [] } = req.body || {};
  const candidates = Array.from(
    new Set([model, 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite'])
  );

  try {
    let lastStatus = 500;
    let lastData = { error: 'Lỗi gọi Gemini API' };

    for (const candidateModel of candidates) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        candidateModel
      )}:generateContent?key=${encodeURIComponent(serverKey)}`;

      const upstream = await fetch(url, {
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

      const data = await upstream.json().catch(() => ({}));
      if (upstream.ok) {
        return res.status(200).json(data);
      }

      lastStatus = upstream.status;
      lastData = data;
      // Only retry with fallback models on 404/429/503
      if (![404, 429, 503].includes(upstream.status)) {
        break;
      }
    }

    return res.status(lastStatus).json(lastData);
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Lỗi kết nối Gemini API' });
  }
});

// Teacher Homeworks CRUD
app.get('/api/homeworks', (_req, res) => {
  const db = readDb();
  const submissionCounts = {};
  for (const sub of db.submissions) {
    submissionCounts[sub.homeworkId] = (submissionCounts[sub.homeworkId] || 0) + 1;
  }
  res.json({
    homeworks: db.homeworks,
    submissionCounts,
  });
});

app.get('/api/feed-sources', async (req, res) => {
  const subject = typeof req.query?.subject === 'string' ? req.query.subject : 'all';
  try {
    const items = await fetchSubjectNewsFeed(subject);
    return res.json({ items });
  } catch (err) {
    return res.status(500).json({
      error: err?.message || 'Không tải được bảng tin nguồn tham khảo.',
    });
  }
});

app.post('/api/fetch-source', async (req, res) => {
  const { url } = req.body || {};
  try {
    const result = await fetchAndExtractSource(url);
    return res.json(result);
  } catch (err) {
    const status = err?.status || 500;
    return res.status(status).json({
      error: err?.message || 'Không lấy được nội dung từ đường dẫn này.',
    });
  }
});

app.post('/api/homeworks', (req, res) => {
  const hw = req.body;
  if (!hw || !hw.id || !Array.isArray(hw.sections)) {
    return res.status(400).json({ error: 'Dữ liệu bài tập không hợp lệ' });
  }
  const db = readDb();
  const idx = db.homeworks.findIndex((item) => item.id === hw.id);
  if (idx >= 0) {
    db.homeworks[idx] = { ...hw, updatedAt: new Date().toISOString() };
  } else {
    db.homeworks.unshift(hw);
  }
  writeDb(db);
  res.json({ homework: idx >= 0 ? db.homeworks[idx] : hw });
});

app.delete('/api/homeworks/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  db.homeworks = db.homeworks.filter((h) => h.id !== id);
  db.submissions = db.submissions.filter((s) => s.homeworkId !== id);
  writeDb(db);
  res.json({ ok: true });
});

// Student Quiz fetch (without revealing answers upfront)
app.get('/api/quiz/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const hw = db.homeworks.find((h) => h.id === id);
  if (!hw) {
    return res.status(404).json({ error: 'Không tìm thấy bài tập này.' });
  }

  const sanitized = {
    ...hw,
    sections: hw.sections.map((sec) => ({
      ...sec,
      listeningScript: '',
      questions: sec.questions.map((q) => ({
        id: q.id,
        type: q.type,
        prompt: q.prompt,
        options: q.options,
        words: q.words,
        hint: q.hint,
        correctAnswer: '',
        explanation: '',
      })),
    })),
  };

  res.json({ homework: sanitized });
});

// Student Quiz submission & auto-grading
app.post('/api/quiz/:id/submit', (req, res) => {
  const { id } = req.params;
  const { studentName, studentClass = '', answers = {} } = req.body || {};

  if (!studentName || !String(studentName).trim()) {
    return res.status(400).json({ error: 'Vui lòng nhập họ tên học sinh.' });
  }

  const db = readDb();
  const hw = db.homeworks.find((h) => h.id === id);
  if (!hw) {
    return res.status(404).json({ error: 'Không tìm thấy bài tập để chấm điểm.' });
  }

  const results = [];
  let score = 0;
  let objectiveTotal = 0;

  for (const sec of hw.sections) {
    for (const q of sec.questions) {
      const studentAnswer = String(answers[q.id] || '');
      const isWriting = q.type === 'writing';
      const ok = isCorrect(q, studentAnswer);

      if (!isWriting) {
        objectiveTotal += 1;
        if (ok) score += 1;
      }

      let displayCorrect = q.correctAnswer;
      if (isChoiceQuestion(q) && Array.isArray(q.options) && q.options.length > 0) {
        const idx = resolveCorrectOptionIndex(q);
        if (idx >= 0) {
          displayCorrect = `${String.fromCharCode(65 + idx)}. ${stripOptionPrefix(q.options[idx])}`;
        }
      }

      results.push({
        questionId: q.id,
        studentAnswer,
        correctAnswer: displayCorrect,
        isCorrect: ok,
        isManualReview: isWriting,
        explanation: q.explanation,
      });
    }
  }

  const submission = {
    id: `sub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    homeworkId: id,
    studentName: String(studentName).trim(),
    studentClass: String(studentClass || '').trim(),
    submittedAt: new Date().toISOString(),
    score,
    totalQuestions: objectiveTotal,
    answers,
    results,
  };

  db.submissions.unshift(submission);
  writeDb(db);

  res.json({ submission, homeworkWithKeys: hw });
});

app.get('/api/submissions/:homeworkId', (req, res) => {
  const { homeworkId } = req.params;
  const db = readDb();
  const list = db.submissions.filter((s) => s.homeworkId === homeworkId);
  res.json({ submissions: list });
});

// Serve built SPA in production
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`BuildHomeWork server running at http://localhost:${PORT}`);
});

