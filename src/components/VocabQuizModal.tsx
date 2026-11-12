import React, { useMemo, useState } from 'react';
import { BookOpen, ClipboardCopy, Sparkles, X } from 'lucide-react';

interface VocabItem {
  raw: string;
  word: string;
  meaning?: string;
  phonetic?: string;
}

interface VocabQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: {
    vocabularyFocus: string;
    topicName?: string;
    counts: {
      pronunciation_stress: number;
      closest_meaning: number;
      multiple_choice: number;
      fill_blank: number;
      word_form: number;
    };
  }) => void;
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
    // Detect header like "Bộ Từ vựng: GS4 UNIT 7 1011 (6 items)"
    const topicMatch = line.match(/(?:Bộ Từ vựng|Flashcard|Unit|Topic)[:–\-]\s*([^\n(]+)/i);
    if (topicMatch && !suggestedTopic) {
      suggestedTopic = topicMatch[1].trim();
      continue;
    }

    // Skip table header row
    if (/^STT\s+/i.test(line) || /^STT\t/i.test(line)) {
      continue;
    }

    // Split tab-separated or multi-space columns
    const cols = line.includes('\t')
      ? line.split('\t').map((c) => c.trim())
      : line.split(/\s{2,}/).map((c) => c.trim());

    // Format: STT \t Từ \t Nghĩa \t Phiên âm (hoặc Từ \t Nghĩa \t Phiên âm)
    let word = '';
    let meaning = '';
    let phonetic = '';

    if (cols.length >= 2 && /^\d+$/.test(cols[0])) {
      // Has leading STT (1, 2, 3...)
      word = cols[1] || '';
      meaning = cols[2] || '';
      phonetic = cols[3] || '';
    } else if (cols.length >= 1) {
      word = cols[0] || '';
      meaning = cols[1] || '';
      phonetic = cols[2] || '';
    }

    // Clean word
    word = word.replace(/^\d+[\.\-\)]\s*/, '').trim();

    // If word is empty, skip
    if (!word || word.length < 1) continue;

    // Detect phonetic inside slash /.../
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

  // Form options
  const [includePronunciation, setIncludePronunciation] = useState(true);
  const [includeClosest, setIncludeClosest] = useState(true);
  const [includeMeaningMcq, setIncludeMeaningMcq] = useState(true);
  const [includeFillBlank, setIncludeFillBlank] = useState(true);
  const [includeWordForm, setIncludeWordForm] = useState(true);

  const parsed = useMemo(() => parseYourHomeworkVocabText(rawText), [rawText]);
  const wordCount = parsed.items.length;

  if (!isOpen) return null;

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

    // Auto calculate balanced question counts based on word count
    const baseEach = Math.max(2, Math.min(8, Math.ceil(wordCount / 2)));
    const pronCount = includePronunciation ? Math.min(4, Math.max(2, Math.floor(wordCount / 2))) : 0;
    const closestCount = includeClosest ? Math.min(5, Math.max(2, Math.floor(wordCount / 2))) : 0;
    const mcqCount = includeMeaningMcq ? baseEach : 0;
    const fillCount = includeFillBlank ? Math.min(6, Math.max(2, Math.floor(wordCount / 2))) : 0;
    const wfCount = includeWordForm ? Math.min(4, Math.max(2, Math.floor(wordCount / 3))) : 0;

    // Build rich vocab string with phonetic and meaning
    const formattedVocabLines = parsed.items.map((it, idx) => {
      const parts = [`${idx + 1}. ${it.word}`];
      if (it.phonetic) parts.push(`(${it.phonetic})`);
      if (it.meaning) parts.push(`: ${it.meaning}`);
      return parts.join(' ');
    });

    onApply({
      vocabularyFocus: formattedVocabLines.join('\n'),
      topicName: parsed.suggestedTopic,
      counts: {
        pronunciation_stress: pronCount,
        closest_meaning: closestCount,
        multiple_choice: mcqCount,
        fill_blank: fillCount,
        word_form: wfCount,
      },
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
                Dán bảng từ vựng từ YourHomework (hoặc Excel/Word) để tự động ra đề
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
              rows={6}
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
                {parsed.items.slice(0, 15).map((it, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 shadow-2xs"
                  >
                    <strong>{it.word}</strong>
                    {it.meaning && <span className="text-slate-500">({it.meaning})</span>}
                  </span>
                ))}
                {wordCount > 15 && (
                  <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[11px] font-bold text-purple-800">
                    +{wordCount - 15} từ nữa
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Question types included */}
          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <span className="block text-xs font-bold text-slate-800">
              Các dạng bài sẽ tự động tạo cho bộ từ này:
            </span>
            <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
              <label className="flex items-center gap-2 font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={includePronunciation}
                  onChange={(e) => setIncludePronunciation(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                Phát âm &amp; Trọng âm (dựa trên phiên âm)
              </label>
              <label className="flex items-center gap-2 font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={includeClosest}
                  onChange={(e) => setIncludeClosest(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                Từ đồng nghĩa (CLOSEST in meaning)
              </label>
              <label className="flex items-center gap-2 font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={includeMeaningMcq}
                  onChange={(e) => setIncludeMeaningMcq(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                Trắc nghiệm chọn từ theo ngữ cảnh (A/B/C/D)
              </label>
              <label className="flex items-center gap-2 font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={includeFillBlank}
                  onChange={(e) => setIncludeFillBlank(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                Điền từ vào chỗ trống theo ngữ cảnh
              </label>
              <label className="flex items-center gap-2 font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={includeWordForm}
                  onChange={(e) => setIncludeWordForm(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                Chia dạng từ (Word Form - Noun/Verb/Adj/Adv)
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-3.5">
          <span className="text-xs text-slate-500">
            {wordCount > 0 ? `Sẽ tạo phiếu bài tập bám sát ${wordCount} từ này.` : 'Dán từ vựng để tiếp tục.'}
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
              disabled={wordCount === 0}
              onClick={handleApply}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-700 disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" /> Áp dụng vào đề thi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
