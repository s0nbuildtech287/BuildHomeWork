const SUBJECT_FEED_QUERIES = {
  english: [
    {
      sourceName: 'BBC Learning / VOA / News',
      url: 'https://news.google.com/rss/search?q=%22%C4%91%E1%BB%81+thi+ti%E1%BA%BFng+anh%22+OR+%22b%C3%A0i+t%E1%BA%ADp+ti%E1%BA%BFng+anh%22+OR+%22IELTS+reading%22&hl=vi&gl=VN&ceid=VN:vi',
    },
    {
      sourceName: 'English Reading (EN)',
      url: 'https://news.google.com/rss/search?q=education+OR+science+OR+environment+when:7d&hl=en-US&gl=US&ceid=US:en',
    },
  ],
  math: [
    {
      sourceName: 'Tin Toán học & Đề thi',
      url: 'https://news.google.com/rss/search?q=%22%C4%91%E1%BB%81+thi+to%C3%A1n%22+OR+%22%C4%91%E1%BB%81+ki%E1%BB%83m+tra+to%C3%A1n%22+OR+%22to%C3%A1n+v%C3%A0o+10%22&hl=vi&gl=VN&ceid=VN:vi',
    },
  ],
  physics: [
    {
      sourceName: 'Tin Vật Lý & Đề thi',
      url: 'https://news.google.com/rss/search?q=%22%C4%91%E1%BB%81+thi+v%E1%BA%ADt+l%C3%BD%22+OR+%22%C4%91%E1%BB%81+thi+th%E1%BB%AD+v%E1%BA%ADt+l%C3%BD%22&hl=vi&gl=VN&ceid=VN:vi',
    },
  ],
  chemistry: [
    {
      sourceName: 'Tin Hóa học & Đề thi',
      url: 'https://news.google.com/rss/search?q=%22%C4%91%E1%BB%81+thi+h%C3%B3a+h%E1%BB%8Dc%22+OR+%22%C4%91%E1%BB%81+thi+th%E1%BB%AD+h%C3%B3a%22&hl=vi&gl=VN&ceid=VN:vi',
    },
  ],
  literature: [
    {
      sourceName: 'Tin Ngữ Văn & Đề thi',
      url: 'https://news.google.com/rss/search?q=%22%C4%91%E1%BB%81+thi+ng%E1%BB%AF+v%C4%83n%22+OR+%22%C4%91%E1%BB%81+v%C4%83n+v%C3%A0o+10%22&hl=vi&gl=VN&ceid=VN:vi',
    },
  ],
  history: [
    {
      sourceName: 'Tin Lịch Sử & Đề thi',
      url: 'https://news.google.com/rss/search?q=%22%C4%91%E1%BB%81+thi+l%E1%BB%8Bch+s%E1%BB%AD%22+OR+%22t%C6%B0+li%E1%BB%87u+l%E1%BB%8Bch+s%E1%BB%AD%22&hl=vi&gl=VN&ceid=VN:vi',
    },
  ],
  geography: [
    {
      sourceName: 'Tin Địa Lý & Đề thi',
      url: 'https://news.google.com/rss/search?q=%22%C4%91%E1%BB%81+thi+%C4%91%E1%BB%8Ba+l%C3%BD%22+OR+%22b%E1%BA%A3ng+s%E1%BB%91+li%E1%BB%87u+%C4%91%E1%BB%8Ba+l%C3%BD%22&hl=vi&gl=VN&ceid=VN:vi',
    },
  ],
};

function decodeXml(str) {
  return (str || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTag(block, tagName) {
  const re = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = block.match(re);
  return match ? decodeXml(match[1]) : '';
}

function parseRssItems(xml, subject, fallbackSourceName) {
  const items = [];
  const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const rawTitle = extractTag(block, 'title');
    const link = extractTag(block, 'link');
    const pubDate = extractTag(block, 'pubDate');
    const description = extractTag(block, 'description');
    const sourceTag = extractTag(block, 'source');

    if (!rawTitle || !link) continue;

    // Google News titles often end with " - SourceName"
    let title = rawTitle;
    let sourceName = sourceTag || fallbackSourceName;
    const dashIdx = rawTitle.lastIndexOf(' - ');
    if (dashIdx > 15 && !sourceTag) {
      title = rawTitle.slice(0, dashIdx).trim();
      sourceName = rawTitle.slice(dashIdx + 3).trim();
    } else if (dashIdx > 15 && sourceTag && rawTitle.endsWith(` - ${sourceTag}`)) {
      title = rawTitle.slice(0, dashIdx).trim();
    }

    items.push({
      id: `${subject}_${items.length}_${Buffer.from(link).toString('base64').slice(-12)}`,
      subject,
      title,
      link,
      sourceName: sourceName || 'Tin giáo dục',
      pubDate: pubDate || new Date().toISOString(),
      summary: description && description !== rawTitle ? description : '',
    });

    if (items.length >= 12) break;
  }
  return items;
}

async function fetchSingleFeed(feed, subject) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(feed.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EduLabBot/1.0)',
        Accept: 'application/rss+xml, application/xml, text/xml',
      },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRssItems(xml, subject, feed.sourceName);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchSubjectNewsFeed(subject = 'all') {
  const subjectsToFetch =
    subject && subject !== 'all' && SUBJECT_FEED_QUERIES[subject]
      ? [subject]
      : Object.keys(SUBJECT_FEED_QUERIES);

  const tasks = [];
  for (const subj of subjectsToFetch) {
    const feeds = SUBJECT_FEED_QUERIES[subj] || [];
    for (const feed of feeds) {
      tasks.push(fetchSingleFeed(feed, subj));
    }
  }

  const settled = await Promise.allSettled(tasks);
  const allItems = [];
  const seenLinks = new Set();

  for (const res of settled) {
    if (res.status !== 'fulfilled') continue;
    for (const item of res.value) {
      if (seenLinks.has(item.link)) continue;
      seenLinks.add(item.link);
      allItems.push(item);
    }
  }

  allItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  return allItems.slice(0, 36);
}
