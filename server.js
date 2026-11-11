import cors from 'cors';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
const DB_FILE = path.join(DATA_DIR, 'db.json');
const DIST_DIR = path.join(__dirname, 'dist');

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
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

function isCorrect(question, studentAnswer) {
  const studentNorm = normalizeAnswer(studentAnswer);
  if (!studentNorm) return false;

  if (question.type === 'multiple_choice' && Array.isArray(question.options) && question.options.length > 0) {
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

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));

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

  for (const sec of hw.sections) {
    for (const q of sec.questions) {
      const studentAnswer = String(answers[q.id] || '');
      const ok = isCorrect(q, studentAnswer);
      if (ok) score += 1;

      let displayCorrect = q.correctAnswer;
      if (q.type === 'multiple_choice' && Array.isArray(q.options) && q.options.length > 0) {
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
    totalQuestions: results.length,
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

