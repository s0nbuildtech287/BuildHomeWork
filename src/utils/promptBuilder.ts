import {
  GeneratorConfig,
  Homework,
  HomeworkSection,
  Question,
  QuestionType,
  TargetLevel,
} from '../types';
import { stripOptionPrefix } from './grading';

const LEVEL_DESCRIPTIONS: Record<TargetLevel, string> = {
  elementary:
    'Học sinh Tiểu học Việt Nam (lớp 1–5). Ngôn ngữ đơn giản, gần gũi (gia đình, trường học, đồ vật, động vật, hoạt động hàng ngày), câu ngắn, tránh thuật ngữ ngữ pháp hàn lâm, giải thích tiếng Việt thật dễ hiểu cho bé và phụ huynh.',
  secondary:
    'Học sinh THCS / THPT Việt Nam (lớp 6–12, bám sát chương trình SGK Global Success / Friends Plus / ôn thi vào 10 & THPT). Câu hỏi có độ phân hóa rõ, bẫy ngữ pháp tự nhiên, giải thích rõ cấu trúc/ngữ pháp bằng tiếng Việt.',
  communication:
    'Học viên Tiếng Anh Giao tiếp / Trung tâm (người đi làm hoặc sinh viên). Tình huống hội thoại tự nhiên, cụm từ thông dụng (collocations, phrasal verbs, functional English), giải thích ngữ cảnh sử dụng thực tế.',
};

const DIFFICULTY_LABELS: Record<GeneratorConfig['difficulty'], string> = {
  easy: 'Cơ bản / Nhẹ nhàng (củng cố kiến thức vừa học)',
  medium: 'Trung bình / Chuẩn bài tập về nhà',
  hard: 'Khá - Giỏi / Nâng cao (có câu phân hóa)',
};

export function createId(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
}

export interface TextDocumentInput {
  name: string;
  content: string;
}

