import React, { useState } from "react";
import { EpubChapter } from "../types";
import {
  FileText,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Edit2,
  Check,
  X,
  BookOpen,
  Search,
  RefreshCw,
  PlusCircle,
} from "lucide-react";

interface ChapterSidebarProps {
  chapters: EpubChapter[];
  activeChapterId: string | null;
  onSelectChapter: (id: string) => void;
  onAddChapter: () => void;
  onDeleteChapter: (id: string) => void;
  onReorderChapter: (id: string, direction: "up" | "down") => void;
  onRenameChapter: (id: string, newTitle: string) => void;
  onFixDuplicates?: () => void;
  onAddChapterAt?: (targetIndex: number, position?: "before" | "after") => void;
}

export const ChapterSidebar: React.FC<ChapterSidebarProps> = ({
  chapters,
  activeChapterId,
  onSelectChapter,
  onAddChapter,
  onDeleteChapter,
  onReorderChapter,
  onRenameChapter,
  onFixDuplicates,
  onAddChapterAt,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [chapterToDelete, setChapterToDelete] = useState<EpubChapter | null>(null);

  const startRename = (ch: EpubChapter, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(ch.id);
    setEditingTitle(ch.title);
  };

  const confirmDelete = () => {
    if (chapterToDelete) {
      onDeleteChapter(chapterToDelete.id);
      setChapterToDelete(null);
    }
  };

  const saveRename = (id: string) => {
    if (editingTitle.trim()) {
      onRenameChapter(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const cancelRename = () => {
    setEditingId(null);
  };

  const filteredChapters = chapters.filter((ch) =>
    ch.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full lg:w-72 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col h-auto lg:h-full max-h-56 lg:max-h-none overflow-hidden select-none">
      {/* Header & Add Button */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-4 h-4 text-blue-400" />
          <h3 className="font-semibold text-xs text-slate-200 uppercase tracking-wider">
            Danh Sách Chương ({chapters.length})
          </h3>
        </div>

        <div className="flex items-center space-x-1">
          {onFixDuplicates && (
            <button
              onClick={onFixDuplicates}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs transition-colors"
              title="Tự động sửa trùng số chương (+1 các chương sau)"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onAddChapter}
            className="flex items-center space-x-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg shadow transition-all"
            title="Thêm chương mới"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm</span>
          </button>
        </div>
      </div>

      {/* Chapter Search Bar */}
      <div className="p-2.5 border-b border-slate-800 flex-shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm chương..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg text-xs text-slate-200"
          />
        </div>
      </div>

      {/* Chapters List */}
      <div className="flex-1 overflow-y-auto min-h-0 p-2 space-y-1 scrollbar-thin">
        {filteredChapters.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            Không tìm thấy chương nào
          </div>
        ) : (
          filteredChapters.map((ch, idx) => {
            const isActive = ch.id === activeChapterId;
            const isEditing = ch.id === editingId;

            return (
              <div
                key={ch.id}
                onClick={() => !isEditing && onSelectChapter(ch.id)}
                className={`group relative flex items-center justify-between p-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white font-medium shadow-md shadow-blue-900/30"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0 flex-1 pr-2">
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isActive ? "bg-blue-700 text-blue-100" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {idx + 1}
                  </span>

                  {isEditing ? (
                    <div className="flex items-center space-x-1 flex-1">
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveRename(ch.id);
                          if (e.key === "Escape") cancelRename();
                        }}
                        autoFocus
                        className="w-full px-2 py-0.5 bg-slate-950 text-slate-100 border border-blue-400 rounded text-xs focus:outline-none"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          saveRename(ch.id);
                        }}
                        className="p-1 hover:bg-emerald-600 text-emerald-300 rounded"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelRename();
                        }}
                        className="p-1 hover:bg-slate-700 text-slate-400 rounded"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <span className="truncate font-medium">{ch.title}</span>
                  )}
                </div>

                {/* Chapter Reorder & Action Controls */}
                {!isEditing && (
                  <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReorderChapter(ch.id, "up");
                      }}
                      disabled={idx === 0}
                      className="p-1 hover:bg-slate-700/80 disabled:opacity-30 rounded text-slate-300"
                      title="Chuyển lên"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReorderChapter(ch.id, "down");
                      }}
                      disabled={idx === chapters.length - 1}
                      className="p-1 hover:bg-slate-700/80 disabled:opacity-30 rounded text-slate-300"
                      title="Chuyển xuống"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => startRename(ch, e)}
                      className="p-1 hover:bg-slate-700/80 rounded text-slate-300"
                      title="Đổi tên chương"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    {onAddChapterAt && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddChapterAt(idx, "after");
                        }}
                        className="p-1 hover:bg-emerald-800/80 text-emerald-400 rounded"
                        title="Thêm chương mới phía sau chương này"
                      >
                        <PlusCircle className="w-3 h-3" />
                      </button>
                    )}
                    {chapters.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setChapterToDelete(ch);
                        }}
                        className="p-1 hover:bg-rose-600 text-rose-300 rounded"
                        title="Xóa chương"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {chapterToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="p-2 bg-rose-950 border border-rose-800 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">Xác Nhận Xóa Chương</h3>
            </div>
            <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
              Bạn có chắc chắn muốn xóa chương <strong className="text-white">"{chapterToDelete.title}"</strong> không?
            </p>
            <div className="flex items-center justify-end space-x-2 pt-1">
              <button
                onClick={() => setChapterToDelete(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
