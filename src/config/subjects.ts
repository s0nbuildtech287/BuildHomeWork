import { SectionCountConfig, SubjectId, TargetLevel } from '../types';

export interface SubjectQuestionOption {
  key: keyof SectionCountConfig;
  label: string;
  desc: string;
}

export interface SubjectLevelOption {
  value: TargetLevel;
  label: string;
  desc: string;
}

export interface SubjectDefinition {
  id: SubjectId;
  name: string;
  shortName: string;
  tagline: string;
  badgeClass: string;
  accentBg: string;
  accentText: string;
  accentBorder: string;
  supportsStemOptions: boolean;
  supportsListening: boolean;
  defaultGrade: string;
  topicPlaceholder: string;
  focus1Label: string;
  focus1Placeholder: string;
  focus2Label: string;
  focus2Placeholder: string;
  mistakesLabel: string;
  mistakesPlaceholder: string;
  levels: SubjectLevelOption[];
  questionOptions: SubjectQuestionOption[];
  defaultCounts: Partial<SectionCountConfig>;
}

export const SUBJECT_LIST: SubjectDefinition[] = [
  {
    id: 'english',
    name: 'Tiếng Anh',
    shortName: 'Tiếng Anh',
    tagline: 'Nghe MP3, ngữ pháp, đọc hiểu, viết câu',
    badgeClass: 'bg-indigo-100 text-indigo-800',
    accentBg: 'bg-indigo-600',
    accentText: 'text-indigo-700',
    accentBorder: 'border-indigo-500',
    supportsStemOptions: false,
    supportsListening: true,
    defaultGrade: 'Lớp 7',
    topicPlaceholder: 'VD: Unit 3 - My Friends, Present Continuous, Environment...',
    focus1Label: 'Chủ điểm ngữ pháp trọng tâm',
    focus1Placeholder: 'VD: Hiện tại tiếp diễn, câu điều kiện loại 1, giới từ...',
    focus2Label: 'Từ vựng trọng tâm (nếu có)',
    focus2Placeholder: 'VD: friendly, creative, pollution, recycle...',
    mistakesLabel: 'Lỗi học sinh hay sai (AI sẽ bẫy nhẹ để luyện)',
    mistakesPlaceholder: 'VD: Hay quên chia -s/-es ngôi thứ 3 số ít, nhầm in/on/at...',
    levels: [
      { value: 'elementary', label: 'Tiểu học', desc: 'Lớp 1-5, từ vựng & câu đơn giản' },
      { value: 'secondary', label: 'THCS / THPT', desc: 'Bám sát SGK & đề thi' },
      { value: 'communication', label: 'Giao tiếp / IELTS', desc: 'Tình huống thực tế & học thuật' },
    ],
    questionOptions: [
      { key: 'pronunciation_stress', label: 'Phát âm & Trọng âm', desc: 'Tìm âm khác biệt & trọng âm (A/B/C/D)' },
      { key: 'multiple_choice', label: 'Trắc nghiệm (A/B/C/D)', desc: 'Ngữ pháp, từ vựng, giao tiếp' },
      { key: 'closest_meaning', label: 'Từ đồng nghĩa (CLOSEST in meaning)', desc: 'Câu ngữ cảnh có từ gạch chân + 4 đáp án A/B/C/D' },
      { key: 'announcement_cloze', label: 'Thông báo / Quảng cáo điền từ', desc: '1 tờ rơi/thông báo + câu hỏi A/B/C/D' },
      { key: 'paragraph_order', label: 'Sắp xếp đoạn văn (a-b-c-d)', desc: 'Chọn thứ tự đúng các câu thành đoạn' },
      { key: 'guided_cloze', label: 'Đọc điền đoạn văn (Cloze)', desc: '1 đoạn văn + các chỗ trống A/B/C/D' },
      { key: 'sentence_transform_mcq', label: 'Viết lại / Dựng câu (A/B/C/D)', desc: 'Chọn câu gần nghĩa hoặc dựng từ gợi ý' },
      { key: 'sign_notice', label: 'Đọc biển báo / Thông báo', desc: 'What does the sign say? (dán ảnh Ctrl+V)' },
      { key: 'reading_questions', label: 'Đọc hiểu (Reading)', desc: '1 đoạn văn + các câu hỏi A/B/C/D' },
      { key: 'removed_sentences', label: 'Ghép câu vào đoạn văn', desc: '4 cụm/câu bị lược A/B/C/D' },
      { key: 'fill_blank', label: 'Điền vào chỗ trống (Tự gõ)', desc: 'Điền từ / chia động từ' },
      { key: 'word_form', label: 'Chia dạng từ (Word Form)', desc: 'Danh / động / tính / trạng từ' },
      { key: 'sentence_order', label: 'Sắp xếp từ thành câu', desc: 'Sắp xếp từ cho sẵn' },
      { key: 'rewrite', label: 'Viết lại câu (Tự gõ)', desc: 'Giữ nguyên nghĩa / nối câu' },
      { key: 'find_mistake', label: 'Tìm lỗi sai (Find Mistake)', desc: '4 phần gạch chân A/B/C/D' },
      { key: 'listening_questions', label: 'Bài nghe (MP3 + Script)', desc: 'Tạo audio giọng đọc chuẩn' },
      { key: 'writing', label: 'Tự luận / Viết đoạn (Writing)', desc: 'Kèm dàn ý & bài mẫu' },
    ],
    defaultCounts: {
      multiple_choice: 6,
      fill_blank: 4,
      word_form: 3,
      sentence_order: 0,
      rewrite: 3,
      reading_questions: 4,
      find_mistake: 0,
      listening_questions: 0,
      writing: 0,
      true_false_group: 0,
      short_answer: 0,
      essay: 0,
    },
  },
  {
    id: 'math',
    name: 'Toán học',
    shortName: 'Toán',
    tagline: 'Đại số, hình học, công thức LaTeX & lời giải',
    badgeClass: 'bg-blue-100 text-blue-800',
    accentBg: 'bg-blue-600',
    accentText: 'text-blue-700',
    accentBorder: 'border-blue-500',
    supportsStemOptions: true,
    supportsListening: false,
    defaultGrade: 'Lớp 9',
    topicPlaceholder: 'VD: Phương trình bậc hai, Hệ thức Vi-ét, Hàm số bậc nhất...',
    focus1Label: 'Chuyên đề / Dạng toán trọng tâm',
    focus1Placeholder: 'VD: Tìm m để phương trình có 2 nghiệm phân biệt, giải bài toán bằng cách lập PT...',
    focus2Label: 'Công thức / Định lý cần áp dụng',
    focus2Placeholder: 'VD: Delta, định lý Vi-ét, hệ thức lượng trong tam giác vuông...',
    mistakesLabel: 'Lỗi học sinh hay mắc (để AI tạo câu phân loại)',
    mistakesPlaceholder: 'VD: Quên điều kiện xác định của căn thức, sai dấu khi chuyển vế...',
    levels: [
      { value: 'elementary', label: 'Tiểu học', desc: 'Lớp 1-5, số học & toán có lời văn' },
      { value: 'secondary', label: 'THCS (Lớp 6-9)', desc: 'Bám sát SGK & ôn thi vào 10' },
      { value: 'communication', label: 'THPT / Ôn THPT QG', desc: 'Cấu trúc mới: Đúng/Sai & Trả lời ngắn' },
    ],
    questionOptions: [
      { key: 'multiple_choice', label: 'Trắc nghiệm 4 lựa chọn', desc: 'Nhận biết, thông hiểu & tính toán' },
      { key: 'true_false_group', label: 'Đúng / Sai (4 ý a,b,c,d)', desc: 'Chuẩn cấu trúc đề thi 2025' },
      { key: 'short_answer', label: 'Trả lời ngắn (Điền đáp số)', desc: 'Học sinh tự tính & nhập kết quả' },
      { key: 'essay', label: 'Tự luận giải chi tiết', desc: 'Trình bày các bước giải / chứng minh' },
    ],
    defaultCounts: {
      multiple_choice: 6,
      true_false_group: 2,
      short_answer: 4,
      essay: 2,
    },
  },
  {
    id: 'physics',
    name: 'Vật Lý',
    shortName: 'Vật Lý',
    tagline: 'Cơ học, điện học, quang học & bài tập đơn vị SI',
    badgeClass: 'bg-violet-100 text-violet-800',
    accentBg: 'bg-violet-600',
    accentText: 'text-violet-700',
    accentBorder: 'border-violet-500',
    supportsStemOptions: true,
    supportsListening: false,
    defaultGrade: 'Lớp 10',
    topicPlaceholder: 'VD: Định luật II Newton, Dòng điện không đổi, Sóng cơ...',
    focus1Label: 'Chương / Hiện tượng vật lý trọng tâm',
    focus1Placeholder: 'VD: Chuyển động thẳng biến đổi đều, Định luật Ôm toàn mạch...',
    focus2Label: 'Công thức & Đại lượng cần ôn',
    focus2Placeholder: 'VD: F = ma, v = v0 + at, công suất P = UI...',
    mistakesLabel: 'Lỗi học sinh hay sai',
    mistakesPlaceholder: 'VD: Quên đổi cm sang m, km/h sang m/s, nhầm chiều lực ma sát...',
    levels: [
      { value: 'elementary', label: 'KHTN Cơ bản (6-7)', desc: 'Hiện tượng vật lý trực quan' },
      { value: 'secondary', label: 'THCS (Lớp 8-9)', desc: 'Bám sát chương trình KHTN mới' },
      { value: 'communication', label: 'THPT / Ôn THPT QG', desc: 'Lý thuyết & bài tập tính toán chuẩn' },
    ],
    questionOptions: [
      { key: 'multiple_choice', label: 'Trắc nghiệm 4 lựa chọn', desc: 'Lý thuyết hiện tượng & công thức' },
      { key: 'true_false_group', label: 'Đúng / Sai (4 ý a,b,c,d)', desc: 'Phân tích đồ thị, thí nghiệm' },
      { key: 'short_answer', label: 'Trả lời ngắn (Điền số)', desc: 'Tính đại lượng vật lý theo đơn vị SI' },
      { key: 'essay', label: 'Tự luận / Giải thích hiện tượng', desc: 'Trình bày công thức & lập luận' },
    ],
    defaultCounts: {
      multiple_choice: 8,
      true_false_group: 2,
      short_answer: 3,
      essay: 1,
    },
  },
  {
    id: 'chemistry',
    name: 'Hóa học',
    shortName: 'Hóa học',
    tagline: 'PTHH, phản ứng oxi hóa - khử & tính toán mol',
    badgeClass: 'bg-emerald-100 text-emerald-800',
    accentBg: 'bg-emerald-600',
    accentText: 'text-emerald-700',
    accentBorder: 'border-emerald-500',
    supportsStemOptions: true,
    supportsListening: false,
    defaultGrade: 'Lớp 11',
    topicPlaceholder: 'VD: Cân bằng hóa học, Axit - Bazơ - Muối, Este - Lipit...',
    focus1Label: 'Chuyên đề / Nhóm chất trọng tâm',
    focus1Placeholder: 'VD: Tính chất hóa học của kim loại kiềm, phản ứng este hóa...',
    focus2Label: 'Phương pháp / Định luật áp dụng',
    focus2Placeholder: 'VD: Bảo toàn khối lượng, bảo toàn electron, tăng giảm khối lượng...',
    mistakesLabel: 'Lỗi học sinh hay mắc',
    mistakesPlaceholder: 'VD: Cân bằng thiếu hệ số, quên điều kiện nhiệt độ/xúc tác, nhầm hóa trị...',
    levels: [
      { value: 'elementary', label: 'KHTN Cơ bản (6-7)', desc: 'Chất, nguyên tử, phân tử' },
      { value: 'secondary', label: 'THCS (Lớp 8-9)', desc: 'PTHH cơ bản, vô cơ & hữu cơ nền tảng' },
      { value: 'communication', label: 'THPT / Ôn THPT QG', desc: 'Hóa đại cương, vô cơ, hữu cơ nâng cao' },
    ],
    questionOptions: [
      { key: 'multiple_choice', label: 'Trắc nghiệm 4 lựa chọn', desc: 'Nhận biết chất, lý thuyết & tính mol' },
      { key: 'true_false_group', label: 'Đúng / Sai (4 ý a,b,c,d)', desc: 'Nhận định thí nghiệm & phản ứng' },
      { key: 'short_answer', label: 'Trả lời ngắn (Điền đáp số)', desc: 'Tính m, V, nồng độ %, CM' },
      { key: 'essay', label: 'Tự luận / Viết & cân bằng PTHH', desc: 'Chuỗi phản ứng, nhận biết chất' },
    ],
    defaultCounts: {
      multiple_choice: 8,
      true_false_group: 2,
      short_answer: 3,
      essay: 2,
    },
  },
  {
    id: 'literature',
    name: 'Ngữ Văn',
    shortName: 'Ngữ Văn',
    tagline: 'Đọc hiểu ngữ liệu, tiếng Việt & nghị luận có rubric',
    badgeClass: 'bg-rose-100 text-rose-800',
    accentBg: 'bg-rose-600',
    accentText: 'text-rose-700',
    accentBorder: 'border-rose-500',
    supportsStemOptions: false,
    supportsListening: false,
    defaultGrade: 'Lớp 9',
    topicPlaceholder: 'VD: Truyện Kiều, Chí Phèo, Nghị luận về tinh thần tự học...',
    focus1Label: 'Tác phẩm / Ngữ liệu / Chủ đề nghị luận',
    focus1Placeholder: 'VD: Đoạn trích Kiều ở lầu Ngưng Bích, thơ hiện đại Việt Nam...',
    focus2Label: 'Kiến thức Tiếng Việt / Biện pháp tu từ',
    focus2Placeholder: 'VD: Ẩn dụ, hoán dụ, điệp ngữ, câu ghép, phép liên kết...',
    mistakesLabel: 'Lỗi học sinh hay mắc',
    mistakesPlaceholder: 'VD: Diễn xuôi thơ thay vì phân tích nghệ thuật, trả lời đọc hiểu thiếu ý...',
    levels: [
      { value: 'elementary', label: 'Tiểu học', desc: 'Lớp 1-5, luyện câu & tả cảnh/kể chuyện' },
      { value: 'secondary', label: 'THCS (Lớp 6-9)', desc: 'Bám sát cấu trúc đề thi vào 10' },
      { value: 'communication', label: 'THPT / Ôn THPT QG', desc: 'Đọc hiểu ngoài SGK + Nghị luận' },
    ],
    questionOptions: [
      { key: 'reading_questions', label: 'Đọc hiểu ngữ liệu', desc: '1 đoạn trích + câu hỏi nhận biết/thông hiểu' },
      { key: 'multiple_choice', label: 'Trắc nghiệm Tiếng Việt / Tác phẩm', desc: 'Biện pháp tu từ, thể thơ, tác giả' },
      { key: 'fill_blank', label: 'Điền khuyết kiến thức', desc: 'Hoàn thành câu / nhận định văn học' },
      { key: 'writing', label: 'Viết đoạn / Bài văn nghị luận', desc: 'Kèm dàn ý chi tiết & thang điểm chấm' },
    ],
    defaultCounts: {
      reading_questions: 4,
      multiple_choice: 4,
      fill_blank: 0,
      writing: 2,
    },
  },
  {
    id: 'history',
    name: 'Lịch Sử',
    shortName: 'Lịch Sử',
    tagline: 'Mốc thời gian, sự kiện, tư liệu lịch sử',
    badgeClass: 'bg-amber-100 text-amber-800',
    accentBg: 'bg-amber-600',
    accentText: 'text-amber-700',
    accentBorder: 'border-amber-500',
    supportsStemOptions: false,
    supportsListening: false,
    defaultGrade: 'Lớp 12',
    topicPlaceholder: 'VD: Cách mạng tháng Tám 1945, Chiến tranh lạnh (1947-1991)...',
    focus1Label: 'Giai đoạn / Sự kiện lịch sử trọng tâm',
    focus1Placeholder: 'VD: Phong trào 1930-1931, Chiến dịch Điện Biên Phủ 1954...',
    focus2Label: 'Mốc thời gian & Nhân vật cần nhớ',
    focus2Placeholder: 'VD: 19/8/1945, 2/9/1945, Hội nghị Ianta...',
    mistakesLabel: 'Điểm học sinh hay nhầm lẫn',
    mistakesPlaceholder: 'VD: Nhầm thứ tự sự kiện trước-sau, nhầm ý nghĩa lịch sử các giai đoạn...',
    levels: [
      { value: 'elementary', label: 'Lịch sử Tiểu học', desc: 'Sự kiện & nhân vật tiêu biểu' },
      { value: 'secondary', label: 'THCS (Lớp 6-9)', desc: 'Lịch sử Việt Nam & Thế giới cơ bản' },
      { value: 'communication', label: 'THPT / Ôn THPT QG', desc: 'Trắc nghiệm + Đúng/Sai theo tư liệu' },
    ],
    questionOptions: [
      { key: 'multiple_choice', label: 'Trắc nghiệm 4 lựa chọn', desc: 'Sự kiện, mốc thời gian, nhận định' },
      { key: 'true_false_group', label: 'Đúng / Sai theo tư liệu', desc: 'Đoạn tư liệu + 4 ý nhận định a,b,c,d' },
      { key: 'reading_questions', label: 'Đọc hiểu tư liệu lịch sử', desc: 'Khai thác đoạn trích sử liệu' },
      { key: 'essay', label: 'Tự luận phân tích / So sánh', desc: 'Nguyên nhân, diễn biến, bài học' },
    ],
    defaultCounts: {
      multiple_choice: 8,
      true_false_group: 2,
      reading_questions: 3,
      essay: 1,
    },
  },
  {
    id: 'geography',
    name: 'Địa Lý',
    shortName: 'Địa Lý',
    tagline: 'Địa lý tự nhiên, kinh tế, số liệu & tính toán',
    badgeClass: 'bg-teal-100 text-teal-800',
    accentBg: 'bg-teal-600',
    accentText: 'text-teal-700',
    accentBorder: 'border-teal-500',
    supportsStemOptions: false,
    supportsListening: false,
    defaultGrade: 'Lớp 12',
    topicPlaceholder: 'VD: Địa hình Việt Nam, Đồng bằng sông Cửu Long, Đô thị hóa...',
    focus1Label: 'Chuyên đề / Vùng kinh tế trọng tâm',
    focus1Placeholder: 'VD: Khí hậu nhiệt đới ẩm gió mùa, Chuyển dịch cơ cấu kinh tế...',
    focus2Label: 'Kỹ năng số liệu / Công thức địa lý',
    focus2Placeholder: 'VD: Tính mật độ dân số, tỉ trọng %, cán cân xuất nhập khẩu...',
    mistakesLabel: 'Lỗi học sinh hay mắc',
    mistakesPlaceholder: 'VD: Nhầm đơn vị nghìn tỷ với triệu người, nhận xét bảng số liệu thiếu dẫn chứng...',
    levels: [
      { value: 'elementary', label: 'Địa lý Tiểu học', desc: 'Thiên nhiên & vùng miền Việt Nam' },
      { value: 'secondary', label: 'THCS (Lớp 6-9)', desc: 'Địa lý tự nhiên & kinh tế - xã hội' },
      { value: 'communication', label: 'THPT / Ôn THPT QG', desc: 'Đúng/Sai & Tính toán số liệu ngắn' },
    ],
    questionOptions: [
      { key: 'multiple_choice', label: 'Trắc nghiệm 4 lựa chọn', desc: 'Tự nhiên, dân cư, ngành & vùng kinh tế' },
      { key: 'true_false_group', label: 'Đúng / Sai (4 ý a,b,c,d)', desc: 'Phân tích số liệu & đặc điểm vùng' },
      { key: 'short_answer', label: 'Trả lời ngắn (Tính số liệu)', desc: 'Tính mật độ, tỉ lệ tăng trưởng, biên độ nhiệt' },
      { key: 'essay', label: 'Tự luận nhận xét / Giải thích', desc: 'Giải thích hiện tượng tự nhiên - kinh tế' },
    ],
    defaultCounts: {
      multiple_choice: 8,
      true_false_group: 2,
      short_answer: 3,
      essay: 1,
    },
  },
];