export function buildHomeworkPrompt(
  config: GeneratorConfig,
  hasAttachedBinaryFiles = false,
  textDocuments: TextDocumentInput[] = [],
  hasAttachedAudio = false
): string {
  const requestedParts: string[] = [];

  if (config.counts.multiple_choice > 0) {
    requestedParts.push(
      `- "multiple_choice": ${config.counts.multiple_choice} câu trắc nghiệm 4 lựa chọn (options gồm đúng 4 chuỗi không kèm tiền tố A./B./C./D., correctAnswer ghi chính xác nội dung đáp án đúng).`
    );
  }
  if (config.counts.fill_blank > 0) {
    requestedParts.push(
      `- "fill_blank": ${config.counts.fill_blank} câu điền từ vào chỗ trống (dùng ______ cho chỗ trống; có thể đặt gợi ý dạng (go) trong câu hoặc field hint; không dùng nhiều chỗ trống trong 1 câu để học sinh có thể tự chấm online).`
    );
  }
  if (config.counts.word_form > 0) {
    requestedParts.push(
      `- "word_form": ${config.counts.word_form} câu chia dạng đúng của từ / động từ (trong prompt ghi rõ từ gốc trong ngoặc, ví dụ: "She (go) ______ to school every day." hoặc "This book is very ______ (INTEREST)."; correctAnswer là từ/cụm từ đúng).`
    );
  }
  if (config.counts.sentence_order > 0) {
    requestedParts.push(
      `- "sentence_order": ${config.counts.sentence_order} câu sắp xếp từ thành câu hoàn chỉnh (field "words" là mảng các từ/cụm từ đã xáo trộn, "prompt" mô tả ngắn nếu cần, "correctAnswer" là câu hoàn chỉnh viết hoa đầu câu và có dấu câu cuối).`
    );
  }
  if (config.counts.rewrite > 0) {
    requestedParts.push(
      `- "rewrite": ${config.counts.rewrite} câu viết lại câu / sửa lỗi (ghi rõ câu gốc và phần gợi ý bắt đầu hoặc từ khóa trong ngoặc; "correctAnswer" ghi đáp án chuẩn, nếu có nhiều cách đúng ngăn cách bởi " | ").`
    );
  }
  if (config.counts.reading_questions > 0) {
    requestedParts.push(
      `- 1 section Đọc hiểu (type: "multiple_choice") có field "readingPassage" (đoạn văn tiếng Anh phù hợp trình độ, khoảng 80-160 từ) kèm ${config.counts.reading_questions} câu hỏi trắc nghiệm hiểu bài.`
    );
  }
  if (config.counts.find_mistake > 0) {
    requestedParts.push(
      `- "find_mistake": ${config.counts.find_mistake} câu Tìm lỗi sai (trong "prompt" đánh dấu 4 cụm từ bằng (A), (B), (C), (D), ví dụ: "She (A) go to (B) school (C) by bus (D) every morning."; "options" gồm đúng 4 cụm tương ứng không kèm chữ cái A/B/C/D hoặc ghi ngắn gọn đúng cụm từ đó; "correctAnswer" là phần bị sai cần sửa; "explanation" nêu rõ lỗi sai và cách sửa đúng bằng tiếng Việt).`
    );
  }
  if (config.counts.listening_questions > 0 || hasAttachedAudio) {
    const listenCount = config.counts.listening_questions > 0 ? config.counts.listening_questions : 4;
    const style = config.listeningStyle || 'multiple_choice';

    let styleInstruction =
      'Dạng Trắc nghiệm nghe hiểu (type: "multiple_choice", mỗi câu có 4 lựa chọn A/B/C/D).';
    if (style === 'note_fill') {
      styleInstruction =
        'Dạng ĐIỀN TỪ / ĐIỀN PHIẾU KHÔNG CHO ĐÁP ÁN GỢI Ý (kiểu IELTS Note/Form Completion): section có "type": "fill_blank", "wordBank": [] (BẮT BUỘC ĐỂ RỖNG), "instruction": "Write ONE WORD AND/OR A NUMBER for each answer.". Mỗi câu "prompt" là 1 dòng ghi chú ngắn có chỗ trống ______ ở giữa hoặc cuối câu (VD: "Postcode: ______", "Got on bus at ______ Street", "Reason for trip: visit to the ______"); có thể dùng "readingPassage" làm tiêu đề/thông tin nền của phiếu nếu cần (không chứa đáp án). "correctAnswer" CHỈ là 1 từ hoặc con số khớp nguyên văn với "listeningScript".';
    } else if (style === 'matching_box') {
      styleInstruction =
        'Dạng NỐI THÔNG TIN TỪ BẢNG LỰA CHỌN A-G (kiểu Cambridge/IELTS Matching Box): section có "type": "fill_blank", field "wordBank" là mảng các lựa chọn đánh nhãn từ A trở đi (nhiều hơn số câu hỏi 1-2 phương án nhiễu, VD: ["A. experience on stage", "B. original, new ideas", "C. parenting skills", ...]), "instruction": "Choose the correct letter from the box next to each item.". Mỗi câu hỏi là 1 mục cần nối (VD: "Fundraising"), "type": "fill_blank", "correctAnswer" ghi chữ cái đúng kèm nội dung cách nhau bởi | (VD: "E | E. retail experience | retail experience").';
    } else if (style === 'true_false') {
      styleInstruction =
        'Dạng Đúng / Sai (type: "multiple_choice", mỗi câu có đúng 2 lựa chọn "options": ["True", "False"]).';
    }

    requestedParts.push(
      `- 1 section Bài Nghe (Listening, title có chữ "Listening") có field "listeningScript" (lời thoại / bài đọc tiếng Anh hoàn chỉnh 70-180 từ, KHÔNG dùng ký hiệu lạ, dùng câu tự nhiên dễ đọc thành âm thanh; nếu có file âm thanh đính kèm thì nghe đúng file âm thanh đó để chép lại nội dung vào "listeningScript") kèm ${listenCount} câu hỏi theo đúng định dạng sau: ${styleInstruction}`
    );
  }
  if (config.counts.writing > 0) {
    requestedParts.push(
      `- "writing": ${config.counts.writing} bài tập Viết (Writing — viết câu theo gợi ý hoặc viết đoạn văn ngắn/email phù hợp cấp học; "prompt" nêu rõ yêu cầu đề bài và gợi ý số từ/từ khóa; "correctAnswer" ghi bài viết mẫu tham khảo; "explanation" ghi tiêu chí chấm & cấu trúc cần dùng bằng tiếng Việt).`
    );
  }

  const binaryNote = hasAttachedBinaryFiles
    ? '\nLƯU Ý TÀI LIỆU / ẢNH / ÂM THANH ĐÍNH KÈM: Giáo viên có gửi kèm ảnh trang sách, file PDF hoặc file âm thanh (.mp3) của buổi học. Hãy đọc/nghe kỹ nội dung trong tệp đính kèm để ra bài tập bám sát chính xác.'
    : '';

  const docsSection =
    textDocuments.length > 0
      ? `\n\nTÀI LIỆU BUỔI HỌC GIÁO VIÊN ĐÍNH KÈM (New Words / Ngữ pháp):\nHãy bám sát các từ vựng và điểm ngữ pháp trong tài liệu dưới đây để tạo bài tập:\n${textDocuments
          .map((doc, idx) => `--- Tài liệu ${idx + 1}: ${doc.name} ---\n${doc.content}`)
          .join('\n\n')}`
      : '';

  const extraNote = config.extraInstructions?.trim()
    ? `\n- Yêu cầu bổ sung / Dạng bài khác từ giáo viên: ${config.extraInstructions.trim()}\n  (Nếu giáo viên yêu cầu thêm dạng bài khác như tìm từ khác loại / Odd one out, phát âm / trọng âm, tìm lỗi sai, dịch câu, hỏi đáp hội thoại, điền từ vào đoạn văn..., hãy tạo thêm section tương ứng và chọn "type" phù hợp nhất trong ["multiple_choice", "fill_blank", "word_form", "sentence_order", "rewrite"] để hệ thống hiển thị và tự chấm được; với bài phát âm/trọng âm nhớ in đậm hoặc đặt dấu * hoặc gạch chân phần âm cần xét rõ ràng bằng chữ hoa/ngoặc vuông, ví dụ: "ch[oo]se" hoặc gạch dưới ký hiệu dễ nhìn.)`
    : '';

  return `Bạn là chuyên gia sư phạm tiếng Anh tại Việt Nam. Hãy soạn một bộ BÀI TẬP VỀ NHÀ chất lượng cao, chính xác 100% về ngữ pháp và ngữ nghĩa.

THÔNG TIN BUỔI HỌC:
- Đối tượng: ${LEVEL_DESCRIPTIONS[config.level]}
- Lớp / Nhóm học sinh: ${config.gradeOrClass || 'Không chỉ định'}
- Mức độ bài tập: ${DIFFICULTY_LABELS[config.difficulty]}
- Chủ đề / Bài học hôm nay: ${config.topic || 'Theo nội dung đính kèm'}
- Ngữ pháp trọng tâm: ${config.grammarFocus || 'Tổng hợp phù hợp chủ đề'}
- Từ vựng cần ôn: ${config.vocabularyFocus || 'Từ vựng liên quan chủ đề'}
- Lỗi học sinh hay nhầm cần nhấn mạnh: ${config.studentMistakes || 'Không có ghi chú thêm'}${extraNote}${binaryNote}${docsSection}

YÊU CẦU CẤU TRÚC CÁC PHẦN:
${requestedParts.length > 0 ? requestedParts.join('\n') : '- Tạo các phần bài tập theo đúng yêu cầu bổ sung của giáo viên ở trên.'}

QUY ĐỊNH ĐỊNH DẠNG ĐẦU RA (BẮT BUỘC):
Chỉ trả về DUY NHẤT một khối JSON hợp lệ (không giải thích thừa ngoài JSON), tuân thủ schema sau:
{
  "title": "Tên bài tập tiếng Anh ngắn gọn (VD: Homework - Unit 4: Present Continuous)",
  "subtitle": "Mô tả ngắn bằng tiếng Việt (VD: Ôn tập thì Hiện tại tiếp diễn & Từ vựng thời tiết)",
  "topicSummary": "Tóm tắt 1 dòng nội dung trọng tâm",
  "estimatedMinutes": 15,
  "sections": [
    {
      "title": "Part I. Multiple Choice",
      "instruction": "Choose the best answer A, B, C, or D to complete each sentence.",
      "type": "multiple_choice",
      "readingPassage": "",
      "listeningScript": "",
      "wordBank": [],
      "questions": [
        {
          "type": "multiple_choice",
          "prompt": "Look! The children ______ football in the yard now.",
          "options": ["play", "are playing", "plays", "played"],
          "words": [],
          "hint": "",
          "correctAnswer": "are playing",
          "explanation": "Có dấu hiệu 'Look!' và 'now' -> dùng thì Hiện tại tiếp diễn (are + V-ing)."
        }
      ]
    }
  ]
}

LƯU Ý QUAN TRỌNG:
1. Tạo ĐÚNG VÀ ĐỦ số lượng câu hỏi đã yêu cầu ở từng phần (không tự ý cắt bớt).
2. Field "type" bắt buộc chọn đúng 1 trong các giá trị: "multiple_choice", "fill_blank", "word_form", "sentence_order", "rewrite", "find_mistake", "writing" (ví dụ: Tìm lỗi sai dùng "find_mistake", Bài viết dùng "writing").
3. Mỗi câu chỉ có 1 đáp án chính xác rõ ràng (hoặc ghi các biến thể chấp nhận được cách nhau bởi " | " cho câu điền từ/viết lại câu).
4. Mọi câu đều phải có "explanation" bằng tiếng Việt súc tích, ngắn gọn (1 câu rõ ý để đảm bảo đủ dung lượng khi tạo đề dài 30-50 câu).
5. Đảm bảo JSON hợp lệ hoàn toàn (escape dấu ngoặc kép nếu có trong chuỗi).`;
}

