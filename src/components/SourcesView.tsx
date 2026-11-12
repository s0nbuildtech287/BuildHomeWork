import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Bookmark,
  BookMarked,
  Check,
  Clock,
  ExternalLink,
  Globe,
  Link2,
  Loader2,
  Newspaper,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { getSubjectDefinition, SUBJECT_LIST } from '../config/subjects';
import { ReferenceSource, SubjectId } from '../types';
import { createId } from '../utils/promptBuilder';

interface SourcesViewProps {
  sources: ReferenceSource[];
  defaultSubject: SubjectId;
  onSaveSource: (source: ReferenceSource) => void;
  onDeleteSource: (id: string) => void;
  onUseSourceForGenerator: (source: ReferenceSource) => void;
}

interface FeedNewsItem {
  id: string;
  subject: SubjectId;
  title: string;
  link: string;
  sourceName: string;
  pubDate: string;
  summary: string;
}

function formatRelativeTime(dateStr: string): string {
  const ts = new Date(dateStr).getTime();
  if (Number.isNaN(ts)) return '';
  const diffMins = Math.max(1, Math.floor((Date.now() - ts) / 60000));
  if (diffMins < 60) return `${diffMins} phút trước`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays <= 7) return `${diffDays} ngày trước`;
  return new Date(ts).toLocaleDateString('vi-VN');
}

