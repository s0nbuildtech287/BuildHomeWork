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
      kind: 'text';
      name: string;
      sizeBytes: number;
      content: string;
    };

const MAX_TEXT_CHARS = 15000;
const MAX_BINARY_BYTES = 12 * 1024 * 1024; // 12 MB

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error(`Không đọc được tệp "${file.name}".`));
    reader.readAsDataURL(file);
  });
}

export async function extractAttachedMaterial(file: File): Promise<AttachedMaterial> {
  const id = `mat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const lowerName = file.name.toLowerCase();

  // Images
  if (file.type.startsWith('image/')) {
    if (file.size > MAX_BINARY_BYTES) {
      throw new Error(`Ảnh "${file.name}" quá lớn (tối đa 12MB).`);
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
      throw new Error(`File PDF "${file.name}" quá lớn (tối đa 12MB).`);
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
    `Chưa hỗ trợ định dạng tệp "${file.name}". Hãy dùng ảnh, Word (.docx), PDF (.pdf) hoặc file chữ (.txt).`
  );
}

