import React, { useState, useMemo } from "react";
import { EpubChapter } from "../types";
import {
  Search,
  Replace,
  RefreshCw,
  CheckCircle2,
  FileText,
  Code2,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Sparkles,
  Zap,
} from "lucide-react";

interface SearchReplaceViewProps {
  chapters: EpubChapter[];
  onReplaceInChapter: (chapterId: string, newContent: string) => void;
  onReplaceSelected: (
    search: string,
    replace: string,
    matchCase: boolean,
    useRegex: boolean,
    selectedChapterIds: string[]
  ) => number;
}

interface MatchSnippet {
  index: number;
  snippetBefore: string;
  matchText: string;
  snippetAfter: string;
}

export const SearchReplaceView: React.FC<SearchReplaceViewProps> = ({
  chapters,
  onReplaceInChapter,
  onReplaceSelected,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [replaceQuery, setReplaceQuery] = useState("");
  const [matchCase, setMatchCase] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [regexError, setRegexError] = useState<string | null>(null);

  // Selected chapters for batch replace
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>(
    chapters.map((ch) => ch.id)
  );

  // Expanded chapter preview state
  const [expandedChapterIds, setExpandedChapterIds] = useState<Record<string, boolean>>({});

  // Sync selected chapters if chapters change (e.g. added/deleted)
  React.useEffect(() => {
    setSelectedChapterIds((prev) => {
      const valid = new Set(chapters.map((ch) => ch.id));
      const filtered = prev.filter((id) => valid.has(id));
      // If none selected previously, select all
      return filtered.length > 0 ? filtered : chapters.map((ch) => ch.id);
    });
  }, [chapters]);

  // Compute search matches & snippets per chapter
  const searchAnalysis = useMemo(() => {
    setRegexError(null);
    if (!searchQuery) {
      return {
        results: chapters.map((ch) => ({ chapter: ch, count: 0, snippets: [] })),
        totalMatches: 0,
        chaptersWithMatchesCount: 0,
      };
    }

    let regex: RegExp;
    try {
      const flags = matchCase ? "g" : "gi";
      if (useRegex) {
        regex = new RegExp(searchQuery, flags);
      } else {
        const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        regex = new RegExp(escaped, flags);
      }
    } catch (err: any) {
      setRegexError(err.message || "Biểu thức chính quy (Regex) không hợp lệ");
      return {
        results: chapters.map((ch) => ({ chapter: ch, count: 0, snippets: [] })),
        totalMatches: 0,
        chaptersWithMatchesCount: 0,
      };
    }

    let total = 0;
    let chaptersWithMatches = 0;

    const results = chapters.map((ch) => {
      const content = ch.content;
      const matches = Array.from(content.matchAll(regex)) as RegExpExecArray[];
      const count = matches.length;

      if (count > 0) {
        total += count;
        chaptersWithMatches++;
      }

      // Generate snippets (max 5 snippets preview per chapter)
      const snippets: MatchSnippet[] = matches.slice(0, 5).map((m) => {
        const matchText = m[0];
        const index = m.index ?? 0;
        const start = Math.max(0, index - 35);
        const end = Math.min(content.length, index + matchText.length + 35);

        const snippetBefore = content.substring(start, index);
        const snippetAfter = content.substring(index + matchText.length, end);

        return {
          index,
          snippetBefore: (start > 0 ? "..." : "") + snippetBefore,
          matchText,
          snippetAfter: snippetAfter + (end < content.length ? "..." : ""),
        };
      });

      return { chapter: ch, count, snippets };
    });

    return {
      results,
      totalMatches: total,
      chaptersWithMatchesCount: chaptersWithMatches,
    };
  }, [searchQuery, matchCase, useRegex, chapters]);

  // Handle Chapter Selection Toggles
  const handleToggleSelectAll = () => {
    if (selectedChapterIds.length === chapters.length) {
      setSelectedChapterIds([]);
    } else {
      setSelectedChapterIds(chapters.map((ch) => ch.id));
    }
  };

  const handleSelectOnlyMatched = () => {
    const matchedIds = searchAnalysis.results
      .filter((r) => r.count > 0)
      .map((r) => r.chapter.id);
    setSelectedChapterIds(matchedIds);
  };

  const handleToggleChapter = (id: string) => {
    setSelectedChapterIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleExpand = (id: string) => {
    setExpandedChapterIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Execute Replace on Selected Chapters
  const handleExecuteReplaceSelected = () => {
    if (!searchQuery || selectedChapterIds.length === 0) return;

    const count = onReplaceSelected(
      searchQuery,
      replaceQuery,
      matchCase,
      useRegex,
      selectedChapterIds
    );

    setStatusMessage(
      `Đã thay thế thành công ${count} vị trí XHTML trong ${selectedChapterIds.length} chương được chọn!`
    );
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // Execute Replace for a Single Chapter
  const handleReplaceSingleChapter = (chapter: EpubChapter) => {
    if (!searchQuery) return;

    try {
      const flags = matchCase ? "g" : "gi";
      let regex: RegExp;
      if (useRegex) {
        regex = new RegExp(searchQuery, flags);
      } else {
        const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        regex = new RegExp(escaped, flags);
      }

      const matches = chapter.content.match(regex);
      if (!matches) return;

      const newContent = chapter.content.replace(regex, replaceQuery);
      onReplaceInChapter(chapter.id, newContent);

      setStatusMessage(
        `Đã thay thế ${matches.length} vị trí trong chương "${chapter.title}"!`
      );
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (e: any) {
      alert("Lỗi khi thay thế: " + e.message);
    }
  };

  // Regex Helper Presets
  const applyPreset = (search: string, replace: string, isRegex = true) => {
    setSearchQuery(search);
    setReplaceQuery(replace);
    setUseRegex(isRegex);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Search & Replace Main Box */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Tìm Kiếm & Thay Thế Mã XHTML</span>
                <span className="px-2 py-0.5 bg-blue-950 border border-blue-700/60 text-blue-300 text-[10px] font-mono rounded-md">
                  Mã Nguồn XHTML
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Áp dụng tìm kiếm trên mã thẻ XML, thuộc tính HTML, và toàn bộ văn bản của sách.
              </p>
            </div>
          </div>
        </div>

        {/* Input Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Chuỗi / Mã XHTML cần tìm:</span>
              {useRegex && (
                <span className="text-[10px] text-amber-400 font-mono">Chế độ Regex (Biểu thức)</span>
              )}
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  useRegex
                    ? "Nhập Regex (ví dụ: <p class=\".*?\"> hoặc <i>(.*?)</i>)"
                    : "Nhập đoạn văn bản hoặc mã XHTML..."
                }
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 focus:border-blue-500 text-slate-100 rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Thay thế bằng:
            </label>
            <div className="relative">
              <Replace className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                placeholder={
                  useRegex ? "Nhập từ/thẻ thay thế (ví dụ: <em>$1</em>)" : "Nhập nội dung thay thế..."
                }
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 focus:border-blue-500 text-slate-100 rounded-xl text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Regex error banner */}
        {regexError && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Lỗi Biểu thức Regex: {regexError}</span>
          </div>
        )}

        {/* Options & Presets */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <label className="flex items-center space-x-2 cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={matchCase}
                onChange={(e) => setMatchCase(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span>Phân biệt hoa / thường (Match Case)</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={useRegex}
                onChange={(e) => setUseRegex(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span className="font-semibold text-amber-300">Regular Expression (Regex)</span>
            </label>
          </div>

          {/* Preset Buttons for Quick XHTML Cleanup */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="hidden sm:inline">Gợi ý XHTML:</span>
            <button
              onClick={() => applyPreset("<i>(.*?)</i>", "<em>$1</em>", true)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 font-mono"
              title="Đổi thẻ <i> thành <em>"
            >
              &lt;i&gt;&rarr;&lt;em&gt;
            </button>
            <button
              onClick={() => applyPreset("<b>(.*?)</b>", "<strong>$1</strong>", true)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 font-mono"
              title="Đổi thẻ <b> thành <strong>"
            >
              &lt;b&gt;&rarr;&lt;strong&gt;
            </button>
            <button
              onClick={() => applyPreset("style=\".*?\"", "", true)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 font-mono"
              title="Xóa thuộc tính style inline"
            >
              Xóa inline style
            </button>
          </div>
        </div>

        {/* Action Button & Selected Info */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-300 flex items-center gap-2">
            <span className="font-medium">
              Đã chọn <strong className="text-blue-400">{selectedChapterIds.length}</strong> / {chapters.length} chương.
            </span>
            {searchQuery && (
              <span className="text-slate-400">
                (Tìm thấy <strong className="text-amber-300">{searchAnalysis.totalMatches}</strong> kết quả)
              </span>
            )}
          </div>

          <button
            onClick={handleExecuteReplaceSelected}
            disabled={!searchQuery || searchAnalysis.totalMatches === 0 || selectedChapterIds.length === 0 || !!regexError}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-900/30 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>
              Thay Thế Trong {selectedChapterIds.length} Chương Đã Chọn ({searchAnalysis.totalMatches} vị trí)
            </span>
          </button>
        </div>

        {statusMessage && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center space-x-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Chapter Selection & Preview Section */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Danh Sách Chương Áp Dụng Thay Đổi ({chapters.length})</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Đánh dấu chọn các chương muốn tìm và thay thế. Bấm vào tên chương để xem đoạn mã XHTML phù hợp.
            </p>
          </div>

          {/* Selection Helper Toolbar */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={handleToggleSelectAll}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 text-xs transition-colors"
            >
              {selectedChapterIds.length === chapters.length ? (
                <>
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                  <span>Bỏ chọn tất cả</span>
                </>
              ) : (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                  <span>Chọn tất cả ({chapters.length})</span>
                </>
              )}
            </button>

            {searchQuery && searchAnalysis.chaptersWithMatchesCount > 0 && (
              <button
                onClick={handleSelectOnlyMatched}
                className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border border-indigo-800 rounded-lg text-xs transition-colors"
              >
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
                <span>Chỉ chọn chương có kết quả ({searchAnalysis.chaptersWithMatchesCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Search status summary when empty */}
        {!searchQuery ? (
          <div className="text-center py-8 bg-slate-950/40 rounded-xl border border-slate-800/50 space-y-2">
            <Search className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">
              Nhập từ khóa hoặc mã XHTML vào ô tìm kiếm ở trên để quét toàn bộ các chương.
            </p>
          </div>
        ) : searchAnalysis.totalMatches === 0 ? (
          <div className="text-center py-8 bg-slate-950/40 rounded-xl border border-slate-800/50 space-y-2">
            <AlertCircle className="w-8 h-8 text-amber-500/70 mx-auto" />
            <p className="text-xs text-amber-300 font-medium">
              Không tìm thấy kết quả XHTML nào trùng khớp với "{searchQuery}"
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {searchAnalysis.results.map(({ chapter, count, snippets }) => {
              const isSelected = selectedChapterIds.includes(chapter.id);
              const isExpanded = !!expandedChapterIds[chapter.id];

              return (
                <div
                  key={chapter.id}
                  className={`rounded-xl border transition-all ${
                    isSelected
                      ? "bg-slate-950 border-blue-900/60"
                      : "bg-slate-950/50 border-slate-800/60 opacity-75"
                  }`}
                >
                  {/* Chapter Header row */}
                  <div className="p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleChapter(chapter.id)}
                        className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer shrink-0"
                      />

                      {/* Chapter Title & Expand button */}
                      <button
                        onClick={() => handleToggleExpand(chapter.id)}
                        className="flex items-center space-x-2 text-left min-w-0 group hover:text-blue-300 transition-colors"
                      >
                        {count > 0 ? (
                          isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-blue-400 shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                          )
                        ) : (
                          <div className="w-4 h-4" />
                        )}
                        <span className="font-semibold text-xs text-slate-200 truncate">
                          {chapter.title}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono shrink-0">
                          ({chapter.href})
                        </span>
                      </button>
                    </div>

                    {/* Match count badge & single replace button */}
                    <div className="flex items-center space-x-3 shrink-0">
                      {count > 0 ? (
                        <>
                          <span className="px-2.5 py-1 bg-blue-950 text-blue-300 border border-blue-800/60 rounded-full font-mono text-[11px] font-semibold">
                            {count} vị trí
                          </span>
                          <button
                            onClick={() => handleReplaceSingleChapter(chapter)}
                            disabled={!isSelected}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-[11px] font-medium rounded-lg border border-slate-700 transition-colors"
                            title="Thay thế chỉ riêng trong chương này"
                          >
                            Thay thế chương này
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-600 px-2 py-1">
                          0 kết quả
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded Code Snippets Preview */}
                  {isExpanded && count > 0 && (
                    <div className="px-4 pb-3 pt-1 border-t border-slate-800/60 bg-slate-900/50 rounded-b-xl space-y-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Đoạn mã XHTML xem trước (Hiển thị tối đa 5 vị trí):</span>
                      </div>
                      <div className="space-y-1.5">
                        {snippets.map((s, idx) => (
                          <div
                            key={idx}
                            className="p-2 bg-slate-950 font-mono text-[11px] text-slate-300 rounded border border-slate-800/80 overflow-x-auto leading-relaxed"
                          >
                            <span className="text-slate-500">{s.snippetBefore}</span>
                            <mark className="bg-amber-500/30 text-amber-200 px-1 py-0.5 rounded font-bold border border-amber-500/50">
                              {s.matchText}
                            </mark>
                            <span className="text-slate-500">{s.snippetAfter}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
