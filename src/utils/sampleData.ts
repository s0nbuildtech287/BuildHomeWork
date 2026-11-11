import { Homework } from '../types';

export const SAMPLE_HOMEWORKS: Homework[] = [
  {
    id: 'sample_elementary_1',
    title: 'Homework - Unit 5: My Daily Routine',
    subtitle: 'Ôn tập Thì Hiện Tại Đơn & Từ vựng hoạt động hàng ngày (Tiểu học)',
    level: 'elementary',
    gradeOrClass: 'Lớp 4A',
    teacherName: 'Cô Lan Anh',
    centerName: 'Lớp Tiếng Anh Vui',
    topicSummary: 'Present Simple (I/you/he/she), giờ giấc và hoạt động buổi sáng',
    estimatedMinutes: 15,
    createdAt: '2026-11-10T10:00:00.000Z',
    updatedAt: '2026-11-10T10:00:00.000Z',
    sections: [
      {
        id: 'sec_el_1',
        title: 'Part I. Choose the best answer',
        instruction: 'Chọn đáp án đúng nhất A, B, C hoặc D.',
        type: 'multiple_choice',
        questions: [
          {
            id: 'q_el_1',
            type: 'multiple_choice',
            prompt: 'I ______ up at six o’clock every morning.',
            options: ['get', 'gets', 'getting', 'to get'],
            correctAnswer: 'get',
            explanation: 'Chủ ngữ là "I" nên động từ giữ nguyên là "get".',
          },
          {
            id: 'q_el_2',
            type: 'multiple_choice',
            prompt: 'Minh ______ his teeth after breakfast.',
            options: ['brush', 'brushes', 'brushing', 'brushs'],
            correctAnswer: 'brushes',
            explanation: 'Chủ ngữ "Minh" (ngôi thứ 3 số ít), động từ kết thúc bằng "sh" nên thêm "-es" -> brushes.',
          },
          {
            id: 'q_el_3',
            type: 'multiple_choice',
            prompt: 'What time ______ she go to school?',
            options: ['do', 'is', 'does', 'are'],
            correctAnswer: 'does',
            explanation: 'Câu hỏi thì hiện tại đơn với động từ thường "go" và chủ ngữ "she" dùng trợ động từ "does".',
          },
        ],
      },
      {
        id: 'sec_el_2',
        title: 'Part II. Fill in the blanks',
        instruction: 'Điền dạng đúng của từ trong ngoặc vào chỗ trống.',
        type: 'fill_blank',
        questions: [
          {
            id: 'q_el_4',
            type: 'fill_blank',
            prompt: 'She (have) ______ breakfast at 6:30 a.m.',
            hint: 'have',
            correctAnswer: 'has',
            explanation: 'Với chủ ngữ "she", động từ "have" đổi thành "has".',
          },
          {
            id: 'q_el_5',
            type: 'fill_blank',
            prompt: 'We (play) ______ badminton after school.',
            hint: 'play',
            correctAnswer: 'play',
            explanation: 'Với chủ ngữ số nhiều "we", động từ giữ nguyên là "play".',
          },
        ],
      },
      {
        id: 'sec_el_3',
        title: 'Part III. Put the words in the correct order',
        instruction: 'Sắp xếp các từ sau thành câu hoàn chỉnh.',
        type: 'sentence_order',
        questions: [
          {
            id: 'q_el_6',
            type: 'sentence_order',
            prompt: 'Sắp xếp thành câu hoàn chỉnh:',
            words: ['at', 'to', 'goes', 'bed', 'He', 'nine', "o'clock."],
            correctAnswer: "He goes to bed at nine o'clock.",
            explanation: 'Cấu trúc: Chủ ngữ (He) + động từ (goes to bed) + thời gian (at nine o’clock).',
          },
        ],
      },
    ],
  },
  {
    id: 'sample_secondary_1',
    title: 'Homework - Present Perfect vs. Past Simple',
    subtitle: 'Phân biệt Thì Hiện tại hoàn thành & Quá khứ đơn (THCS)',
    level: 'secondary',
    gradeOrClass: 'Lớp 8B',
    teacherName: 'Cô Lan Anh',
    centerName: 'Lớp Tiếng Anh Chuyên Sâu',
    topicSummary: 'Present Perfect (since/for/already/yet) & Past Simple (ago/last/yesterday)',
    estimatedMinutes: 20,
    createdAt: '2026-11-09T14:00:00.000Z',
    updatedAt: '2026-11-09T14:00:00.000Z',
    sections: [
      {
        id: 'sec_sec_1',
        title: 'Part I. Multiple Choice',
        instruction: 'Choose the correct option A, B, C, or D.',
        type: 'multiple_choice',
        questions: [
          {
            id: 'q_sec_1',
            type: 'multiple_choice',
            prompt: 'My family ______ in Da Nang since 2018.',
            options: ['lived', 'has lived', 'lives', 'is living'],
            correctAnswer: 'has lived',
            explanation: 'Có "since + mốc thời gian (2018)" -> dùng Hiện tại hoàn thành (has lived).',
          },
          {
            id: 'q_sec_2',
            type: 'multiple_choice',
            prompt: 'We ______ Ha Long Bay two years ago.',
            options: ['have visited', 'visit', 'visited', 'are visiting'],
            correctAnswer: 'visited',
            explanation: 'Có "two years ago" là mốc thời gian xác định trong quá khứ -> dùng Quá khứ đơn (visited).',
          },
        ],
      },
      {
        id: 'sec_sec_2',
        title: 'Part II. Rewrite the sentences',
        instruction: 'Viết lại câu sao cho nghĩa không đổi.',
        type: 'rewrite',
        questions: [
          {
            id: 'q_sec_3',
            type: 'rewrite',
            prompt: 'I started learning English five years ago. -> I have ________________________.',
            hint: 'I have ...',
            correctAnswer:
              'I have learned English for five years. | I have learnt English for five years. | I have been learning English for five years.',
            explanation: 'Cấu trúc: S + started + V-ing + time + ago <=> S + have/has + V3/ed + for + time.',
          },
        ],
      },
    ],
  },
];

