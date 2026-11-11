import mammoth from 'mammoth';

export type AttachedMaterial =
  | {
      id: string;
      kind: 'image';
      name: string;
      sizeBytes: number;
      mimeType: string;
      base64Data: string;
      previewUrl: string;
    }
  | {
      id: string;
      kind: 'pdf';
      name: string;
      sizeBytes: number;
      mimeType: 'application/pdf';
      base64Data: string;
    }
  | {
      id: string;
      kind: 'audio';
      name: string;
      sizeBytes: number;
      mimeType: string;
      base64Data: string;
      previewUrl: string;
    }
  | {
      id: string;
      kind: 'text';
      name: string;
      sizeBytes: number;
      content: string;
    };

const MAX_TEXT_CHARS = 15000;
const MAX_BINARY_BYTES = 15 * 1024 * 1024; // 15 MB

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error(`Không đọc được tệp "${file.name}".`));
    reader.readAsDataURL(file);
  });
}

function inferAudioMimeType(file: File): string {
  if (file.type && file.type.startsWith('audio/')) return file.type;
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.m4a')) return 'audio/mp4';
  if (lower.endsWith('.ogg')) return 'audio/ogg';
  return 'audio/mpeg';
}

export async function extractAttachedMaterial(file: File): Promise<AttachedMaterial> {
  const id = `mat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const lowerName = file.name.toLowerCase();

  // Audio (.mp3, .wav, .m4a, .ogg)
  if (
    file.type.startsWith('audio/') ||
    lowerName.endsWith('.mp3') ||
    lowerName.endsWith('.wav') ||
    lowerName.endsWith('.m4a') ||
    lowerName.endsWith('.ogg')
  ) {
    if (file.size > MAX_BINARY_BYTES) {
      throw new Error(`File âm thanh "${file.name}" quá lớn (tối đa 15MB).`);
    }
    const dataUrl = await readFileAsDataUrl(file);
    const commaIdx = dataUrl.indexOf(',');
    if (commaIdx < 0) throw new Error(`Không đọc được dữ liệu âm thanh "${file.name}".`);
    return {
      id,
      kind: 'audio',
      name: file.name,
      sizeBytes: file.size,
      mimeType: inferAudioMimeType(file),
      base64Data: dataUrl.slice(commaIdx + 1),
      previewUrl: dataUrl,
    };
  }

  // Images
  if (file.type.startsWith('image/')) {
    if (file.size > MAX_BINARY_BYTES) {
      throw new Error(`Ảnh "${file.name}" quá lớn (tối đa 15MB).`);
    }
    const dataUrl = await readFileAsDataUrl(file);
    const commaIdx = dataUrl.indexOf(',');
    if (commaIdx < 0) throw new Error(`Không đọc được dữ liệu ảnh "${file.name}".`);
    return {
      id,
      kind: 'image',
      name: file.name,
      sizeBytes: file.size,
      mimeType: file.type,
      base64Data: dataUrl.slice(commaIdx + 1),
      previewUrl: dataUrl,
    };
  }

  // PDF
  if (file.type === 'application/pdf' || lowerName.endsWith('.pdf')) {
    if (file.size > MAX_BINARY_BYTES) {
      throw new Error(`File PDF "${file.name}" quá lớn (tối đa 15MB).`);
    }
    const dataUrl = await readFileAsDataUrl(file);
    const commaIdx = dataUrl.indexOf(',');
    if (commaIdx < 0) throw new Error(`Không đọc được file PDF "${file.name}".`);
    return {
      id,
      kind: 'pdf',
      name: file.name,
      sizeBytes: file.size,
      mimeType: 'application/pdf',
      base64Data: dataUrl.slice(commaIdx + 1),
    };
  }

  // Word .docx
  if (
    lowerName.endsWith('.docx') ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = (result.value || '').trim();
    if (!text) {
      throw new Error(`File Word "${file.name}" không có nội dung chữ để đọc.`);
    }
    return {
      id,
      kind: 'text',
      name: file.name,
      sizeBytes: file.size,
      content: text.slice(0, MAX_TEXT_CHARS),
    };
  }

  // Legacy .doc warning
  if (lowerName.endsWith('.doc')) {
    throw new Error(
      `File "${file.name}" đang ở định dạng Word cũ (.doc). Hãy lưu lại thành .docx hoặc .pdf trong Word rồi tải lên nhé.`
    );
  }

  // Plain text / Markdown / CSV
  if (
    file.type.startsWith('text/') ||
    lowerName.endsWith('.txt') ||
    lowerName.endsWith('.md') ||
    lowerName.endsWith('.csv')
  ) {
    const text = (await file.text()).trim();
    if (!text) {
      throw new Error(`File "${file.name}" đang bị trống.`);
    }
    return {
      id,
      kind: 'text',
      name: file.name,
      sizeBytes: file.size,
      content: text.slice(0, MAX_TEXT_CHARS),
    };
  }

  throw new Error(
    `Chưa hỗ trợ định dạng tệp "${file.name}". Hãy dùng ảnh, âm thanh (.mp3), Word (.docx), PDF (.pdf) hoặc file chữ (.txt).`
  );
}