export const SourcesView: React.FC<SourcesViewProps> = ({
  sources,
  defaultSubject,
  onSaveSource,
  onDeleteSource,
  onUseSourceForGenerator,
}) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'saved'>('feed');

  // Live News Feed State
  const [feedSubject, setFeedSubject] = useState<SubjectId | 'all'>('all');
  const [feedQuery, setFeedQuery] = useState('');
  const [feedItems, setFeedItems] = useState<FeedNewsItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState('');
  const [savedNoticeId, setSavedNoticeId] = useState<string | null>(null);

  // Quick Reader Modal State
  const [readerItem, setReaderItem] = useState<FeedNewsItem | null>(null);
  const [readerContent, setReaderContent] = useState('');
  const [readerLoading, setReaderLoading] = useState(false);
  const [readerNote, setReaderNote] = useState('');

  // Saved / Manual Source State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [subject, setSubject] = useState<SubjectId>(defaultSubject);
  const [urlInput, setUrlInput] = useState('');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');

  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [saveNotice, setSaveNotice] = useState('');

  const [query, setQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState<SubjectId | 'all'>('all');

  const loadFeed = useCallback(async (subj: SubjectId | 'all') => {
    setFeedLoading(true);
    setFeedError('');
    try {
      const res = await fetch(`/api/feed-sources?subject=${encodeURIComponent(subj)}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || `Không tải được bảng tin (HTTP ${res.status}).`);
      }
      setFeedItems(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      setFeedError(
        err instanceof Error
          ? err.message
          : 'Chưa kết nối được bảng tin. Hãy thử làm mới lại sau.'
      );
    } finally {
      setFeedLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed(feedSubject);
  }, [feedSubject, loadFeed]);

  const filteredFeed = useMemo(() => {
    const q = feedQuery.trim().toLowerCase();
    if (!q) return feedItems;
    return feedItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.sourceName.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q)
    );
  }, [feedItems, feedQuery]);

  const filteredSaved = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sources.filter((src) => {
      if (filterSubject !== 'all' && src.subject !== filterSubject) return false;
      if (!q) return true;
      return (
        src.title.toLowerCase().includes(q) ||
        (src.tags || '').toLowerCase().includes(q) ||
        (src.url || '').toLowerCase().includes(q) ||
        src.content.toLowerCase().includes(q)
      );
    });
  }, [sources, query, filterSubject]);

  const handleOpenReader = async (item: FeedNewsItem) => {
    setReaderItem(item);
    setReaderContent('');
    setReaderNote('');
    setReaderLoading(true);
    try {
      const res = await fetch('/api/fetch-source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: item.link }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.content) {
        setReaderContent(data.content);
      } else {
        setReaderContent(
          `${item.title}\n\n${item.summary || ''}\n\nNguồn: ${item.sourceName} (${item.link})`.trim()
        );
        setReaderNote(
          data?.error ||
            'Trang gốc chuyển hướng hoặc chặn đọc tự động. Đang dùng tóm tắt bài viết — bạn có thể bấm "Mở bài gốc" để xem đầy đủ hoặc chỉnh sửa ngay tại đây.'
        );
      }
    } catch {
      setReaderContent(
        `${item.title}\n\n${item.summary || ''}\n\nNguồn: ${item.sourceName} (${item.link})`.trim()
      );
      setReaderNote('Không tải được toàn văn từ trang gốc; đang hiển thị phần tóm tắt.');
    } finally {
      setReaderLoading(false);
    }
  };

  const handleBookmarkFeedItem = (item: FeedNewsItem) => {
    const newSrc: ReferenceSource = {
      id: createId('src'),
      subject: item.subject,
      title: item.title,
      url: item.link,
      tags: item.sourceName,
      content: `${item.title}\n\n${item.summary || ''}\n\nNguồn: ${item.sourceName} (${item.link})`.trim(),
      createdAt: new Date().toISOString(),
    };
    onSaveSource(newSrc);
    setSavedNoticeId(item.id);
    setTimeout(() => setSavedNoticeId(null), 2000);
  };

  const handleUseFeedItemDirectly = (item: FeedNewsItem) => {
    const newSrc: ReferenceSource = {
      id: createId('src'),
      subject: item.subject,
      title: item.title,
      url: item.link,
      tags: item.sourceName,
      content: `${item.title}\n\n${item.summary || ''}\n\nNguồn tham khảo: ${item.sourceName}\nLink: ${item.link}`.trim(),
      createdAt: new Date().toISOString(),
    };
    onUseSourceForGenerator(newSrc);
  };

  // Manual URL Fetch & Save handlers
  const resetForm = () => {
    setEditingId(null);
    setUrlInput('');
    setTitle('');
    setTags('');
    setContent('');
    setFetchError('');
  };

  const handleFetchFromUrl = async () => {
    setFetchError('');
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setFetchError('Bạn hãy dán đường dẫn URL trang web chứa đề/bài đọc trước nhé.');
      return;
    }

    setFetchingUrl(true);
    try {
      const res = await fetch('/api/fetch-source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || `Không lấy được nội dung (HTTP ${res.status}).`);
      }
      if (!title.trim() && data?.title) {
        setTitle(data.title);
      }
      if (data?.content) {
        setContent(data.content);
      }
    } catch (err) {
      setFetchError(
        err instanceof Error ? err.message : 'Không kết nối được tới trang web này.'
      );
    } finally {
      setFetchingUrl(false);
    }
  };

  const buildCurrentSource = (): ReferenceSource | null => {
    setFetchError('');
    if (!content.trim()) {
      setFetchError('Nội dung nguồn tham khảo đang trống. Hãy lấy từ link hoặc dán nội dung vào.');
      return null;
    }
    const cleanTitle =
      title.trim() ||
      (urlInput.trim() ? urlInput.trim().replace(/^https?:\/\//, '').slice(0, 60) : 'Nguồn tham khảo mới');

    return {
      id: editingId || createId('src'),
      subject,
      title: cleanTitle,
      url: urlInput.trim() || undefined,
      tags: tags.trim() || undefined,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };
  };

  const handleSaveOnly = () => {
    const src = buildCurrentSource();
    if (!src) return;
    onSaveSource(src);
    setSaveNotice('Đã lưu vào kho nguồn tham khảo!');
    setTimeout(() => setSaveNotice(''), 2500);
    resetForm();
  };

  const handleSaveAndUse = () => {
    const src = buildCurrentSource();
    if (!src) return;
    onSaveSource(src);
    onUseSourceForGenerator(src);
  };

  const handleEdit = (src: ReferenceSource) => {
    setActiveTab('saved');
    setEditingId(src.id);
    setSubject(src.subject);
    setUrlInput(src.url || '');
    setTitle(src.title);
    setTags(src.tags || '');
    setContent(src.content);
    setFetchError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const leadItem = filteredFeed[0];
  const restItems = filteredFeed.slice(1);

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5">
      {/* Top Header & Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Newspaper className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Bảng tin &amp; Nguồn tham khảo đề thi
            </h2>
            <p className="text-xs text-slate-500">
              Cập nhật tin tức giáo dục, đề thi mới &amp; bài đọc tiếng Anh theo từng môn để dùng ngay cho AI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('feed')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
              activeTab === 'feed'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Newspaper className="h-3.5 w-3.5" />
            Bảng tin mới nhất
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('saved')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
              activeTab === 'saved'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookMarked className="h-3.5 w-3.5" />
            Đã lưu &amp; Nhập link ({sources.length})
          </button>
        </div>
      </div>

      {/* TAB 1: NEWS FEED */}
      {activeTab === 'feed' && (
        <div className="space-y-5">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFeedSubject('all')}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  feedSubject === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                Tất cả môn
              </button>
              {SUBJECT_LIST.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setFeedSubject(s.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    feedSubject === s.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {s.shortName}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={feedQuery}
                  onChange={(e) => setFeedQuery(e.target.value)}
                  placeholder="Lọc nhanh tiêu đề tin..."
                  className="w-full rounded-xl border border-slate-200 py-1.5 pr-3 pl-8 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <button
                type="button"
                disabled={feedLoading}
                onClick={() => loadFeed(feedSubject)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${feedLoading ? 'animate-spin text-indigo-600' : ''}`} />
                Làm mới
              </button>
            </div>
          </div>

          {feedError && (
            <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span>{feedError}</span>
            </div>
          )}

          {feedLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="h-4 w-24 rounded bg-slate-200" />
                  <div className="mt-3 h-5 w-full rounded bg-slate-200" />
                  <div className="mt-2 h-5 w-3/4 rounded bg-slate-200" />
                  <div className="mt-4 h-3 w-full rounded bg-slate-100" />
                  <div className="mt-2 h-3 w-2/3 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : filteredFeed.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-14 text-center">
              <Newspaper className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-2 text-sm font-semibold text-slate-600">
                Chưa có bài viết nào phù hợp bộ lọc hiện tại.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFeedQuery('');
                  loadFeed(feedSubject);
                }}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Tải lại bảng tin
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Featured Lead News Card */}
              {leadItem && (
                <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-white via-white to-indigo-50/50 p-5 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
                        Tiêu điểm mới
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          getSubjectDefinition(leadItem.subject).badgeClass
                        }`}
                      >
                        {getSubjectDefinition(leadItem.subject).shortName}
                      </span>
                      <span className="text-xs font-semibold text-slate-600">
                        {leadItem.sourceName}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      {formatRelativeTime(leadItem.pubDate)}
                    </span>
                  </div>

                  <h3
                    onClick={() => handleOpenReader(leadItem)}
                    className="mt-3 cursor-pointer text-lg font-extrabold text-slate-900 hover:text-indigo-700"
                  >
                    {leadItem.title}
                  </h3>

                  {leadItem.summary && (
                    <p className="mt-1.5 text-sm text-slate-600 line-clamp-2">
                      {leadItem.summary}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenReader(leadItem)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Đọc &amp; Tạo đề từ bài này
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBookmarkFeedItem(leadItem)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      {savedNoticeId === leadItem.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" /> Đã lưu
                        </>
                      ) : (
                        <>
                          <Bookmark className="h-3.5 w-3.5" /> Lưu lại
                        </>
                      )}
                    </button>
                    <a
                      href={leadItem.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Mở bài gốc
                    </a>
                  </div>
                </div>
              )}

              {/* News Grid */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {restItems.map((item) => {
                  const sDef = getSubjectDefinition(item.subject);
                  const isSaved = savedNoticeId === item.id;
                  return (
                    <article
                      key={item.id}
                      className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-sm"
                    >
                      <div>
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${sDef.badgeClass}`}
                          >
                            {sDef.shortName}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                            <Clock className="h-3 w-3" />
                            {formatRelativeTime(item.pubDate)}
                          </span>
                        </div>

                        <h4
                          onClick={() => handleOpenReader(item)}
                          className="cursor-pointer text-sm font-bold leading-snug text-slate-900 line-clamp-3 hover:text-indigo-700"
                        >
                          {item.title}
                        </h4>

                        <div className="mt-2 text-[11px] font-semibold text-indigo-600">
                          {item.sourceName}
                        </div>

                        {item.summary && (
                          <p className="mt-1.5 text-xs leading-relaxed text-slate-500 line-clamp-2">
                            {item.summary}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-1.5 border-t border-slate-100 pt-3">
                        <button
                          type="button"
                          onClick={() => handleUseFeedItemDirectly(item)}
                          className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100"
                        >
                          <Sparkles className="h-3 w-3" /> Dùng tạo đề
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenReader(item)}
                            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                          >
                            Đọc nhanh
                          </button>
                          <button
                            type="button"
                            title="Lưu vào kho nguồn"
                            onClick={() => handleBookmarkFeedItem(item)}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                          >
                            {isSaved ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Bookmark className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noreferrer"
                            title="Mở bài gốc"
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SAVED & MANUAL URL CRAWLER */}
      {activeTab === 'saved' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {editingId
                      ? 'Chỉnh sửa nguồn tham khảo'
                      : 'Nhập link riêng hoặc dán nội dung đề tham khảo'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Dán link trang web mở để trích xuất chữ tự động, hoặc copy dán trực tiếp đề mẫu vào để lưu
                  </p>
                </div>
              </div>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy sửa
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Link2 className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Dán link bài viết / đề tham khảo (https://...)"
                  className="w-full rounded-xl border border-slate-300 py-2.5 pr-3.5 pl-10 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                />
              </div>
              <button
                type="button"
                disabled={fetchingUrl}
                onClick={handleFetchFromUrl}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-600 disabled:opacity-60"
              >
                {fetchingUrl ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Đang lấy nội dung...
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4" /> Lấy nội dung từ link
                  </>
                )}
              </button>
            </div>

            {fetchError && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <span>{fetchError}</span>
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Môn học</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as SubjectId)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  {SUBJECT_LIST.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Tên nguồn / Tiêu đề đề tham khảo
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Đề thi thử vào 10 Tiếng Anh Sở HN..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Nhãn phân loại (tùy chọn)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="VD: Lớp 9, Đọc hiểu"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Nội dung trích xuất (có thể chỉnh sửa hoặc copy dán trực tiếp vào đây) *
                </label>
                <span className="text-[11px] text-slate-400">
                  {content.length.toLocaleString()} ký tự
                </span>
              </div>
              <textarea
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Nội dung bài viết / câu hỏi sau khi lấy từ link sẽ hiện ở đây..."
                className="w-full rounded-xl border border-slate-300 p-3 text-xs leading-relaxed focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-emerald-700 font-semibold">
                {saveNotice && (
                  <span className="inline-flex items-center gap-1">
                    <Check className="h-4 w-4" /> {saveNotice}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSaveOnly}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  <Plus className="h-4 w-4" />
                  {editingId ? 'Cập nhật nguồn' : 'Lưu vào kho nguồn'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndUse}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
                >
                  <Sparkles className="h-4 w-4" />
                  Lưu &amp; Dùng soạn đề ngay
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm nguồn đã lưu..."
                  className="w-full rounded-xl border border-slate-200 py-2 pr-3 pl-9 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value as SubjectId | 'all')}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
              >
                <option value="all">Tất cả môn học</option>
                {SUBJECT_LIST.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {filteredSaved.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
                <BookMarked className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-2 text-sm font-semibold text-slate-600">
                  Chưa có nguồn tham khảo nào được lưu.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filteredSaved.map((src) => {
                  const sDef = getSubjectDefinition(src.subject);
                  return (
                    <div
                      key={src.id}
                      className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-indigo-300"
                    >
                      <div>
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${sDef.badgeClass}`}
                            >
                              {sDef.shortName}
                            </span>
                            {src.tags && (
                              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                                {src.tags}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {src.content.length.toLocaleString()} ký tự
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 line-clamp-2">
                          {src.title}
                        </h3>

                        {src.url && (
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-xs font-medium text-indigo-600 hover:underline"
                          >
                            <ExternalLink className="h-3 w-3 shrink-0" />
                            <span className="truncate">{src.url}</span>
                          </a>
                        )}

                        <p className="mt-2.5 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600 line-clamp-4 whitespace-pre-line">
                          {src.content}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                        <span className="text-[11px] text-slate-400">
                          {new Date(src.createdAt).toLocaleDateString('vi-VN')}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onUseSourceForGenerator(src)}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
                          >
                            <Sparkles className="h-3.5 w-3.5" /> Dùng để tạo đề
                          </button>
                          <button
                            type="button"
                            title="Sửa nguồn"
                            onClick={() => handleEdit(src)}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Xóa nguồn"
                            onClick={() => onDeleteSource(src.id)}
                            className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Reader Modal */}
      {readerItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="flex max-h-[88vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      getSubjectDefinition(readerItem.subject).badgeClass
                    }`}
                  >
                    {getSubjectDefinition(readerItem.subject).shortName}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {readerItem.sourceName}
                  </span>
                </div>
                <h3 className="mt-1.5 text-base font-bold text-slate-900">
                  {readerItem.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReaderItem(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {readerLoading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm font-medium text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                  Đang tải nội dung bài viết...
                </div>
              ) : (
                <>
                  {readerNote && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
                      {readerNote}
                    </div>
                  )}
                  <textarea
                    rows={12}
                    value={readerContent}
                    onChange={(e) => setReaderContent(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs leading-relaxed text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none"
                  />
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-3.5">
              <a
                href={readerItem.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Mở trang gốc
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={readerLoading}
                  onClick={() => {
                    onSaveSource({
                      id: createId('src'),
                      subject: readerItem.subject,
                      title: readerItem.title,
                      url: readerItem.link,
                      tags: readerItem.sourceName,
                      content: readerContent,
                      createdAt: new Date().toISOString(),
                    });
                    setReaderItem(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  <Bookmark className="h-3.5 w-3.5" /> Lưu vào kho
                </button>
                <button
                  type="button"
                  disabled={readerLoading || !readerContent.trim()}
                  onClick={() => {
                    const src: ReferenceSource = {
                      id: createId('src'),
                      subject: readerItem.subject,
                      title: readerItem.title,
                      url: readerItem.link,
                      tags: readerItem.sourceName,
                      content: readerContent,
                      createdAt: new Date().toISOString(),
                    };
                    setReaderItem(null);
                    onUseSourceForGenerator(src);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Dùng nội dung này tạo đề
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
