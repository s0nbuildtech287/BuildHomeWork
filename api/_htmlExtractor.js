const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^::1$/,
  /^0\.0\.0\.0$/,
  /\.local$/i,
];

function decodeHtmlEntities(str) {
  return (str || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&ndash;/gi, '–')
    .replace(/&mdash;/gi, '—')
    .replace(/&#(\d+);/g, (_, num) => {
      const code = Number(num);
      return Number.isFinite(code) ? String.fromCharCode(code) : '';
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCharCode(code) : '';
    });
}

function extractReadableTextFromHtml(html) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeHtmlEntities(titleMatch[1]).replace(/\s+/g, ' ').trim() : '';

  // Prefer <article> or <main> if present and substantial
  const articleMatch = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  const mainMatch = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  let body =
    (articleMatch && articleMatch[1].length > 400 && articleMatch[1]) ||
    (mainMatch && mainMatch[1].length > 400 && mainMatch[1]) ||
    html;

  body = body
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|iframe|nav|header|footer|aside)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h[1-6]|section|blockquote)>/gi, '\n')
    .replace(/<(li)\b[^>]*>/gi, '\n• ')
    .replace(/<[^>]+>/g, ' ');

  const decoded = decodeHtmlEntities(body);
  const lines = decoded
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter((line) => line.length > 0);

  const text = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return {
    title,
    content: text.slice(0, 20000),
  };
}

export async function fetchAndExtractSource(rawUrl) {
  let parsedUrl;
  try {
    parsedUrl = new URL(String(rawUrl || '').trim());
  } catch {
    const err = new Error('Đường dẫn URL không hợp lệ. Hãy nhập đầy đủ https://...');
    err.status = 400;
    throw err;
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    const err = new Error('Chỉ hỗ trợ đường dẫn http:// hoặc https://.');
    err.status = 400;
    throw err;
  }

  const host = parsedUrl.hostname;
  if (BLOCKED_HOST_PATTERNS.some((re) => re.test(host))) {
    const err = new Error('Không hỗ trợ truy cập địa chỉ nội bộ.');
    err.status = 400;
    throw err;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);

  let response;
  try {
    response = await fetch(parsedUrl.toString(), {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });
  } catch (err) {
    const msg =
      err?.name === 'AbortError'
        ? 'Trang web phản hồi quá chậm (quá 12 giây).'
        : 'Không thể kết nối tới trang web này. Bạn có thể copy trực tiếp nội dung đề để lưu vào kho nguồn.';
    const wrapped = new Error(msg);
    wrapped.status = 502;
    throw wrapped;
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 401 || response.status === 403 || response.status === 429) {
    const err = new Error(
      `Trang web từ chối truy cập tự động (HTTP ${response.status} / chống bot). Hãy mở trang trên trình duyệt và copy đoạn đề dán vào bên dưới.`
    );
    err.status = 422;
    throw err;
  }

  if (!response.ok) {
    const err = new Error(`Không tải được trang web (HTTP ${response.status}).`);
    err.status = 422;
    throw err;
  }

  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  if (
    !contentType.includes('text/html') &&
    !contentType.includes('text/plain') &&
    !contentType.includes('application/xhtml')
  ) {
    const err = new Error(
      'Link này không phải trang web chữ/HTML (có thể là file PDF hoặc ảnh). Bạn hãy tải file về và đính kèm trực tiếp ở mục tạo đề nhé.'
    );
    err.status = 422;
    throw err;
  }

  const rawText = await response.text();
  const lower = rawText.toLowerCase();
  if (
    lower.includes('cf-browser-verification') ||
    lower.includes('checking your browser before accessing') ||
    lower.includes('just a moment...') ||
    lower.includes('g-recaptcha') ||
    lower.includes('hcaptcha')
  ) {
    const err = new Error(
      'Trang web có lớp bảo vệ chống bot / CAPTCHA nên không thể lấy tự động. Bạn hãy mở link trên trình duyệt và copy nội dung dán vào bên dưới nhé.'
    );
    err.status = 422;
    throw err;
  }

  if (contentType.includes('text/plain')) {
    return {
      title: parsedUrl.hostname,
      url: parsedUrl.toString(),
      content: rawText.trim().slice(0, 20000),
    };
  }

  const extracted = extractReadableTextFromHtml(rawText);
  if (!extracted.content || extracted.content.length < 40) {
    const err = new Error(
      'Trang web này tải nội dung bằng JavaScript động nên không đọc được chữ. Bạn hãy copy trực tiếp đề từ trình duyệt dán vào bên dưới nhé.'
    );
    err.status = 422;
    throw err;
  }

  return {
    title: extracted.title || parsedUrl.hostname,
    url: parsedUrl.toString(),
    content: extracted.content,
  };
}

