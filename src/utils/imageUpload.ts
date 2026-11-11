import React from 'react';

const MAX_IMAGE_WIDTH = 1100;

/**
 * Normalizes any uploaded or pasted image (including WebP/large screenshots)
 * into a crisp PNG or JPEG so Word (.docx), PDF, and web all render cleanly.
 */
async function normalizeImageToDataUrl(file: Blob): Promise<{
  dataUrl: string;
  mimeType: 'image/png' | 'image/jpeg';
  base64Data: string;
  filename: string;
}> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Không đọc được định dạng ảnh này.'));
      el.src = objectUrl;
    });

    const scale = img.naturalWidth > MAX_IMAGE_WIDTH ? MAX_IMAGE_WIDTH / img.naturalWidth : 1;
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Trình duyệt không hỗ trợ xử lý ảnh.');
    ctx.drawImage(img, 0, 0, width, height);

    const preferPng = file.type === 'image/png' && width * height <= 900 * 900;
    const mimeType: 'image/png' | 'image/jpeg' = preferPng ? 'image/png' : 'image/jpeg';
    const dataUrl = preferPng
      ? canvas.toDataURL('image/png')
      : canvas.toDataURL('image/jpeg', 0.88);
    const commaIdx = dataUrl.indexOf(',');
    return {
      dataUrl,
      mimeType,
      base64Data: commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : '',
      filename: preferPng ? 'image.png' : 'image.jpg',
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function uploadQuestionImage(file: Blob): Promise<string> {
  const { dataUrl, mimeType, base64Data, filename } = await normalizeImageToDataUrl(file);
  try {
    const res = await fetch('/api/images/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, base64Data, mimeType }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.imageUrl) return String(data.imageUrl);
    }
  } catch {
    // Fallback to inline data URL when running offline
  }
  return dataUrl;
}

export function extractClipboardImage(e: React.ClipboardEvent): File | null {
  const items = e.clipboardData?.items;
  if (!items) return null;
  for (const item of Array.from(items)) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) return file;
    }
  }
  return null;
}

