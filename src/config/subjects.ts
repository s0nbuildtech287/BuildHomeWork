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
      { key: 'vocab_en_to_vi', label: 'Dịch nghĩa Anh → Việt (A/B/C/D)', desc: 'Cho từ tiếng Anh, chọn nghĩa tiếng Việt đúng nhất' },
      { key: 'vocab_vi_to_en', label: 'Dịch nghĩa Việt → Anh (A/B/C/D)', desc: 'Cho nghĩa tiếng Việt, chọn từ tiếng Anh tương ứng' },
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
  {
    id: 'higher_math',
    name: 'Toán cao cấp & Giải tích',
    shortName: 'Toán cao cấp',
    tagline: 'Giải tích 1, 2, Đại số tuyến tính, Xác suất thống kê',
    badgeClass: 'bg-indigo-100 text-indigo-900',
    accentBg: 'bg-indigo-700',
    accentText: 'text-indigo-800',
    accentBorder: 'border-indigo-600',
    supportsStemOptions: true,
    supportsListening: false,
    defaultGrade: 'Đại học - Năm nhất',
    topicPlaceholder: 'VD: Tích phân suy rộng, Chuỗi số, Ma trận & Định thức, Hệ phương trình tuyến tính...',
    focus1Label: 'Học phần / Chuyên đề trọng tâm',
    focus1Placeholder: 'VD: Giải tích 1 (Giới hạn, Đạo hàm, Tích phân); Giải tích 2 (Chuỗi, Tích phân bội); Đại số tuyến tính (Ma trận, Định thức, Vector)...',
    focus2Label: 'Công thức / Định lý / Phương pháp giải',
    focus2Placeholder: 'VD: Quy tắc L\'Hopital, Công thức Taylor/Maclaurin, Tiêu chuẩn D\'Alembert/Cauchy, Khử Gauss-Jordan...',
    mistakesLabel: 'Lỗi sinh viên hay mắc (để AI phân loại)',
    mistakesPlaceholder: 'VD: Quên xét điều kiện hội tụ của chuỗi, nhầm dấu khi biến đổi sơ cấp ma trận, nhầm cận tích phân khi đổi biến...',
    levels: [
      { value: 'university_basic', label: 'Đại học - Cơ sở / Đại cương', desc: 'Năm 1, 2 các khối ngành kỹ thuật & kinh tế' },
      { value: 'university_advanced', label: 'Đại học - Nâng cao / Chuyên sâu', desc: 'Mô hình ứng dụng, chứng minh chặt chẽ & phân hóa cao' },
    ],
    questionOptions: [
      { key: 'multiple_choice', label: 'Trắc nghiệm 4 lựa chọn', desc: 'Khái niệm, điều kiện định lý & tính nhanh' },
      { key: 'true_false_group', label: 'Đúng / Sai (4 mệnh đề a,b,c,d)', desc: 'Đánh giá tính chất, sự hội tụ, hạng ma trận' },
      { key: 'short_answer', label: 'Trả lời ngắn (Điền đáp số / ma trận)', desc: 'Tính giới hạn, tích phân, định thức' },
      { key: 'essay', label: 'Tự luận giải chi tiết & Chứng minh', desc: 'Trình bày biến đổi toán học chặt chẽ' },
    ],
    defaultCounts: {
      multiple_choice: 6,
      true_false_group: 2,
      short_answer: 4,
      essay: 2,
    },
  },
  {
    id: 'philosophy_marx',
    name: 'Triết học Mác - Lênin & LLCT',
    shortName: 'Triết học Mác',
    tagline: 'Triết học Mác-Lênin, Kinh tế chính trị, CNXH khoa học',
    badgeClass: 'bg-rose-100 text-rose-900',
    accentBg: 'bg-rose-700',
    accentText: 'text-rose-800',
    accentBorder: 'border-rose-600',
    supportsStemOptions: false,
    supportsListening: false,
    defaultGrade: 'Đại học - Năm nhất',
    topicPlaceholder: 'VD: Quy luật lượng - chất, Mâu thuẫn biện chứng, Giá trị thặng dư, Sứ mệnh lịch sử giai cấp công nhân...',
    focus1Label: 'Môn học / Nguyên lý trọng tâm',
    focus1Placeholder: 'VD: Triết học Mác-Lênin (CNDV biện chứng, CNDV lịch sử); Kinh tế chính trị Mác-Lênin; CNXH khoa học...',
    focus2Label: 'Quy luật / Khái niệm / Vận dụng thực tiễn',
    focus2Placeholder: 'VD: Cặp phạm trù nguyên nhân - kết quả, Quy luật mâu thuẫn, Bản chất giá trị thặng dư (m), Thời kỳ quá độ...',
    mistakesLabel: 'Lỗi sinh viên hay nhầm lẫn',
    mistakesPlaceholder: 'VD: Lẫn lộn giữa Duy vật biện chứng và Duy tâm siêu hình, nhầm giữa Giá trị và Giá trị trao đổi...',
    levels: [
      { value: 'university_basic', label: 'Chuẩn học phần Đại học', desc: 'Khái niệm, quy luật cốt lõi & trắc nghiệm ôn thi' },
      { value: 'university_advanced', label: 'Phân tích sâu & Liên hệ thực tiễn', desc: 'Vận dụng giải thích kinh tế thị trường định hướng XHCN' },
    ],
    questionOptions: [
      { key: 'multiple_choice', label: 'Trắc nghiệm 4 lựa chọn (A/B/C/D)', desc: 'Khái niệm, luận điểm triết học & kinh tế chính trị' },
      { key: 'true_false_group', label: 'Đúng / Sai phân tích mệnh đề', desc: 'Đánh giá nhận định lý luận đúng hay sai' },
      { key: 'short_answer', label: 'Trả lời ngắn / Xác định thuật ngữ', desc: 'Nêu tên quy luật, cặp phạm trù, công thức kinh tế' },
      { key: 'essay', label: 'Tự luận phân tích & Liên hệ thực tiễn', desc: 'Trình bày bản chất lý luận và rút ra ý nghĩa phương pháp luận' },
    ],
    defaultCounts: {
      multiple_choice: 8,
      true_false_group: 2,
      short_answer: 2,
      essay: 2,
    },
  },
  {
    id: 'party_history',
    name: 'Lịch sử Đảng & Tư tưởng HCM',
    shortName: 'Lịch sử Đảng & TT HCM',
    tagline: 'Lịch sử Đảng CSVN & Tư tưởng Hồ Chí Minh',
    badgeClass: 'bg-amber-100 text-amber-900',
    accentBg: 'bg-amber-700',
    accentText: 'text-amber-800',
    accentBorder: 'border-amber-600',
    supportsStemOptions: false,
    supportsListening: false,
    defaultGrade: 'Đại học - Năm hai',
    topicPlaceholder: 'VD: Hội nghị thành lập Đảng 1930, Cương lĩnh chính trị đầu tiên, Đường lối Đổi mới 1986, Tư tưởng đại đoàn kết...',
    focus1Label: 'Học phần & Mốc lịch sử / Chủ đề',
    focus1Placeholder: 'VD: Lịch sử Đảng CSVN (1930-1945, Kháng chiến, Thời kỳ Đổi mới); Tư tưởng Hồ Chí Minh (Độc lập dân tộc, Đại đoàn kết)...',
    focus2Label: 'Văn kiện / Luận điểm cốt lõi',
    focus2Placeholder: 'VD: Cương lĩnh chính trị đầu tiên (2/1930), Luận cương chính trị (10/1930), Đại hội VI (1986)...',
    mistakesLabel: 'Lỗi sinh viên hay nhầm lẫn',
    mistakesPlaceholder: 'VD: Nhầm lẫn mốc thời gian các kỳ Đại hội Đảng, nhầm bối cảnh lịch sử và ý nghĩa giữa các Hội nghị BCH Trung ương...',
    levels: [
      { value: 'university_basic', label: 'Chuẩn học phần Đại học', desc: 'Sự kiện, mốc lịch sử, văn kiện & trắc nghiệm chuẩn' },
      { value: 'university_advanced', label: 'Phân tích đường lối & Bài học', desc: 'Đánh giá bài học kinh nghiệm và sự vận dụng thực tiễn hôm nay' },
    ],
    questionOptions: [
      { key: 'multiple_choice', label: 'Trắc nghiệm 4 lựa chọn (A/B/C/D)', desc: 'Mốc thời gian, nhân vật, nội dung văn kiện, đại hội' },
      { key: 'true_false_group', label: 'Đúng / Sai đánh giá nhận định', desc: 'Phân tích tính đúng đắn của các nhận định lịch sử' },
      { key: 'short_answer', label: 'Trả lời ngắn (Tên văn kiện / Mốc năm)', desc: 'Điền tên hội nghị, tác phẩm, mốc lịch sử' },
      { key: 'essay', label: 'Tự luận phân tích bài học lịch sử', desc: 'Trình bày ý nghĩa lịch sử, bài học kinh nghiệm và liên hệ' },
    ],
    defaultCounts: {
      multiple_choice: 8,
      true_false_group: 2,
      short_answer: 2,
      essay: 2,
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
    vocab_vi_to_en: 0,
    vocab_en_to_vi: 0,
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
  higher_math: [
    {
      label: 'Giới hạn & Tích phân suy rộng',
      gradeOrClass: 'Năm nhất',
      topic: 'Giải tích 1: Quy tắc L\'Hopital và Tích phân suy rộng loại 1, 2',
      grammarFocus: 'Khử dạng vô định 0/0, ∞/∞; tính tích phân có cận vô cực hoặc điểm bất thường',
      vocabularyFocus: 'lim, L\'Hopital, \\int_{a}^{+\\infty} f(x)dx, hội tụ, phân kỳ',
    },
    {
      label: 'Ma trận & Hệ phương trình tuyến tính',
      gradeOrClass: 'Năm nhất',
      topic: 'Đại số tuyến tính: Ma trận nghịch đảo và Phương pháp khử Gauss-Jordan',
      grammarFocus: 'Tính định thức det(A), tìm ma trận nghịch đảo A⁻¹, giải hệ Ax = b',
      vocabularyFocus: 'det(A), rank(A), ma trận bậc thang, nghiệm duy nhất, vô số nghiệm',
    },
    {
      label: 'Chuỗi số & Tiêu chuẩn hội tụ',
      gradeOrClass: 'Năm hai',
      topic: 'Giải tích 2: Chuỗi số dương và Tiêu chuẩn D\'Alembert, Cauchy',
      grammarFocus: 'Xét sự hội tụ bằng tiêu chuẩn so sánh, D\'Alembert, Cauchy, chuỗi đan dấu Leibniz',
      vocabularyFocus: '\\sum_{n=1}^{\\infty} a_n, lim (a_{n+1}/a_n) = L < 1, bán kính hội tụ R',
    },
  ],
  philosophy_marx: [
    {
      label: 'Quy luật Thống nhất & Đấu tranh',
      gradeOrClass: 'Năm nhất',
      topic: 'Triết học Mác - Lênin: Quy luật thống nhất và đấu tranh của các mặt đối lập',
      grammarFocus: 'Khái niệm mặt đối lập, mâu thuẫn biện chứng, vai trò của mâu thuẫn là nguồn gốc của sự phát triển',
      vocabularyFocus: 'Mặt đối lập, thống nhất, đấu tranh, mâu thuẫn bên trong/bên ngoài, phương pháp luận',
    },
    {
      label: 'Học thuyết Giá trị thặng dư',
      gradeOrClass: 'Năm nhất',
      topic: 'Kinh tế chính trị Mác - Lênin: Bản chất và các phương pháp sản xuất giá trị thặng dư',
      grammarFocus: 'Tư bản bất biến (c), tư bản khả biến (v), tỷ suất giá trị thặng dư (m\'), giá trị thặng dư tuyệt đối và tương đối',
      vocabularyFocus: 'G = c + v + m, m\' = (m/v) * 100%, ngày lao động, tăng năng suất lao động',
    },
    {
      label: 'Sứ mệnh lịch sử GCCN',
      gradeOrClass: 'Năm nhất',
      topic: 'Chủ nghĩa xã hội khoa học: Sứ mệnh lịch sử của giai cấp công nhân',
      grammarFocus: 'Điều kiện khách quan và nhân tố chủ quan quy định sứ mệnh lịch sử của giai cấp công nhân',
      vocabularyFocus: 'Phương thức sản xuất hiện đại, Đảng Cộng sản, liên minh công - nông - trí thức',
    },
  ],
  party_history: [
    {
      label: 'Cương lĩnh chính trị 1930',
      gradeOrClass: 'Năm hai',
      topic: 'Hội nghị thành lập Đảng và Cương lĩnh chính trị đầu tiên (2/1930)',
      grammarFocus: 'Bối cảnh lịch sử, vai trò sáng lập của Nguyễn Ái Quốc, nội dung cơ bản của Cương lĩnh chính trị đầu tiên',
      vocabularyFocus: 'Hương Cảng (Trung Quốc), tư sản dân quyền cách mạng, độc lập dân tộc gắn liền với CNXH',
    },
    {
      label: 'Đường lối Đổi mới Đại hội VI',
      gradeOrClass: 'Năm hai',
      topic: 'Đại hội đại biểu toàn quốc lần thứ VI (12/1986) và đường lối Đổi mới toàn diện',
      grammarFocus: 'Bối cảnh khủng hoảng kinh tế - xã hội, ba chương trình kinh tế lớn, bài học nhìn thẳng vào sự thật',
      vocabularyFocus: 'Đổi mới tư duy, kinh tế nhiều thành phần, cơ chế thị trường định hướng XHCN, Lương thực - Hàng tiêu dùng - Hàng xuất khẩu',
    },
    {
      label: 'Tư tưởng HCM về Đại đoàn kết',
      gradeOrClass: 'Năm hai',
      topic: 'Tư tưởng Hồ Chí Minh về Đại đoàn kết toàn dân tộc và Mặt trận dân tộc thống nhất',
      grammarFocus: 'Vai trò, lực lượng và nguyên tắc xây dựng khối đại đoàn kết: "Đoàn kết, đoàn kết, đại đoàn kết"',
      vocabularyFocus: 'Mặt trận dân tộc thống nhất, lấy dân làm gốc, hiệp thương dân chủ, độc lập tự chủ',
    },
  ],
};

