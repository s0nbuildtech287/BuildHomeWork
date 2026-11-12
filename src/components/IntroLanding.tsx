import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Atom,
  BookOpenText,
  Calculator,
  CheckCircle2,
  FileText,
  FlaskConical,
  FolderHeart,
  Globe2,
  Headphones,
  ImagePlus,
  Landmark,
  Languages,
  Send,
  Sparkles,
  UploadCloud,
  Wand2,
} from 'lucide-react';
import { SUBJECT_LIST } from '../config/subjects';
import { SubjectId } from '../types';
import { BrandLogo } from './BrandLogo';
import { MathText } from './MathText';

interface IntroLandingProps {
  homeworkCount: number;
  onEnterWorkspace: (subject?: SubjectId) => void;
  onOpenLibrary: () => void;
}

const SUBJECT_ICONS: Record<SubjectId, React.ComponentType<{ className?: string }>> = {
  english: Languages,
  math: Calculator,
  physics: Atom,
  chemistry: FlaskConical,
  literature: BookOpenText,
  history: Landmark,
  geography: Globe2,
};

const PREVIEW_DEMOS: Array<{
  id: SubjectId;
  label: string;
  badge: string;
  title: string;
  question: string;
  options?: string[];
  answerNote: string;
  hasAudio?: boolean;
}> = [
  {
    id: 'english',
    label: 'Tiếng Anh',
    badge: 'Listening + Grammar • MP3',
    title: 'Unit 3: Transport Survey & Present Continuous',
    question: 'Listen to the conversation. Look! The children ______ football in the yard now.',
    options: ['play', 'are playing', 'plays', 'played'],
    answerNote: 'Đáp án: B. are playing — Dấu hiệu "Look!" và "now" dùng Hiện tại tiếp diễn.',
    hasAudio: true,
  },
  {
    id: 'math',
    label: 'Toán học',
    badge: 'LaTeX • Lời giải từng bước',
    title: 'Phương trình bậc hai & Hệ thức Vi-ét',
    question:
      'Cho phương trình $x^2 - 5x + 6 = 0$ có hai nghiệm $x_1, x_2$. Giá trị của biểu thức $P = x_1^2 + x_2^2$ là:',
    options: ['$13$', '$19$', '$25$', '$37$'],
    answerNote: 'Lời giải: $x_1 + x_2 = 5$, $x_1 x_2 = 6 \\Rightarrow P = (x_1+x_2)^2 - 2x_1x_2 = 13$.',
  },
  {
    id: 'chemistry',
    label: 'Hóa học',
    badge: 'PTHH chuẩn • Tính mol',
    title: 'Phản ứng kim loại tác dụng với Axit',
    question:
      'Cho $5{,}6\\text{ g}$ sắt tác dụng hoàn toàn với dung dịch $H_2SO_4$ loãng dư thu được khí $H_2$. Thể tích khí (đkc) là:',
    options: ['$2{,}479\\text{ lít}$', '$4{,}958\\text{ lít}$', '$1{,}239\\text{ lít}$', '$3{,}718\\text{ lít}$'],
    answerNote: 'PTHH: $Fe + H_2SO_4 \\rightarrow FeSO_4 + H_2\\uparrow \\Rightarrow n_{H_2} = n_{Fe} = 0{,}1\\text{ mol}$.',
  },
];

