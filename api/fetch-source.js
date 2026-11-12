import { fetchAndExtractSource } from './_htmlExtractor.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body || {};
  try {
    const result = await fetchAndExtractSource(url);
    return res.status(200).json(result);
  } catch (err) {
    const status = err?.status || 500;
    return res.status(status).json({
      error: err?.message || 'Không lấy được nội dung từ đường dẫn này.',
    });
  }
}

