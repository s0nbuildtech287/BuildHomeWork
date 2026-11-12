import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Headphones,
  RotateCcw,
  Send,
  Volume2,
  XCircle,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { MathText } from './MathText';
import { saveLocalSubmission } from '../services/storage';
import { GradedQuestionResult, Homework, StudentSubmission } from '../types';
import { gradeHomework, isChoiceQuestion, isEssayQuestion, stripOptionPrefix } from '../utils/grading';
import { createId } from '../utils/promptBuilder';
import { decodeHomeworkFromHash } from '../utils/shareCodec';

interface OnlineQuizViewProps {
  quizId?: string;
  encodedData?: string;
  previewHomework?: Homework | null;
  onExitPreview?: () => void;
}

export const OnlineQuizView: React.FC<OnlineQuizViewProps> = ({
  quizId,
  encodedData,
  previewHomework,
  onExitPreview,
}) => {
  const [homework, setHomework] = useState<Homework | null>(previewHomework || null);
  const [isServerQuiz, setIsServerQuiz] = useState(false);
  const [loading, setLoading] = useState(!previewHomework);
  const [error, setError] = useState('');

  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState<StudentSubmission | null>(null);

  useEffect(() => {
    if (previewHomework) {
      setHomework(previewHomework);
      setIsServerQuiz(false);
      setLoading(false);
      return;
    }

    if (encodedData) {
      const decoded = decodeHomeworkFromHash(encodedData);
      if (decoded) {
        setHomework(decoded);
        setIsServerQuiz(false);
      } else {
        setError('Đường link bài tập không hợp lệ hoặc bị thiếu dữ liệu.');
      }
      setLoading(false);
      return;
    }

    if (quizId) {
      setLoading(true);
      fetch(`/api/quiz/${encodeURIComponent(quizId)}`)
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Không tải được bài tập');
          setHomework(data.homework);
          setIsServerQuiz(true);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Không tìm thấy bài tập.');
        })
        .finally(() => setLoading(false));
    }
  }, [quizId, encodedData, previewHomework]);

  const handleSelectWord = (qId: string, word: string) => {
    if (submission) return;
    const current = (answers[qId] || '').trim();
    const next = current ? `${current} ${word}` : word;
    setAnswers((prev) => ({ ...prev, [qId]: next }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homework) return;
    if (!studentName.trim()) {
      alert('Em hãy nhập Họ và Tên trước khi nộp bài nhé!');
      return;
    }

    setSubmitting(true);
    try {
      if (isServerQuiz && quizId) {
        const res = await fetch(`/api/quiz/${encodeURIComponent(quizId)}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentName: studentName.trim(),
            studentClass: studentClass.trim(),
            answers,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Lỗi nộp bài');
        if (data.homeworkWithKeys) setHomework(data.homeworkWithKeys);
        setSubmission(data.submission);
      } else {
        const graded = gradeHomework(homework, answers);
        const sub: StudentSubmission = {
          id: createId('sub'),
          homeworkId: homework.id,
          studentName: studentName.trim(),
          studentClass: studentClass.trim(),
          submittedAt: new Date().toISOString(),
          score: graded.score,
          totalQuestions: graded.totalQuestions,
          answers,
          results: graded.results,
        };
        saveLocalSubmission(sub);
        setSubmission(sub);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không nộp được bài, hãy thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setSubmission(null);
    setAnswers({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <p className="text-sm font-medium text-slate-600">Đang tải bài tập...</p>
      </div>
    );
  }

  if (error || !homework) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-xs">
          <XCircle className="mx-auto h-10 w-10 text-red-500" />
          <h2 className="mt-3 text-base font-bold text-slate-900">Không mở được bài tập</h2>
          <p className="mt-1 text-sm text-slate-600">{error || 'Bài tập không tồn tại.'}</p>
        </div>
      </div>
    );
  }

  const resultMap = new Map<string, GradedQuestionResult>();
  if (submission) {
    for (const r of submission.results) {
      resultMap.set(r.questionId, r);
    }
  }

  let qNum = 1;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-3xl space-y-5">
        {onExitPreview && (
          <button
            type="button"
            onClick={onExitPreview}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" /> Thoát chế độ xem thử Học sinh
          </button>
        )}

        {/* Header */}
        <div className="flex items-start gap-3.5 rounded-2xl border border-indigo-100 bg-white p-6 shadow-xs">
          <BrandLogo className="mt-0.5 h-11 w-11 rounded-xl shadow-xs" />
          <div className="min-w-0 flex-1">
            {(homework.centerName || homework.teacherName) && (
              <p className="text-xs font-bold tracking-wide text-indigo-600 uppercase">
                {[homework.centerName, homework.teacherName ? `GV: ${homework.teacherName}` : '']
                  .filter(Boolean)
                  .join(' • ')}
              </p>
            )}
            <h1 className="mt-0.5 text-2xl font-bold text-slate-900">{homework.title}</h1>
            {homework.subtitle && (
              <p className="mt-1 text-sm text-slate-600">{homework.subtitle}</p>
            )}
          </div>
        </div>

        {/* Score Result Banner */}
        {submission && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-emerald-950">
                    Chúc mừng {submission.studentName} đã hoàn thành!
                  </h2>
                  <p className="text-sm text-emerald-800">
                    {submission.totalQuestions > 0 ? (
                      <>
                        Kết quả trắc nghiệm/điền từ:{' '}
                        <strong className="text-lg">
                          {submission.score} / {submission.totalQuestions}
                        </strong>{' '}
                        câu đúng (
                        {Math.round((submission.score / submission.totalQuestions) * 100)}
                        %)
                      </>
                    ) : (
                      'Bài làm của em đã được ghi nhận! Hãy xem bài mẫu gợi ý bên dưới nhé.'
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-4 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Làm lại
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Student Info */}
          {!submission && (
            <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Họ và Tên học sinh *
                </label>
                <input
                  required
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="VD: Nguyễn Minh Anh"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Lớp</label>
                <input
                  type="text"
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                  placeholder={homework.gradeOrClass || 'VD: 7A'}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Sections */}
          {homework.sections.map((section) => (
            <div
              key={section.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
            >
              <h2 className="text-base font-bold text-indigo-700">{section.title}</h2>
              {section.instruction && (
                <p className="mt-0.5 text-xs text-slate-500 italic">{section.instruction}</p>
              )}

              {section.wordBank && section.wordBank.length > 0 && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
                  {section.wordBank.every((w) => /^[A-Za-z][.)]\s+/.test(w.trim())) ? (
                    <div className="space-y-1">
                      <div className="mb-1.5 text-xs font-bold text-slate-600 uppercase">
                        Bảng lựa chọn:
                      </div>
                      {section.wordBank.map((item, idx) => (
                        <div key={idx} className="font-medium">
                          {item}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-700">
                      <strong>Gợi ý từ:</strong> {section.wordBank.join('  •  ')}
                    </div>
                  )}
                </div>
              )}

              {(section.audioUrl || section.listeningScript) && (
                <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                    <Headphones className="h-4 w-4 text-indigo-600" />
                    Bấm nút Play để nghe bài nghe (có thể nghe lại nếu chưa rõ)
                  </div>
                  {section.audioUrl ? (
                    <audio controls src={section.audioUrl} className="h-10 w-full" />
                  ) : (
                    section.listeningScript &&
                    typeof window !== 'undefined' &&
                    'speechSynthesis' in window && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            window.speechSynthesis.cancel();
                            const utter = new SpeechSynthesisUtterance(section.listeningScript);
                            utter.lang = 'en-US';
                            utter.rate = homework.level === 'elementary' ? 0.85 : 0.95;
                            window.speechSynthesis.speak(utter);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                        >
                          <Volume2 className="h-4 w-4" /> Nghe bài đọc tiếng Anh
                        </button>
                        <button
                          type="button"
                          onClick={() => window.speechSynthesis.cancel()}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Dừng đọc
                        </button>
                      </div>
                    )
                  )}

                  {submission && section.listeningScript && (
                    <div className="rounded-lg border border-indigo-100 bg-white p-3 text-xs leading-relaxed text-slate-700 whitespace-pre-line">
                      <strong className="text-indigo-800">Lời thoại bài nghe (Tapescript):</strong>
                      <div className="mt-1">{section.listeningScript}</div>
                    </div>
                  )}
                </div>
              )}

              {section.imageUrl && (
                <div className="mt-3">
                  <img
                    src={section.imageUrl}
                    alt={section.title}
                    className="max-h-72 w-auto rounded-xl border border-slate-200 object-contain"
                  />
                </div>
              )}

              {section.readingPassage && (
                <div className="mt-3 rounded-xl border-l-4 border-indigo-400 bg-slate-50 p-4 text-sm leading-relaxed text-slate-800 whitespace-pre-line">
                  {section.readingPassage}
                </div>
              )}

              <div className="mt-4 space-y-5">
                {section.questions.map((q) => {
                  const num = qNum++;
                  const res = resultMap.get(q.id);
                  const val = answers[q.id] || '';

                  return (
                    <div
                      key={q.id}
                      className={`rounded-xl border p-4 ${
                        res
                          ? res.isManualReview
                            ? 'border-indigo-200 bg-indigo-50/30'
                            : res.isCorrect
                              ? 'border-emerald-300 bg-emerald-50/40'
                              : 'border-rose-300 bg-rose-50/40'
                          : 'border-slate-200 bg-slate-50/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900 whitespace-pre-line">
                          <span className="mr-1.5 text-indigo-600">Câu {num}.</span>
                          {q.type === 'sentence_order' && q.words?.length ? (
                            'Sắp xếp các từ sau thành câu hoàn chỉnh:'
                          ) : (
                            <MathText text={q.prompt} />
                          )}
                        </p>
                        {res &&
                          !res.isManualReview &&
                          (res.isCorrect ? (
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                          ) : (
                            <XCircle className="h-5 w-5 shrink-0 text-rose-600" />
                          ))}
                      </div>

                      {/* Question Image */}
                      {q.imageUrl && (
                        <div className="mt-2.5">
                          <img
                            src={q.imageUrl}
                            alt={`Hình minh họa câu ${num}`}
                            className="max-h-60 w-auto rounded-xl border border-slate-200 bg-white object-contain"
                          />
                        </div>
                      )}

                      {/* Multiple Choice & Find Mistake */}
                      {isChoiceQuestion(q) && q.options && (
                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {q.options.map((opt, idx) => {
                            const cleanOpt = stripOptionPrefix(opt);
                            const selected = val === cleanOpt;
                            return (
                              <button
                                key={idx}
                                type="button"
                                disabled={Boolean(submission)}
                                onClick={() => setAnswers((p) => ({ ...p, [q.id]: cleanOpt }))}
                                className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm transition ${
                                  selected
                                    ? 'border-indigo-600 bg-indigo-50 font-semibold text-indigo-900 ring-1 ring-indigo-500'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <span
                                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                    selected
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {String.fromCharCode(65 + idx)}
                                </span>
                                <MathText text={cleanOpt} />
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Sentence Order (tap words + input) */}
                      {q.type === 'sentence_order' && (
                        <div className="mt-3 space-y-2">
                          {q.words && q.words.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {q.words.map((word, wIdx) => (
                                <button
                                  key={wIdx}
                                  type="button"
                                  disabled={Boolean(submission)}
                                  onClick={() => handleSelectWord(q.id, word)}
                                  className="rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                                >
                                  {word}
                                </button>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              disabled={Boolean(submission)}
                              value={val}
                              onChange={(e) =>
                                setAnswers((p) => ({ ...p, [q.id]: e.target.value }))
                              }
                              placeholder="Bấm vào từng từ ở trên hoặc gõ cả câu vào đây..."
                              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                            />
                            {!submission && val && (
                              <button
                                type="button"
                                onClick={() => setAnswers((p) => ({ ...p, [q.id]: '' }))}
                                className="rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-500 hover:bg-slate-100"
                              >
                                Xóa
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Fill Blank / Word Form / Rewrite / Short Answer */}
                      {(q.type === 'fill_blank' ||
                        q.type === 'word_form' ||
                        q.type === 'rewrite' ||
                        q.type === 'short_answer') && (
                        <div className="mt-3 space-y-2">
                          {q.type === 'fill_blank' &&
                            section.wordBank &&
                            section.wordBank.length > 0 &&
                            section.wordBank.every((w) => /^[A-Za-z][.)]\s+/.test(w.trim())) && (
                              <div className="flex flex-wrap gap-1.5">
                                {section.wordBank.map((item, idx) => {
                                  const letter = item.trim().charAt(0).toUpperCase();
                                  const selected = val.trim().toUpperCase() === letter;
                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      disabled={Boolean(submission)}
                                      onClick={() =>
                                        setAnswers((p) => ({ ...p, [q.id]: letter }))
                                      }
                                      className={`rounded-lg border px-3 py-1 text-xs font-bold transition ${
                                        selected
                                          ? 'border-indigo-600 bg-indigo-600 text-white'
                                          : 'border-slate-300 bg-white text-slate-700 hover:bg-indigo-50'
                                      }`}
                                    >
                                      {letter}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          <input
                            type="text"
                            disabled={Boolean(submission)}
                            value={val}
                            onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
                            placeholder="Nhập câu trả lời của em..."
                            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      )}

                      {/* Writing / Essay */}
                      {isEssayQuestion(q) && (
                        <textarea
                          rows={4}
                          disabled={Boolean(submission)}
                          value={val}
                          onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
                          placeholder="Viết bài trả lời của em vào đây..."
                          className="mt-3 w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm leading-relaxed focus:border-indigo-500 focus:outline-none"
                        />
                      )}

                      {/* Feedback after submit */}
                      {res && (
                        <div className="mt-3 rounded-lg bg-white/90 p-3 text-xs">
                          <div className="font-semibold text-emerald-800 whitespace-pre-line">
                            {res.isManualReview ? 'Bài mẫu / Đáp án gợi ý:' : 'Đáp án đúng:'}{' '}
                            <MathText text={res.correctAnswer} />
                          </div>
                          {res.explanation && (
                            <div className="mt-1 text-slate-600 whitespace-pre-line">
                              <strong>
                                {res.isManualReview ? 'Gợi ý & tiêu chí:' : 'Giải thích:'}
                              </strong>{' '}
                              <MathText text={res.explanation} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {!submission && (
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
              >
                <Send className="h-4 w-4" /> {submitting ? 'Đang chấm bài...' : 'Nộp bài & Xem điểm'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

