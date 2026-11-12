import { fetchSubjectNewsFeed } from './_feedFetcher.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const subject = typeof req.query?.subject === 'string' ? req.query.subject : 'all';
  try {
    const items = await fetchSubjectNewsFeed(subject);
    return res.status(200).json({ items });
  } catch (err) {
    return res.status(500).json({
      error: err?.message || 'Không tải được bảng tin nguồn tham khảo.',
    });
  }
}