export const SUBJECT_MAP: Record<SubjectId, SubjectDefinition> = SUBJECT_LIST.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<SubjectId, SubjectDefinition>
);

export function getSubjectDefinition(subject?: SubjectId): SubjectDefinition {
  return (subject && SUBJECT_MAP[subject]) || SUBJECT_MAP.english;
}

export function createEmptyCounts(): SectionCountConfig {
  return {
    multiple_choice: 0,
    fill_blank: 0,
    word_form: 0,
    sentence_order: 0,
    rewrite: 0,
    reading_questions: 0,
    find_mistake: 0,
    listening_questions: 0,
    writing: 0,
    pronunciation_stress: 0,
    announcement_cloze: 0,
    paragraph_order: 0,
    guided_cloze: 0,
    sentence_transform_mcq: 0,
    sign_notice: 0,
    removed_sentences: 0,
    closest_meaning: 0,
    true_false_group: 0,
    short_answer: 0,
    essay: 0,
  };
}

export function getDefaultCountsForSubject(subject: SubjectId): SectionCountConfig {
  return {
    ...createEmptyCounts(),
    ...(SUBJECT_MAP[subject]?.defaultCounts || {}),
  };
}

export interface SubjectTemplate {
  label: string;
  gradeOrClass: string;
  topic: string;
  grammarFocus: string;
  vocabularyFocus: string;
}

