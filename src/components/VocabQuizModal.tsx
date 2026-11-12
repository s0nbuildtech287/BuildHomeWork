import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, ClipboardCopy, Minus, Plus, Sparkles, X } from 'lucide-react';

interface VocabItem {
  raw: string;
  word: string;
  meaning?: string;
  phonetic?: string;
}

export interface VocabQuizModalApplyData {
  vocabularyFocus: string;
  topicName?: string;
  counts: {
    pronunciation_stress: number;
    closest_meaning: number;
    vocab_en_to_vi: number;
    vocab_vi_to_en: number;
    multiple_choice: number;
    fill_blank: number;
    word_form: number;
  };
}

interface VocabQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: VocabQuizModalApplyData) => void;
}

interface SectionRowConfig {
  key: keyof VocabQuizModalApplyData['counts'];
  label: string;
  desc: string;
  checked: boolean;
  count: number;
}

export function parseYourHomeworkVocabText(text: string): {
  items: VocabItem[];
  suggestedTopic?: string;
} {
  const lines = (text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let suggestedTopic: string | undefined;
  const items: VocabItem[] = [];

  for (const line of lines) {
    const topicMatch = line.match(/(?:Bộ Từ vựng|Flashcard|Unit|Topic)[:–\-]\s*([^\n(]+)/i);
    if (topicMatch && !suggestedTopic) {
      suggestedTopic = topicMatch[1].trim();
      continue;
    }

    if (/^STT\s+/i.test(line) || /^STT\t/i.test(line)) {
      continue;
    }

    const cols = line.includes('\t')
      ? line.split('\t').map((c) => c.trim())
      : line.split(/\s{2,}/).map((c) => c.trim());

    let word = '';
    let meaning = '';
    let phonetic = '';

    if (cols.length >= 2 && /^\d+$/.test(cols[0])) {
      word = cols[1] || '';
      meaning = cols[2] || '';
      phonetic = cols[3] || '';
    } else if (cols.length >= 1) {
      word = cols[0] || '';
      meaning = cols[1] || '';
      phonetic = cols[2] || '';
    }

    word = word.replace(/^\d+[\.\-\)]\s*/, '').trim();
    if (!word || word.length < 1) continue;

    if (!phonetic) {
      const pMatch = line.match(/\/[^\/]+\//);
      if (pMatch) phonetic = pMatch[0];
    }

    items.push({
      raw: line,
      word,
      meaning: meaning || undefined,
      phonetic: phonetic || undefined,
    });
  }

  return { items, suggestedTopic };
}

export const VocabQuizModal: React.FC<VocabQuizModalProps> = ({
  isOpen,
  onClose,
  onApply,
}) => {
  const [rawText, setRawText] = useState('');
  const [copiedSample, setCopiedSample] = useState(false);

  const parsed = useMemo(() => parseYourHomeworkVocabText(rawText), [rawText]);
  const wordCount = parsed.items.length;

  const [sections, setSections] = useState<SectionRowConfig[]>([
    {
      key: 'vocab_en_to_vi',
      label: 'Dịch Anh → Việt',
      desc: 'Cho từ tiếng Anh, chọn nghĩa tiếng Việt đúng (A/B/C/D)',
      checked: true,
      count: 4,
    },
    {
      key: 'vocab_vi_to_en',
      label: 'Dịch Việt → Anh',
      desc: 'Cho nghĩa tiếng Việt, chọn từ tiếng Anh đúng (A/B/C/D)',
      checked: true,
      count: 4,
    },
    {
      key: 'closest_meaning',
      label: 'Từ đồng nghĩa (CLOSEST)',
      desc: 'Câu ngữ cảnh gạch chân từ + 4 lựa chọn thay thế',
      checked: true,
      count: 3,
    },
    {
      key: 'pronunciation_stress',
      label: 'Phát âm & Trọng âm',
      desc: 'Tìm từ có phần phát âm hoặc trọng âm khác',
      checked: true,
      count: 3,
    },
    {
      key: 'multiple_choice',
      label: 'Trắc nghiệm theo ngữ cảnh',
      desc: 'Chọn từ vựng đúng để hoàn thành câu (A/B/C/D)',
      checked: true,
      count: 4,
    },
    {
      key: 'fill_blank',
      label: 'Điền từ vào chỗ trống',
      desc: 'Đọc câu và tự điền từ vựng thích hợp vào chỗ trống',
      checked: false,
      count: 3,
    },
    {
      key: 'word_form',
      label: 'Chia dạng từ (Word Form)',
      desc: 'Chia đúng dạng Danh / Động / Tính / Trạng từ',
      checked: false,
      count: 3,
    },
  ]);

  // Auto scale suggested counts when new text is pasted
  useEffect(() => {
    if (wordCount === 0) return;
    const base = Math.max(2, Math.min(6, Math.round(wordCount / 2)));
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        count: Math.max(1, Math.min(wordCount, base)),
      }))
    );
  }, [wordCount]);

  if (!isOpen) return null;

  const totalQuestions = sections.reduce(
    (sum, s) => sum + (s.checked ? s.count : 0),
    0
  );

  const toggleSection = (key: keyof VocabQuizModalApplyData['counts']) => {
    setSections((prev) =>
      prev.map((s) => (s.key === key ? { ...s, checked: !s.checked } : s))
    );
  };

  const changeSectionCount = (
    key: keyof VocabQuizModalApplyData['counts'],
    delta: number
  ) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.key !== key) return s;
        const next = Math.max(1, Math.min(30, s.count + delta));
        return { ...s, count: next, checked: true };
      })
    );
  };

  const setExactCount = (
    key: keyof VocabQuizModalApplyData['counts'],
    val: number
  ) => {
    const safe = Number.isNaN(val) ? 0 : Math.max(0, Math.min(50, Math.floor(val)));
    setSections((prev) =>
      prev.map((s) => {
        if (s.key !== key) return s;
        return { ...s, count: safe, checked: safe > 0 };
      })
    );
  };

  const handlePasteSample = () => {
    const sample = `STT\tTừ\tNghĩa\tPhiên âm\t
1\tfence\thàng rào\t/fˈɛns/
2\tplant\tcây cối, trồng cây\t/plˈænt/
3\tinteresting\tthú vị\t/ˈɪntrɛstɪŋ/
4\tIT\tmôn tin học\t/ˌaɪtˈiː/
5\tP.E\tmôn thể dục\t/pˌiːˈiː/
6\ttimetable\tthời khóa biểu\t/ˈtaɪmˌteɪbl/`;
    setRawText(sample);
    setCopiedSample(true);
    setTimeout(() => setCopiedSample(false), 1500);
  };

  const handleApply = () => {
    if (wordCount === 0) {
      alert('Vui lòng dán danh sách từ vựng trước khi tạo phiếu bài tập nhé!');
      return;
    }
    if (totalQuestions === 0) {
      alert('Vui lòng chọn ít nhất 1 dạng bài và số câu > 0!');
      return;
    }

    const counts: VocabQuizModalApplyData['counts'] = {
      pronunciation_stress: 0,
      closest_meaning: 0,
      vocab_en_to_vi: 0,
      vocab_vi_to_en: 0,
      multiple_choice: 0,
      fill_blank: 0,
      word_form: 0,
    };

    for (const sec of sections) {
      if (sec.checked && sec.count > 0) {
        counts[sec.key] = sec.count;
      }
    }

    const formattedVocabLines = parsed.items.map((it, idx) => {
      const parts = [`${idx + 1}. ${it.word}`];
      if (it.phonetic) parts.push(`(${it.phonetic})`);
      if (it.meaning) parts.push(`: ${it.meaning}`);
      return parts.join(' ');
    });

    onApply({
      vocabularyFocus: formattedVocabLines.join('\n'),
      topicName: parsed.suggestedTopic,
      counts,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Tạo nhanh phiếu Kiểm tra từ vựng
              </h2>
              <p className="text-xs text-slate-500">
                Dán bảng từ vựng từ YourHomework (hoặc Excel/Word) &amp; tùy chỉnh số câu
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Dán bảng từ vựng (copy từ mục Xem trên YourHomework)
              </label>
              <button
                type="button"
                onClick={handlePasteSample}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-700 hover:underline"
              >
                <ClipboardCopy className="h-3 w-3" />
                {copiedSample ? 'Đã dán mẫu' : 'Dán thử mẫu 6 từ'}
              </button>
            </div>
            <textarea
              rows={5}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="STT	Từ	Nghĩa	Phiên âm
1	fence	hàng rào	/fˈɛns/
2	plant	cây cối	/plˈænt/
3	interesting	thú vị	/ˈɪntrɛstɪŋ/
4	IT	môn tin học	/ˌaɪtˈiː/
5	P.E	môn thể dục	/pˌiːˈiː/
6	timetable	thời khóa biểu	/ˈtaɪmˌteɪbl/"
              className="w-full rounded-xl border border-slate-300 p-3 font-mono text-xs focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
            />
          </div>

          {/* Quick Summary Preview */}
          {wordCount > 0 && (
            <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3">
              <div className="flex items-center justify-between text-xs font-bold text-purple-900">
                <span>
                  ✓ Đã nhận diện {wordCount} từ vựng
                  {parsed.suggestedTopic ? ` • Chủ đề: ${parsed.suggestedTopic}` : ''}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {parsed.items.slice(0, 12).map((it, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 shadow-2xs"
                  >
                    <strong>{it.word}</strong>
                    {it.meaning && <span className="text-slate-500">({it.meaning})</span>}
                  </span>
                ))}
                {wordCount > 12 && (
                  <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[11px] font-bold text-purple-800">
                    +{wordCount - 12} từ nữa
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Section rows with checkboxes & number counter */}
          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Chọn dạng bài &amp; chỉnh số câu cho từng dạng:
              </span>
              <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-800">
                Tổng: {totalQuestions} câu
              </span>
            </div>

            <div className="divide-y divide-slate-200/80 rounded-lg border border-slate-200 bg-white">
              {sections.map((sec) => (
                <div
                  key={sec.key}
                  className={`flex items-center justify-between gap-3 p-2.5 transition ${
                    sec.checked ? 'bg-purple-50/30' : 'opacity-60'
                  }`}
                >
                  <label className="flex flex-1 cursor-pointer items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={sec.checked}
                      onChange={() => toggleSection(sec.key)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800">{sec.label}</div>
                      <div className="text-[11px] text-slate-500">{sec.desc}</div>
                    </div>
                  </label>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={!sec.checked || sec.count <= 1}
                      onClick={() => changeSectionCount(sec.key, -1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={sec.count}
                      onChange={(e) => setExactCount(sec.key, parseInt(e.target.value, 10))}
                      className="h-7 w-12 rounded-lg border border-slate-300 bg-white text-center text-xs font-bold text-slate-800 focus:border-purple-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={!sec.checked}
                      onClick={() => changeSectionCount(sec.key, +1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <span className="text-[11px] font-medium text-slate-500">câu</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-3.5">
          <span className="text-xs text-slate-600">
            {wordCount > 0
              ? `Phiếu sẽ có ${totalQuestions} câu hỏi từ ${wordCount} từ vựng này.`
              : 'Dán từ vựng để tiếp tục.'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={wordCount === 0 || totalQuestions === 0}
              onClick={handleApply}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-700 disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" /> Áp dụng vào đề thi ({totalQuestions} câu)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