export const IntroLanding: React.FC<IntroLandingProps> = ({
  homeworkCount,
  onEnterWorkspace,
  onOpenLibrary,
}) => {
  const [demoIdx, setDemoIdx] = useState(0);
  const [autoCycle, setAutoCycle] = useState(true);

  useEffect(() => {
    if (!autoCycle) return;
    const timer = setInterval(() => {
      setDemoIdx((prev) => (prev + 1) % PREVIEW_DEMOS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [autoCycle]);

  const activeDemo = PREVIEW_DEMOS[demoIdx];

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Ambient Background */}
      <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-70" />
      <div className="pointer-events-none absolute -top-40 -left-32 h-[480px] w-[480px] rounded-full bg-indigo-300/25 blur-3xl" />
      <div className="pointer-events-none absolute top-24 -right-32 h-[440px] w-[440px] rounded-full bg-sky-300/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-36 left-1/3 h-[420px] w-[420px] rounded-full bg-violet-300/20 blur-3xl" />

      {/* Top Navigation */}
      <header className="relative z-10 mx-auto flex w-full max-w-[1400px] items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <BrandLogo className="h-10 w-10 rounded-xl shadow-sm" />
          <div>
            <div className="text-base font-extrabold tracking-tight text-slate-900">
              EduLab Studio
            </div>
            <div className="text-[11px] font-medium text-slate-500">
              AI Worksheet &amp; Online Quiz Builder
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {homeworkCount > 0 && (
            <button
              type="button"
              onClick={onOpenLibrary}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/90 px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs backdrop-blur-xs transition hover:bg-white"
            >
              <FolderHeart className="h-4 w-4 text-indigo-600" />
              Kho bài tập ({homeworkCount})
            </button>
          )}

          <button
            type="button"
            onClick={() => onEnterWorkspace()}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-600"
          >
            Vào không gian soạn đề
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Main Hero */}
      <main className="relative z-10 mx-auto w-full max-w-[1400px] px-5 pt-4 pb-16 sm:px-8 lg:pt-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left Hero Copy */}
          <div className="lg:col-span-6 space-y-6">
            <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-white/90 px-3.5 py-1.5 text-xs font-bold text-indigo-700 shadow-2xs backdrop-blur-xs">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              Trợ lý AI soạn bài tập đa môn • Trọng tâm Tiếng Anh
            </div>

            <h1 className="animate-fade-up-delay-1 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl sm:leading-[1.12]">
              Soạn phiếu bài tập &amp; đề kiểm tra{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-600 bg-clip-text text-transparent">
                chỉ trong 30 giây
              </span>
            </h1>

            <p className="animate-fade-up-delay-2 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
              Chuyên sâu cho giáo viên <strong>Tiếng Anh</strong> (tạo file nghe MP3 chuẩn giọng bản xứ, 4 kiểu đề nghe, đọc hiểu, tìm lỗi sai) và mở rộng <strong>6 môn phổ thông</strong> (Toán, Lý, Hóa chuẩn công thức LaTeX, Văn, Sử, Địa).
            </p>

            {/* Primary CTAs */}
            <div className="animate-fade-up-delay-2 flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onEnterWorkspace('english')}
                className="group inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/30"
              >
                <Wand2 className="h-4 w-4" />
                Bắt đầu soạn đề ngay
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                onClick={onOpenLibrary}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-5 py-3.5 text-sm font-bold text-slate-700 shadow-xs backdrop-blur-xs transition hover:border-indigo-300 hover:bg-white hover:text-indigo-700"
              >
                <FolderHeart className="h-4 w-4 text-indigo-500" />
                Xem kho bài tập {homeworkCount > 0 ? `(${homeworkCount})` : ''}
              </button>
            </div>

            {/* Feature Pills */}
            <div className="animate-fade-up-delay-3 grid grid-cols-2 gap-2.5 pt-2 sm:flex sm:flex-wrap">
              {[
                { icon: Headphones, text: 'Tạo Audio MP3 tự động' },
                { icon: FileText, text: 'Xuất Word (.docx) & PDF' },
                { icon: Send, text: 'Link học sinh tự chấm' },
                { icon: ImagePlus, text: 'Dán ảnh minh họa Ctrl+V' },
              ].map((feat, i) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={i}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 backdrop-blur-xs"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-indigo-600" />
                    <span>{feat.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Interactive Animated Showcase */}
          <div className="relative lg:col-span-6">
            {/* Floating Badge Top Left */}
            <div className="animate-float-slow absolute -top-4 -left-2 z-20 hidden items-center gap-2 rounded-2xl border border-emerald-200 bg-white/95 px-3.5 py-2 shadow-lg backdrop-blur-xs sm:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <div>
                <div className="text-[11px] font-bold text-slate-900">Tự động chấm điểm</div>
                <div className="text-[10px] text-emerald-700">10/10 • Có giải thích tiếng Việt</div>
              </div>
            </div>

            {/* Floating Badge Bottom Right */}
            <div className="animate-float-delayed absolute -right-2 -bottom-4 z-20 hidden items-center gap-2 rounded-2xl border border-indigo-200 bg-white/95 px-3.5 py-2 shadow-lg backdrop-blur-xs sm:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                <Headphones className="h-4 w-4" />
              </span>
              <div>
                <div className="text-[11px] font-bold text-slate-900">Nghe MP3 &amp; Xuất Word</div>
                <div className="text-[10px] text-indigo-600">Sẵn sàng in phát trên lớp</div>
              </div>
            </div>

            {/* Main Glass Card Preview */}
            <div className="animate-fade-up-delay-2 relative rounded-3xl border border-slate-200/90 bg-white/90 p-5 shadow-2xl shadow-indigo-950/10 backdrop-blur-md sm:p-6">
              {/* Demo Subject Tabs */}
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex flex-wrap gap-1.5">
                  {PREVIEW_DEMOS.map((demo, idx) => {
                    const active = idx === demoIdx;
                    return (
                      <button
                        key={demo.id}
                        type="button"
                        onClick={() => {
                          setAutoCycle(false);
                          setDemoIdx(idx);
                        }}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                          active
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                        }`}
                      >
                        {demo.label}
                      </button>
                    );
                  })}
                </div>
                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
                  {activeDemo.badge}
                </span>
              </div>

              {/* Demo Worksheet Body */}
              <div className="space-y-4">
                <div>
                  <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    Xem trước câu hỏi tự động
                  </div>
                  <h3 className="mt-0.5 text-base font-bold text-slate-900">
                    {activeDemo.title}
                  </h3>
                </div>

                {activeDemo.hasAudio && (
                  <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-3.5 py-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
                      <Headphones className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1">
                        {[35, 65, 45, 85, 55, 90, 40, 75, 60, 80, 45, 70, 50, 85, 60, 40].map(
                          (h, i) => (
                            <span
                              key={i}
                              className="w-1.5 rounded-full bg-indigo-400/80"
                              style={{ height: `${Math.max(6, Math.round(h * 0.22))}px` }}
                            />
                          )
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-indigo-700">01:24 MP3</span>
                  </div>
                )}

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                    <span className="mr-1.5 text-indigo-600">Câu 1.</span>
                    <MathText text={activeDemo.question} />
                  </p>

                  {activeDemo.options && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {activeDemo.options.map((opt, oIdx) => {
                        const isCorrect =
                          (activeDemo.id === 'english' && oIdx === 1) ||
                          (activeDemo.id !== 'english' && oIdx === 0);
                        return (
                          <div
                            key={oIdx}
                            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${
                              isCorrect
                                ? 'border-emerald-400 bg-emerald-50 text-emerald-900 font-bold'
                                : 'border-slate-200 bg-white text-slate-700'
                            }`}
                          >
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <MathText text={opt} />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-3 rounded-xl bg-white px-3 py-2 text-xs text-emerald-800 border border-emerald-100">
                    <MathText text={activeDemo.answerNote} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 7 Subjects Quick Launch Strip */}
        <section className="animate-fade-up-delay-3 mt-14">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Chọn môn học để bắt đầu ngay
              </h2>
              <p className="text-xs text-slate-500">
                Mỗi môn có form nhập liệu, dạng bài tập và quy tắc AI riêng biệt
              </p>
            </div>
            <button
              type="button"
              onClick={() => onEnterWorkspace()}
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              Mở không gian làm việc <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {SUBJECT_LIST.map((subject) => {
              const Icon = SUBJECT_ICONS[subject.id];
              const isEnglish = subject.id === 'english';
              return (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => onEnterWorkspace(subject.id)}
                  className={`group relative flex flex-col items-start rounded-2xl border p-3.5 text-left transition hover:-translate-y-1 hover:shadow-md ${
                    isEnglish
                      ? 'border-indigo-200 bg-white ring-1 ring-indigo-100 hover:border-indigo-400'
                      : 'border-slate-200/90 bg-white/90 hover:border-indigo-300'
                  }`}
                >
                  {isEnglish && (
                    <span className="absolute top-2.5 right-2.5 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                      Chính
                    </span>
                  )}
                  <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition group-hover:bg-indigo-600 group-hover:text-white">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-sm font-bold text-slate-900">{subject.name}</div>
                  <div className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">
                    {subject.tagline}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 3-Step Workflow */}
        <section className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              step: '01',
              icon: UploadCloud,
              title: 'Nhập bài dạy hoặc tải tài liệu',
              desc: 'Gõ chủ đề hoặc tải ảnh trang sách, Word (.docx), PDF, file nghe MP3 có sẵn.',
            },
            {
              step: '02',
              icon: Wand2,
              title: 'AI tạo đề bám sát trình độ',
              desc: 'Tự động chia phần, bẫy nhẹ lỗi hay sai, kèm đáp án & giải thích chi tiết.',
            },
            {
              step: '03',
              icon: Send,
              title: 'Chỉnh sửa & giao bài đa kênh',
              desc: 'Dán thêm ảnh minh họa (Ctrl+V), xuất Word/PDF hoặc gửi link cho học sinh tự chấm.',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="flex items-start gap-3.5 rounded-2xl border border-slate-200/80 bg-white/85 p-4 backdrop-blur-xs"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-extrabold text-xs">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-indigo-600">BƯỚC {item.step}</div>
                  <div className="text-sm font-bold text-slate-900">{item.title}</div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
};