export const SUBJECT_TEMPLATES: Record<SubjectId, SubjectTemplate[]> = {
  english: [
    {
      label: 'Present Continuous (Lớp 7)',
      gradeOrClass: 'Lớp 7',
      topic: 'Unit 3 - My Friends & Present Continuous',
      grammarFocus: 'S + am/is/are + V-ing, phân biệt với Hiện tại đơn',
      vocabularyFocus: 'friendly, creative, talkative, confident, hard-working',
    },
    {
      label: 'Ôn thi vào 10 - Câu điều kiện',
      gradeOrClass: 'Lớp 9',
      topic: 'Conditional Sentences Type 1 & 2 + Wish',
      grammarFocus: 'If + hiện tại/quá khứ đơn, câu ước với Wish',
      vocabularyFocus: 'environment, pollution, energy, protect, save',
    },
    {
      label: 'IELTS Listening - Transport',
      gradeOrClass: 'IELTS 5.5+',
      topic: 'Listening: Transport Survey & Daily Commute',
      grammarFocus: 'Nghe điền thông tin số, tên đường, lý do',
      vocabularyFocus: 'postcode, frequency, traffic congestion, parking',
    },
  ],
  math: [
    {
      label: 'Phương trình bậc hai & Vi-ét',
      gradeOrClass: 'Lớp 9',
      topic: 'Phương trình bậc hai một ẩn & Hệ thức Vi-ét',
      grammarFocus: 'Tính Delta, tìm m để PT có 2 nghiệm phân biệt thỏa mãn biểu thức đối xứng',
      vocabularyFocus: 'Δ = b² - 4ac, x₁ + x₂ = -b/a, x₁x₂ = c/a',
    },
    {
      label: 'Khảo sát hàm số & Cực trị',
      gradeOrClass: 'Lớp 12',
      topic: 'Tính đơn điệu và cực trị của hàm số',
      grammarFocus: 'Đạo hàm y\', bảng biến thiên, tìm tham số m để hàm số đạt cực trị',
      vocabularyFocus: 'Hàm bậc 3, hàm phân thức bậc 1/1, cực đại, cực tiểu',
    },
    {
      label: 'Hệ thức lượng tam giác vuông',
      gradeOrClass: 'Lớp 9',
      topic: 'Một số hệ thức về cạnh và đường cao trong tam giác vuông',
      grammarFocus: 'Tính độ dài cạnh, đường cao, tỉ số lượng giác sin, cos, tan',
      vocabularyFocus: 'a² = b² + c², h² = b\'·c\', a·h = b·c',
    },
  ],
  physics: [
    {
      label: 'Định luật II Newton & Ma sát',
      gradeOrClass: 'Lớp 10',
      topic: 'Ba định luật Newton và Lực ma sát trượt',
      grammarFocus: 'Tổng hợp lực, tính gia tốc, lực ma sát trên mặt phẳng ngang/nghiêng',
      vocabularyFocus: 'F = ma, Fms = μN, g = 10 m/s²',
    },
    {
      label: 'Định luật Ôm toàn mạch',
      gradeOrClass: 'Lớp 11',
      topic: 'Dòng điện không đổi & Định luật Ôm cho toàn mạch',
      grammarFocus: 'Tính điện trở tương đương, cường độ dòng điện, công suất mạch ngoài',
      vocabularyFocus: 'I = E / (R + r), P = UI = I²R',
    },
    {
      label: 'Dao động điều hòa',
      gradeOrClass: 'Lớp 12',
      topic: 'Phương trình dao động điều hòa & Con lắc lò xo',
      grammarFocus: 'Xác định biên độ A, tần số góc ω, pha ban đầu, vận tốc cực đại',
      vocabularyFocus: 'x = Acos(ωt + φ), v_max = ωA, ω = √(k/m)',
    },
  ],
  chemistry: [
    {
      label: 'Cân bằng PTHH & Tính mol',
      gradeOrClass: 'Lớp 8',
      topic: 'Mol, Tỉ khối chất khí và Tính theo phương trình hóa học',
      grammarFocus: 'Lập CTHH, cân bằng PTHH, tính khối lượng và thể tích khí (đkc)',
      vocabularyFocus: 'n = m/M, V = n·24,79 (đkc), Bảo toàn khối lượng',
    },
    {
      label: 'Este - Lipit & Xà phòng hóa',
      gradeOrClass: 'Lớp 12',
      topic: 'Este đơn chức & Phản ứng thủy phân trong kiềm',
      grammarFocus: 'Gọi tên este, viết PTHH thủy phân, tính hiệu suất và khối lượng muối',
      vocabularyFocus: 'RCOOR\' + NaOH → RCOONa + R\'OH',
    },
    {
      label: 'Kim loại tác dụng Axit',
      gradeOrClass: 'Lớp 11',
      topic: 'Phản ứng của kim loại với HCl, H2SO4 loãng và HNO3',
      grammarFocus: 'Áp dụng bảo toàn electron và bảo toàn khối lượng',
      vocabularyFocus: 'n_e nhường = n_e nhận, giải phóng H₂, NO, NO₂',
    },
  ],
  literature: [
    {
      label: 'Đọc hiểu + Nghị luận 200 chữ',
      gradeOrClass: 'Lớp 9',
      topic: 'Đọc hiểu thơ hiện đại & Nghị luận xã hội về tinh thần tự học',
      grammarFocus: 'Xác định thể thơ, biện pháp tu từ, thông điệp văn bản',
      vocabularyFocus: 'Ẩn dụ, nhân hóa, điệp ngữ, câu ghép',
    },
    {
      label: 'Kiều ở lầu Ngưng Bích',
      gradeOrClass: 'Lớp 9',
      topic: 'Phân tích đoạn trích Kiều ở lầu Ngưng Bích (Nguyễn Du)',
      grammarFocus: 'Nghệ thuật tả cảnh ngụ tình, tâm trạng cô đơn và tấm lòng hiếu thảo',
      vocabularyFocus: 'Bút pháp ước lệ, điệp ngữ "buồn trông"',
    },
    {
      label: 'Truyện ngắn Chí Phèo',
      gradeOrClass: 'Lớp 11',
      topic: 'Bi kịch bị cự tuyệt quyền làm người của nhân vật Chí Phèo',
      grammarFocus: 'Diễn biến tâm trạng sau bát cháo hành của Thị Nở',
      vocabularyFocus: 'Nam Cao, hiện thực phê phán, chi tiết nghệ thuật',
    },
  ],
  history: [
    {
      label: 'Cách mạng tháng Tám 1945',
      gradeOrClass: 'Lớp 12',
      topic: 'Tổng khởi nghĩa tháng Tám năm 1945 và sự ra đời nước VNDCCH',
      grammarFocus: 'Bối cảnh thời cơ "ngàn năm có một", diễn biến chính, nguyên nhân thắng lợi',
      vocabularyFocus: '19/8/1945, 2/9/1945, Tuyên ngôn Độc lập',
    },
    {
      label: 'Chiến dịch Điện Biên Phủ 1954',
      gradeOrClass: 'Lớp 12',
      topic: 'Cuộc tiến công chiến lược Đông-Xuân 1953-1954 và Điện Biên Phủ',
      grammarFocus: 'Âm mưu của kế hoạch Nava, 3 đợt tiến công, ý nghĩa lịch sử',
      vocabularyFocus: '56 ngày đêm, 7/5/1954, Hiệp định Giơ-ne-vơ',
    },
    {
      label: 'Trật tự thế giới sau 1945',
      gradeOrClass: 'Lớp 12',
      topic: 'Trật tự hai cực Ianta và Chiến tranh lạnh (1947-1991)',
      grammarFocus: 'Hội nghị Ianta, sự đối đầu Mỹ - Liên Xô, xu thế hòa hoãn',
      vocabularyFocus: 'Liên hợp quốc, NATO, Vác-sa-va, đa cực',
    },
  ],
  geography: [
    {
      label: 'Chuyển dịch cơ cấu kinh tế',
      gradeOrClass: 'Lớp 12',
      topic: 'Chuyển dịch cơ cấu ngành, thành phần và lãnh thổ kinh tế Việt Nam',
      grammarFocus: 'Phân tích xu hướng tăng tỉ trọng công nghiệp - dịch vụ, đọc bảng số liệu',
      vocabularyFocus: 'Công nghiệp hóa, khu công nghiệp, GDP theo ngành',
    },
    {
      label: 'Đồng bằng sông Cửu Long',
      gradeOrClass: 'Lớp 12',
      topic: 'Sử dụng hợp lý tự nhiên để phát triển kinh tế vùng ĐBSCL',
      grammarFocus: 'Thế mạnh đất phù sa, hạn chế ngập mặn, giải pháp thích ứng BĐKH',
      vocabularyFocus: 'Đất phèn, đất mặn, vựa lúa, thủy sản, xâm nhập mặn',
    },
    {
      label: 'Tính toán số liệu Địa lý',
      gradeOrClass: 'Lớp 12',
      topic: 'Thực hành tính mật độ dân số, tỉ trọng và cán cân xuất nhập khẩu',
      grammarFocus: 'Áp dụng công thức quy đổi đơn vị và nhận xét bảng số liệu',
      vocabularyFocus: 'Mật độ = Dân số / Diện tích, Cán cân = Xuất - Nhập',
    },
  ],
};

