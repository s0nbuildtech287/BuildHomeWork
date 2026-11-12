import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Save, UserCheck, X } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  settings: AppSettings;
  onSave: (next: AppSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSave,
  onClose,
}) => {
  const [form, setForm] = useState<AppSettings>(settings);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Thông tin giáo viên</h2>
              <p className="text-xs text-slate-500">Tự động điền sẵn lên đầu mỗi phiếu bài tập</p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Tên giáo viên (in trên đề)
              </label>
              <input
                type="text"
                value={form.teacherName}
                onChange={(e) => setForm({ ...form, teacherName: e.target.value })}
                placeholder="VD: Cô Lan Anh"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Tên lớp / Trung tâm
              </label>
              <input
                type="text"
                value={form.centerName}
                onChange={(e) => setForm({ ...form, centerName: e.target.value })}
                placeholder="VD: English Corner"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-slate-800">
                  Header &amp; Footer khi xuất Word / PDF
                </div>
                <p className="text-[11px] text-slate-500">
                  In thanh tiêu đề trên &amp; dưới mọi trang khi tải file Word (.docx)
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-indigo-700">
                <input
                  type="checkbox"
                  checked={form.enableBrandHeaderFooter !== false}
                  onChange={(e) =>
                    setForm({ ...form, enableBrandHeaderFooter: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Bật
              </label>
            </div>

            {form.enableBrandHeaderFooter !== false && (
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-600">
                      Header trái
                    </label>
                    <input
                      type="text"
                      value={form.headerLeft ?? ''}
                      onChange={(e) => setForm({ ...form, headerLeft: e.target.value })}
                      placeholder="MS. HUONG - 0327161636"
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-600">
                      Header phải
                    </label>
                    <input
                      type="text"
                      value={form.headerRight ?? ''}
                      onChange={(e) => setForm({ ...form, headerRight: e.target.value })}
                      placeholder="T-CLASS EDUCATION - 0978386622"
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    Footer trái (bên phải tự động đánh số Page | 1, 2, 3...)
                  </label>
                  <input
                    type="text"
                    value={form.footerLeft ?? ''}
                    onChange={(e) => setForm({ ...form, footerLeft: e.target.value })}
                    placeholder="T-CLASS EDUCATION - Số nhà 9,12,14-16 Ngõ 71 Khu Dịch vụ 3, Văn Phú, Hà Đông, HN"
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-2">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              Cài đặt nâng cao (chỉ dùng khi cần đổi kết nối)
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-3 rounded-xl bg-slate-50 p-3.5">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Mã kết nối riêng (để trống nếu đã cài sẵn trên máy)
                  </label>
                  <input
                    type="password"
                    value={form.geminiApiKey}
                    onChange={(e) => setForm({ ...form, geminiApiKey: e.target.value })}
                    placeholder="Không cần nhập nếu hệ thống đã bật sẵn"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Phiên bản trợ lý
                  </label>
                  <select
                    value={form.geminiModel}
                    onChange={(e) => setForm({ ...form, geminiModel: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="gemini-3.8-flash">Gemini 3.8 Flash (Mặc định)</option>
                    <option value="gemini-flash-latest">Gemini Flash Latest</option>
                    <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Đóng
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Save className="h-4 w-4" /> Lưu thông tin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
