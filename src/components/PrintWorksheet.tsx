import React, { useState } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { MathText } from './MathText';
import { Homework } from '../types';
import { loadSettings } from '../services/storage';
import {
  formatMcqOptionDisplay,
  isChoiceQuestion,
  isEssayQuestion,
  resolveCorrectOptionIndex,
  splitFormattedLines,
  stripOptionPrefix,
} from '../utils/grading';

interface PrintWorksheetProps {
  homework: Homework;
  onBack: () => void;
}

type PrintMode = 'student' | 'student_with_key' | 'teacher';

export const PrintWorksheet: React.FC<PrintWorksheetProps> = ({ homework, onBack }) => {
  const [mode, setMode] = useState<PrintMode>('student_with_key');
  const settings = loadSettings();
  const useBrandBar = settings.enableBrandHeaderFooter !== false;
  const barColor = `#${(settings.headerFooterColor || '7075B8').replace(/^#/, '')}`;
  const headerLeft = settings.headerLeft?.trim() || 'MS. HUONG - 0327161636';
  const headerRight = settings.headerRight?.trim() || 'T-CLASS EDUCATION - 0978386622';
  const footerLeft =
    settings.footerLeft?.trim() ||
    'T-CLASS EDUCATION - Số nhà 9,12,14-16 Ngõ 71 Khu Dịch vụ 3, Văn Phú, Hà Đông, HN';

  let questionCounter = 1;
  const answerSummary: Array<{ num: number; answer: string; explanation: string }> = [];
  const listeningScripts = homework.sections
    .filter((s) => Boolean(s.listeningScript))
    .map((s) => ({ title: s.title, script: s.listeningScript || '' }));

  return (
    <div className="min-h-screen bg-slate-100 pb-12">
      {/* Toolbar hidden when printing */}
      <div className="no-print sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-3 shadow-xs">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" /> Quay lại chỉnh sửa
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as PrintMode)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
            >
              <option value="student">Chỉ in Đề bài (cho học sinh)</option>
              <option value="student_with_key">Đề bài + Trang Đáp án cuối</option>
              <option value="teacher">Đề bài + Đáp án & Giải thích</option>
            </select>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700"
            >
              <Printer className="h-4 w-4" /> In / Lưu thành PDF
            </button>
          </div>
        </div>
      </div>

      {/* A4 Worksheet Canvas */}
      <div className="print-only-container font-worksheet mx-auto mt-6 max-w-[210mm] rounded-xl border border-slate-200 bg-white p-10 shadow-md">
        {useBrandBar && (
          <div
            className="mb-4 flex items-center justify-between px-3 py-1 font-serif text-xs font-bold italic text-white"
            style={{
              backgroundColor: barColor,
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
            }}
          >
            <span>{headerLeft}</span>
            <span>{headerRight}</span>
          </div>
        )}
        {(homework.centerName || homework.teacherName) && (
          <div className="mb-1 text-center text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {[homework.centerName, homework.teacherName ? `GV: ${homework.teacherName}` : '']
              .filter(Boolean)
              .join('  •  ')}
          </div>
        )}

        <h1 className="text-center text-xl font-bold text-slate-900 uppercase">
          {homework.title}
        </h1>
        {homework.subtitle && (
          <p className="mt-1 text-center text-sm text-slate-600 italic">{homework.subtitle}</p>
        )}

        {/* Student Name & Class Grid */}
        <div className="mt-4 grid grid-cols-12 border border-slate-400 text-sm">
          <div className="col-span-6 border-r border-slate-400 px-3 py-2">
            <strong>Full name:</strong> .....................................................
          </div>
          <div className="col-span-3 border-r border-slate-400 px-3 py-2">
            <strong>Class:</strong> {homework.gradeOrClass || '..............'}
          </div>
          <div className="col-span-3 px-3 py-2">
            <strong>Score:</strong> ....... / .......
          </div>
        </div>

        {/* Sections */}
        <div className="mt-6 space-y-5">
          {homework.sections.map((section) => (
            <div key={section.id}>
              <h2 className="text-base font-bold text-slate-900">{section.title}</h2>
              {section.instruction && (
                <p className="mb-2 text-sm text-slate-600 italic">{section.instruction}</p>
              )}

              {section.wordBank && section.wordBank.length > 0 && (
                <div className="avoid-break mb-3 rounded border border-slate-400 bg-slate-50 px-4 py-2.5 text-sm">
                  {section.wordBank.every((w) => /^[A-Za-z][.)]\s+/.test(w.trim())) ? (
                    <div className="space-y-1">
                      {section.wordBank.map((item, idx) => (
                        <div key={idx}>{item}</div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <strong>Word bank:</strong> {section.wordBank.join('   •   ')}
                    </>
                  )}
                </div>
              )}

              {section.imageUrl && (
                <div className="avoid-break mb-3">
                  <img
                    src={section.imageUrl}
                    alt={section.title}
                    className="max-h-60 w-auto rounded border border-slate-300 object-contain"
                  />
                </div>
              )}

              {section.readingPassage && (
                <div className="mb-3 rounded border-l-4 border-slate-400 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-800 whitespace-pre-line">
                  {splitFormattedLines(section.readingPassage).join('\n')}
                </div>
              )}

              <div className="space-y-2.5">
                {section.questions.map((q) => {
                  const qNum = questionCounter++;
                  let displayCorrect = q.correctAnswer;
                  if (isChoiceQuestion(q) && q.options?.length) {
                    const idx = resolveCorrectOptionIndex(q);
                    if (idx >= 0) {
                      displayCorrect = `${String.fromCharCode(65 + idx)}. ${stripOptionPrefix(
                        q.options[idx]
                      )}`;
                    }
                  }
                  answerSummary.push({
                    num: qNum,
                    answer: displayCorrect,
                    explanation: q.explanation,
                  });

                  return (
                    <div key={q.id} className="avoid-break text-[14px] leading-relaxed">
                      {q.type === 'sentence_order' && q.words?.length ? (
                        <div>
                          <p>
                            <strong>{qNum}.</strong> {q.words.join(' / ')}
                          </p>
                          <p className="mt-1 pl-5 text-slate-500">
                            → ..........................................................................................................
                          </p>
                        </div>
                      ) : (
                        <p className="whitespace-pre-line">
                          <strong>{qNum}.</strong> <MathText text={splitFormattedLines(q.prompt).join('\n')} />
                        </p>
                      )}

                      {q.imageUrl && (
                        <div className="mt-1.5 pl-5">
                          <img
                            src={q.imageUrl}
                            alt={`Hình câu ${qNum}`}
                            className="max-h-48 w-auto rounded border border-slate-300 object-contain"
                          />
                        </div>
                      )}

                      {isChoiceQuestion(q) && q.options?.length && (() => {
                        const formattedList = q.options.map((opt, idx) =>
                          formatMcqOptionDisplay(opt, idx)
                        );
                        const maxLen = Math.max(...formattedList.map((x) => x.full.length), 0);
                        const gridCls =
                          maxLen > 38
                            ? 'grid-cols-1'
                            : maxLen <= 16 && formattedList.length === 4
                              ? 'grid-cols-4'
                              : 'grid-cols-2';
                        return (
                          <div className={`mt-1 grid ${gridCls} gap-x-6 gap-y-1 pl-5`}>
                            {formattedList.map((formatted, idx) => (
                              <span key={idx}>
                                <strong>{formatted.letter}.</strong>
                                {formatted.text ? (
                                  <>
                                    {' '}
                                    <MathText text={formatted.text} />
                                  </>
                                ) : null}
                              </span>
                            ))}
                          </div>
                        );
                      })()}

                      {q.type === 'rewrite' && !q.prompt.includes('____') && (
                        <p className="mt-1 pl-5 text-slate-500">
                          → ..........................................................................................................
                        </p>
                      )}

                      {isEssayQuestion(q) && (
                        <div className="mt-2 space-y-2 pl-5 text-slate-400">
                          <p>................................................................................................................</p>
                          <p>................................................................................................................</p>
                          <p>................................................................................................................</p>
                          <p>................................................................................................................</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Answer Key Page */}
        {mode !== 'student' && answerSummary.length > 0 && (
          <div className="page-break-before mt-8 border-t-2 border-dashed border-slate-300 pt-6">
            <h2 className="mb-3 text-center text-lg font-bold text-slate-900 uppercase">
              {mode === 'teacher' ? 'Answer Key & Explanations' : 'Answer Key'}
            </h2>
            <div className="space-y-1.5 text-sm">
              {answerSummary.map((item) => (
                <div key={item.num} className="avoid-break">
                  <strong>Câu {item.num}:</strong>{' '}
                  <span className="font-semibold text-emerald-800 whitespace-pre-line">
                    <MathText text={item.answer} />
                  </span>
                  {mode === 'teacher' && item.explanation && (
                    <span className="text-slate-600">
                      {' '}
                      — <MathText text={item.explanation} />
                    </span>
                  )}
                </div>
              ))}
            </div>

            {listeningScripts.length > 0 && (
              <div className="mt-6 space-y-3 border-t border-slate-200 pt-4 text-sm">
                <h3 className="font-bold text-slate-900 uppercase">Listening Tapescript</h3>
                {listeningScripts.map((ls, idx) => (
                  <div key={idx} className="rounded bg-slate-50 p-3">
                    <div className="font-semibold text-slate-800">{ls.title}</div>
                    <p className="mt-1 text-slate-700 whitespace-pre-line">{ls.script}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {useBrandBar && (
          <div
            className="mt-8 flex items-center justify-between px-3 py-1 font-serif text-[11px] italic text-white"
            style={{
              backgroundColor: barColor,
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
            }}
          >
            <span>{footerLeft}</span>
            <span>Page | 1</span>
          </div>
        )}
      </div>
    </div>
  );
};

