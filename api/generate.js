export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const serverKey = process.env.GEMINI_API_KEY;
  if (!serverKey) {
    return res.status(400).json({
      error: 'Chưa cấu hình GEMINI_API_KEY trong Environment Variables trên Vercel.',
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
      if (![404, 429, 503].includes(upstream.status)) {
        break;
      }
    }

    return res.status(lastStatus).json(lastData);
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Lỗi kết nối Gemini API' });
  }
}