function normalizeQuestionType(raw: unknown, fallback: QuestionType): QuestionType {
  const allowed: QuestionType[] = [
    'multiple_choice',
    'fill_blank',
    'word_form',
    'sentence_order',
    'rewrite',
    'find_mistake',
    'writing',
  ];
  if (typeof raw === 'string' && allowed.includes(raw as QuestionType)) {
    return raw as QuestionType;
  }
  return fallback;
}

/**
 * Extracts and validates a Homework object from raw AI text (supports markdown code fences).
 */
export function parseAiHomeworkResponse(
  rawText: string,
  defaults: {
    level: TargetLevel;
    gradeOrClass?: string;
    teacherName?: string;
    centerName?: string;
  }
): Homework {
  let cleaned = (rawText || '').trim();

  // Strip ```json ... ``` or ``` ... ```
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1]) {
    cleaned = fenceMatch[1].trim();
  }

  // Fallback: slice from first { to last }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      'Không đọc được định dạng JSON từ kết quả AI. Bạn hãy thử bấm tạo lại hoặc copy đầy đủ đoạn JSON từ AI nhé.'
    );
  }

  const rawSections = Array.isArray(parsed.sections) ? parsed.sections : [];
  if (rawSections.length === 0) {
    throw new Error('Kết quả AI chưa có danh sách phần bài tập (sections).');
  }

  const sections: HomeworkSection[] = rawSections
    .map((secRaw, sIdx): HomeworkSection | null => {
      if (!secRaw || typeof secRaw !== 'object') return null;
      const sec = secRaw as Record<string, unknown>;
      const secType = normalizeQuestionType(sec.type, 'multiple_choice');
      const rawQuestions = Array.isArray(sec.questions) ? sec.questions : [];

      const questions: Question[] = rawQuestions
        .map((qRaw, qIdx): Question | null => {
          if (!qRaw || typeof qRaw !== 'object') return null;
          const q = qRaw as Record<string, unknown>;
          const qType = normalizeQuestionType(q.type, secType);

          const options = Array.isArray(q.options)
            ? q.options.map((o) => stripOptionPrefix(String(o))).filter(Boolean)
            : undefined;

          const words = Array.isArray(q.words)
            ? q.words.map((w) => String(w).trim()).filter(Boolean)
            : undefined;

          let correctAnswer = String(q.correctAnswer ?? '').trim();
          if (
            (qType === 'multiple_choice' || qType === 'find_mistake') &&
            options &&
            options.length > 0
          ) {
            // If AI returned "B" or "B. goes", resolve to clean option text when unambiguous
            const letterOnly = correctAnswer.match(/^([A-Da-d])(?:[.)])?$/);
            if (letterOnly) {
              const idx = letterOnly[1].toUpperCase().charCodeAt(0) - 65;
              if (options[idx]) correctAnswer = options[idx];
            } else {
              correctAnswer = stripOptionPrefix(correctAnswer);
            }
          }

          const prompt = String(q.prompt ?? '').trim();
          if (!prompt && (!words || words.length === 0)) return null;

          return {
            id: createId(`q${sIdx}_${qIdx}`),
            type: qType,
            prompt: prompt || 'Arrange the words to make a correct sentence.',
            options: options && options.length > 0 ? options : undefined,
            words: words && words.length > 0 ? words : undefined,
            hint: q.hint ? String(q.hint).trim() : undefined,
            correctAnswer,
            explanation: String(q.explanation ?? 'Xem lại cấu trúc câu đã học.').trim(),
          };
        })
        .filter((x): x is Question => x !== null);

      if (questions.length === 0) return null;

      const wordBank = Array.isArray(sec.wordBank)
        ? sec.wordBank.map((w) => String(w).trim()).filter(Boolean)
        : undefined;

      return {
        id: createId(`sec${sIdx}`),
        title: String(sec.title ?? `Part ${sIdx + 1}`).trim(),
        instruction: String(sec.instruction ?? 'Complete the exercises below.').trim(),
        type: secType,
        readingPassage: sec.readingPassage ? String(sec.readingPassage).trim() : undefined,
        listeningScript: sec.listeningScript ? String(sec.listeningScript).trim() : undefined,
        wordBank: wordBank && wordBank.length > 0 ? wordBank : undefined,
        questions,
      };
    })
    .filter((x): x is HomeworkSection => x !== null);

  if (sections.length === 0) {
    throw new Error('Không tìm thấy câu hỏi hợp lệ nào trong kết quả AI.');
  }

  const now = new Date().toISOString();
  return {
    id: createId('hw'),
    title: String(parsed.title ?? 'English Homework').trim(),
    subtitle: parsed.subtitle ? String(parsed.subtitle).trim() : undefined,
    level: defaults.level,
    gradeOrClass: defaults.gradeOrClass || undefined,
    teacherName: defaults.teacherName || undefined,
    centerName: defaults.centerName || undefined,
    topicSummary: String(parsed.topicSummary ?? parsed.subtitle ?? 'Bài tập tiếng Anh').trim(),
    estimatedMinutes:
      typeof parsed.estimatedMinutes === 'number' && parsed.estimatedMinutes > 0
        ? parsed.estimatedMinutes
        : 15,
    createdAt: now,
    updatedAt: now,
    sections,
  };
}

