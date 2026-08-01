import React, { useState, useMemo } from "react";
import { EpubChapter } from "../types";
import {
  List,
  ChevronUp,
  ChevronDown,
  Wand2,
  Check,
  Edit2,
  HelpCircle,
  Hash,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Settings2,
  X,
  CheckCircle2,
  Trash2,
  PlusCircle,
  Plus,
} from "lucide-react";
import {
  fixDuplicateChapterNumbers,
  renumberAllChapters,
  parseChapterTitle,
  syncAllHeadingsWithToc,
  findTocChapterIndex,
} from "../lib/tocUtils";

interface TocManagerProps {
  chapters: EpubChapter[];
  onUpdateChapterTitle: (id: string, newTitle: string) => void;
  onReorderChapter: (id: string, direction: "up" | "down") => void;
  onAutoGenerateToc: () => void;
  onUpdateChapters: (updatedChapters: EpubChapter[]) => void;
  onDeleteChapter?: (id: string) => void;
  onAddChapterAt?: (targetIndex: number, position?: "before" | "after") => void;
}

export const TocManager: React.FC<TocManagerProps> = ({
  chapters,
  onUpdateChapterTitle,
  onReorderChapter,
  onAutoGenerateToc,
  onUpdateChapters,
  onDeleteChapter,
  onAddChapterAt,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [chapterToDelete, setChapterToDelete] = useState<EpubChapter | null>(null);

  const handleDeleteChapterClick = (ch: EpubChapter) => {
    if (chapters.length <= 1) {
      setStatusMessage("Sách phải có ít nhất 1 chương, không thể xóa chương duy nhất còn lại!");
      setTimeout(() => setStatusMessage(null), 4000);
      return;
    }
    setChapterToDelete(ch);
  };

  const confirmDeleteChapter = () => {
    if (chapterToDelete && onDeleteChapter) {
      const deletedTitle = chapterToDelete.title;
      onDeleteChapter(chapterToDelete.id);
      setChapterToDelete(null);
      setStatusMessage(`Đã xóa thành công chương "${deletedTitle}".`);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // Renumber Modal State
  const [showRenumberModal, setShowRenumberModal] = useState(false);
  const [prefixOption, setPrefixOption] = useState("Chương ");
  const [startNumOption, setStartNumOption] = useState(1);
  const [padZerosOption, setPadZerosOption] = useState(false);
  const [keepSubtitlesOption, setKeepSubtitlesOption] = useState(true);
  const [updateXhtmlOption, setUpdateXhtmlOption] = useState(true);
  const [startAfterTocOption, setStartAfterTocOption] = useState(true);

  // Check for duplicate chapter numbers or spaced numbers in real-time
  const duplicateAnalysis = useMemo(() => {
    const { updatedChapters, changesCount, duplicateDetails, spacedCount } =
      fixDuplicateChapterNumbers(chapters, false, true);
    return { updatedChapters, changesCount, duplicateDetails, spacedCount };
  }, [chapters]);

  const tocIndex = useMemo(() => findTocChapterIndex(chapters), [chapters]);

  const startEdit = (ch: EpubChapter) => {
    setEditingId(ch.id);
    setEditingTitle(ch.title);
  };

  const saveEdit = (id: string) => {
    if (editingTitle.trim()) {
      onUpdateChapterTitle(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  // Handler: Sync all <h4> headings with TOC titles
  const handleSyncAllHeadings = () => {
    const { updatedChapters, updatedCount } = syncAllHeadingsWithToc(chapters);
    onUpdateChapters(updatedChapters);
    if (updatedCount === 0) {
      setStatusMessage("Tất cả thẻ <h4> trong nội dung chương đã trùng khớp với mục lục!");
    } else {
      setStatusMessage(`Đã đồng bộ thành công nội dung thẻ <h4> cho ${updatedCount} chương trong sách!`);
    }
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // Handler 1: Fix Duplicates and Spaced Numbers (Automatic space removal +1 increment)
  const handleFixDuplicates = () => {
    const { updatedChapters, changesCount, spacedCount } = fixDuplicateChapterNumbers(
      chapters,
      true,
      true
    );

    if (changesCount === 0) {
      setStatusMessage("Không phát hiện số chương nào bị lỗi khoảng trắng hoặc trùng số thứ tự!");
    } else {
      onUpdateChapters(updatedChapters);
      let detailMsg = "Đã xử lý thành công! ";
      if (spacedCount > 0) {
        detailMsg += `Đã gộp khoảng trắng cho ${spacedCount} số chương (ví dụ: 5 0 ➔ 50). `;
      }
      if (changesCount - spacedCount > 0) {
        detailMsg += `Đã tự động điều chỉnh và đánh lại số kề sau (+1) cho ${changesCount - spacedCount} chương trùng hoặc nhảy số (chênh lệch ≥ 2).`;
      }
      setStatusMessage(detailMsg);
    }
    setTimeout(() => setStatusMessage(null), 6000);
  };

  // Handler 2: Full Renumbering
  const handleExecuteRenumberAll = () => {
    const { updatedChapters, changesCount } = renumberAllChapters(chapters, {
      prefix: prefixOption,
      startNum: startNumOption,
      padZeros: padZerosOption,
      keepSubtitles: keepSubtitlesOption,
      updateXhtml: updateXhtmlOption,
      startAfterToc: startAfterTocOption,
    });

    onUpdateChapters(updatedChapters);
    setShowRenumberModal(false);
    setStatusMessage(
      `Đã đánh số lại thành công toàn bộ ${changesCount} chương mục lục!`
    );
    setTimeout(() => setStatusMessage(null), 5000);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <List className="w-5 h-5 text-blue-400" />
            <span>Quản Lý Mục Lục (Table of Contents)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Mục lục được ghi nhận vào tệp <code className="text-blue-300">toc.ncx</code> và <code className="text-blue-300">nav.xhtml</code> để máy đọc sách hiển thị danh sách điều hướng.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onAddChapterAt && (
            <button
              onClick={() => {
                onAddChapterAt(
                  chapters.length > 0 ? chapters.length - 1 : 0,
                  "after"
                );
                setStatusMessage(
                  "Đã thêm chương mới vào cuối mục lục (sao chép cấu trúc XHTML chương trước và làm sạch thẻ <p>)!"
                );
                setTimeout(() => setStatusMessage(null), 5000);
              }}
              className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow transition-all"
              title="Thêm chương mới vào cuối mục lục (copy cấu trúc XHTML và loại bỏ các thẻ <p>)"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Thêm Chương</span>
            </button>
          )}

          <button
            onClick={handleSyncAllHeadings}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold rounded-xl border border-slate-700 shadow transition-all"
            title="Đồng bộ tất cả thẻ <h4>/<h1> trong mã XHTML chương trùng khớp với tên mục lục"
          >
            <RefreshCw className="w-3.5 h-3.5 text-teal-400" />
            <span>Đồng Bộ Thẻ H4</span>
          </button>

          <button
            onClick={onAutoGenerateToc}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 shadow transition-all"
            title="Tự động quét tiêu đề từ thẻ <h1>/<h4> trong mã XHTML"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-300" />
            <span>Trích Xuất Tiêu Đề</span>
          </button>

          <button
            onClick={() => setShowRenumberModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow transition-all"
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Đánh Số Lại Mọi Chương</span>
          </button>
        </div>
      </div>

      {/* Duplicate / Spaced Warning Banner */}
      {duplicateAnalysis.changesCount > 0 && (
        <div className="p-4 bg-amber-950/60 border border-amber-800/80 rounded-2xl text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-300 text-xs">
                Phát hiện {duplicateAnalysis.changesCount} số chương cần sửa số thứ tự!
              </h4>
              <p className="text-[11px] text-amber-200/80 mt-0.5">
                Hệ thống phát hiện {duplicateAnalysis.spacedCount > 0 ? `số chương có khoảng trống (ví dụ: 5 0 ➔ 50) ` : ""}
                {duplicateAnalysis.changesCount - duplicateAnalysis.spacedCount > 0 ? `và ${duplicateAnalysis.changesCount - duplicateAnalysis.spacedCount} chương bị trùng số hoặc nhảy số (chênh lệch ≥ 2).` : "."}
                {" "}Bấm nút bên phải để tự động đánh lại số kề sau (+1) của chương trước.
              </p>
            </div>
          </div>

          <button
            onClick={handleFixDuplicates}
            className="shrink-0 flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sửa Số &amp; Trùng Lập (+1)</span>
          </button>
        </div>
      )}

      {/* Status Notification */}
      {statusMessage && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{statusMessage}</span>
        </div>
      )}

      {/* Chapters TOC List Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-400">
          <div className="flex items-center space-x-3">
            <span className="w-8 text-center">Thứ tự</span>
            <span>Tên hiển thị trong Mục Lục</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleFixDuplicates}
              className="text-[11px] text-blue-400 hover:text-blue-300 font-normal flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Sửa trùng số</span>
            </button>
            <span>Thao tác</span>
          </div>
        </div>

        <div className="divide-y divide-slate-800/60">
          {chapters.map((ch, idx) => {
            const isEditing = ch.id === editingId;
            const parsed = parseChapterTitle(ch.title);

            return (
              <div
                key={ch.id}
                className="p-4 flex items-center justify-between hover:bg-slate-800/40 transition-all text-xs"
              >
                <div className="flex items-center space-x-3 flex-1 mr-4">
                  <span className="w-8 text-center font-mono font-bold text-blue-400 bg-slate-950 py-1 rounded">
                    {idx + 1}
                  </span>

                  {isEditing ? (
                    <div className="flex items-center space-x-2 flex-1">
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(ch.id);
                        }}
                        autoFocus
                        className="flex-1 px-3 py-1.5 bg-slate-950 border border-blue-500 rounded-lg text-slate-100 text-xs focus:outline-none"
                      />
                      <button
                        onClick={() => saveEdit(ch.id)}
                        className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200 text-sm">
                          {ch.title}
                        </span>
                        {parsed.num !== null && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-400 font-mono rounded">
                            Số: {parsed.num}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {ch.href}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {!isEditing && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onReorderChapter(ch.id, "up")}
                      disabled={idx === 0}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-lg text-slate-300"
                      title="Di chuyển lên"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onReorderChapter(ch.id, "down")}
                      disabled={idx === chapters.length - 1}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-lg text-slate-300"
                      title="Di chuyển xuống"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => startEdit(ch)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                      title="Đổi tên hiển thị"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {onAddChapterAt && (
                      <button
                        onClick={() => {
                          onAddChapterAt(idx, "after");
                          setStatusMessage(
                            `Đã chèn chương mới phía sau "${ch.title}" (đã sao chép khung XHTML và loại bỏ các thẻ <p>)`
                          );
                          setTimeout(() => setStatusMessage(null), 5000);
                        }}
                        className="p-1.5 bg-slate-800 hover:bg-emerald-900/80 hover:text-emerald-300 text-emerald-400 rounded-lg transition-colors flex items-center space-x-1"
                        title="Thêm chương mới phía sau chương này (sao chép mẫu XHTML và xóa tất cả thẻ <p>)"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-semibold hidden sm:inline">+ Thêm sau</span>
                      </button>
                    )}

                    {onDeleteChapter && (
                      <button
                        onClick={() => handleDeleteChapterClick(ch)}
                        className="p-1.5 bg-slate-800 hover:bg-rose-900/60 hover:text-rose-400 text-slate-400 rounded-lg transition-colors"
                        title="Xóa chương này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Info footer */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-xs text-slate-400 flex items-start space-x-2">
        <HelpCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <p>
          Khi xuất file EPUB, hệ thống sẽ tự động cập nhật cả định dạng{" "}
          <strong>EPUB 2 (toc.ncx)</strong> và <strong>EPUB 3 (nav.xhtml)</strong>{" "}
          dựa trên danh sách mục lục trên để tương thích với tất cả các thiết bị đọc sách (Kindle, Kobo, Apple Books, Google Play Books).
        </p>
      </div>

      {/* Full Renumbering Modal */}
      {showRenumberModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Settings2 className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">
                  Đánh Số Lại Toàn Bộ Các Chương
                </h3>
              </div>
              <button
                onClick={() => setShowRenumberModal(false)}
                className="p-1 hover:bg-slate-800 text-slate-400 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <div>
                <label className="block font-semibold text-slate-200 mb-1">
                  Tiền tố tên chương (Prefix):
                </label>
                <input
                  type="text"
                  value={prefixOption}
                  onChange={(e) => setPrefixOption(e.target.value)}
                  placeholder="Ví dụ: Chương , Chapter , Hồi "
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-200 mb-1">
                    Bắt đầu từ số:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={startNumOption}
                    onChange={(e) => setStartNumOption(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={padZerosOption}
                      onChange={(e) => setPadZerosOption(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span>Số 2 chữ số (01, 02... 09)</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={startAfterTocOption}
                    onChange={(e) => setStartAfterTocOption(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span className="text-emerald-400 font-semibold">
                    Bắt đầu đánh số từ chương sau Mục Lục (Bìa / Lời mở đầu / Mục lục giữ nguyên)
                  </span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={keepSubtitlesOption}
                    onChange={(e) => setKeepSubtitlesOption(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Giữ lại tiêu đề phụ / tên chương riêng nếu có</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={updateXhtmlOption}
                    onChange={(e) => setUpdateXhtmlOption(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span className="text-amber-300 font-semibold">
                    Đồng bộ thẻ tiêu đề &lt;h4&gt;/&lt;h1&gt; trong mã nội dung XHTML với Mục lục
                  </span>
                </label>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1">
                <span className="text-indigo-300 font-bold">Xem trước quy tắc đánh số:</span>
                {startAfterTocOption && tocIndex !== -1 && (
                  <div className="text-emerald-400 font-sans text-[11px] font-medium mb-1">
                    ✓ Đã tìm thấy Mục lục tại vị trí #{tocIndex + 1} ({chapters[tocIndex]?.title}). Số {startNumOption} sẽ bắt đầu từ chương #{tocIndex + 2} ({chapters[tocIndex + 1]?.title || "Chương tiếp theo"}).
                  </div>
                )}
                <div>
                  1. {prefixOption}{padZerosOption ? "01" : "1"}: {keepSubtitlesOption ? "Tên chương cũ..." : ""}
                </div>
                <div>
                  2. {prefixOption}{padZerosOption ? "02" : "2"}: {keepSubtitlesOption ? "Tên chương cũ..." : ""}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowRenumberModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Hủy
              </button>

              <button
                onClick={handleExecuteRenumberAll}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-900/30"
              >
                Áp Dụng Đánh Số Lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {chapterToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="p-2.5 bg-rose-950/80 border border-rose-800/80 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Xác Nhận Xóa Chương</h3>
                <p className="text-xs text-slate-400">Hành động này không thể hoàn tác</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              Bạn có chắc chắn muốn xóa chương <strong className="text-white">"{chapterToDelete.title}"</strong> không? Chương này sẽ bị xóa khỏi danh sách mục lục và nội dung tệp tương ứng sẽ bị xóa khỏi sách.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setChapterToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all"
              >
                Hủy
              </button>
              <button
                onClick={confirmDeleteChapter}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-900/40 transition-all flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa Chương Này</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
