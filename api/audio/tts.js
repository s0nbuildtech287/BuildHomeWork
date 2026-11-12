function splitTtsChunks(text, maxLen = 170) {
  const normalized = String(text || '').replace(/\r?\n+/g, '. ').replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const sentences = normalized.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let current = '';

  for (const sentence of sentences) {
    if (sentence.length <= maxLen) {
      if (!current) {
        current = sentence;
      } else if (current.length + 1 + sentence.length <= maxLen) {
        current += ' ' + sentence;
      } else {
        chunks.push(current);
        current = sentence;
      }
      continue;
    }

    if (current) {
      chunks.push(current);
      current = '';
    }

    const words = sentence.split(/\s+/);
    for (const word of words) {
      if (!current) {
        current = word;
      } else if (current.length + 1 + word.length <= maxLen) {
        current += ' ' + word;
      } else {
        chunks.push(current);
        current = word;
      }
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

function resolveLang(voice) {
  const v = String(voice || '');
  if (v.startsWith('en-GB')) return 'en-GB';
  if (v.startsWith('en-AU')) return 'en-AU';
  return 'en-US';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, voice = 'en-US-AriaNeural' } = req.body || {};
    const cleanText = String(text || '').trim();

    if (!cleanText) {
      return res.status(400).json({ error: 'Chưa có nội dung bài nghe để tạo file MP3.' });
    }
    if (cleanText.length > 5000) {
      return res.status(400).json({ error: 'Nội dung bài nghe quá dài (tối đa 5.000 ký tự).' });
    }

    const chunks = splitTtsChunks(cleanText, 170);
    if (chunks.length === 0) {
      return res.status(400).json({ error: 'Không có nội dung hợp lệ để tạo MP3.' });
    }

    const tl = resolveLang(voice);
    const buffers = [];

    for (const chunk of chunks) {
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
        chunk
      )}&tl=${encodeURIComponent(tl)}&client=tw-ob`;

      const ttsRes = await fetch(ttsUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          Referer: 'https://translate.google.com/',
        },
      });

      if (!ttsRes.ok) {
        throw new Error(`TTS upstream error (${ttsRes.status})`);
      }

      const arrBuf = await ttsRes.arrayBuffer();
      buffers.push(Buffer.from(arrBuf));
    }

    const combined = Buffer.concat(buffers);
    if (combined.length === 0) {
      throw new Error('Empty audio buffer');
    }

    const dataUrl = `data:audio/mpeg;base64,${combined.toString('base64')}`;
    return res.status(200).json({ audioUrl: dataUrl });
  } catch (err) {
    return res.status(500).json({
      error:
        err instanceof Error
          ? `Không tạo được file MP3 trên máy chủ: ${err.message}`
          : 'Không tạo được file MP3 cho bài nghe.',
    });
  }
}
