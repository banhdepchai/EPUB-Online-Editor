import React from "react";
import {
  BookOpen,
  Download,
  Upload,
  FileText,
  List,
  Search,
  FolderOpen,
  Sparkles,
  RefreshCw,
  Eye,
  Settings,
  Edit3,
} from "lucide-react";
import { ViewMode } from "../types";

interface NavbarProps {
  bookTitle: string;
  filename: string;
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onUploadClick: () => void;
  onExportClick: () => void;
  onLoadSample: () => void;
  isExporting: boolean;
  hasBookLoaded: boolean;
  onOpenAiModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  bookTitle,
  filename,
  currentView,
  onViewChange,
  onUploadClick,
  onExportClick,
  onLoadSample,
  isExporting,
  hasBookLoaded,
  onOpenAiModal,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-30 shadow-md flex-shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Current Book Info */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-base sm:text-lg text-slate-50 truncate max-w-xs sm:max-w-md">
                  {hasBookLoaded ? bookTitle : "Trình Chỉnh Sửa EPUB Trực Tuyến"}
                </h1>
                {hasBookLoaded && (
                  <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-medium hidden md:inline-block">
                    {filename}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Chỉnh sửa tiêu đề, mục lục, nội dung & xuất file EPUB chuẩn
              </p>
            </div>
          </div>

          {/* Navigation View Tabs */}
          {hasBookLoaded && (
            <nav className="hidden lg:flex items-center space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => onViewChange("metadata")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentView === "metadata"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Thông Tin & Bìa</span>
              </button>

              <button
                onClick={() => onViewChange("editor")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentView === "editor"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Nội Dung Chương</span>
              </button>

              <button
                onClick={() => onViewChange("toc")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentView === "toc"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Mục Lục</span>
              </button>

              <button
                onClick={() => onViewChange("search")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentView === "search"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Tìm & Thay Thế</span>
              </button>

              <button
                onClick={() => onViewChange("assets")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentView === "assets"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Hình Ảnh & CSS</span>
              </button>
            </nav>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {hasBookLoaded && (
              <button
                onClick={onOpenAiModal}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-300 hover:from-amber-500/30 hover:to-purple-500/30 border border-amber-500/30 transition-all shadow-sm"
                title="Sử dụng Trợ lý AI biên tập"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Trợ Lý AI</span>
              </button>
            )}

            <button
              onClick={onUploadClick}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-all border border-slate-700"
              title="Tải tệp EPUB từ máy tính"
            >
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Mở EPUB</span>
            </button>

            {!hasBookLoaded && (
              <button
                onClick={onLoadSample}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-900/40 hover:bg-indigo-900/60 text-indigo-200 rounded-lg text-xs font-medium transition-all border border-indigo-700/50"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                <span>Sách Mẫu</span>
              </button>
            )}

            {hasBookLoaded && (
              <button
                onClick={onExportClick}
                disabled={isExporting}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-900/30 transition-all disabled:opacity-50"
                title="Tải tệp EPUB đã chỉnh sửa về máy"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExporting ? "Đang Xuất..." : "Tải EPUB Về"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile View Navigation Bar */}
        {hasBookLoaded && (
          <div className="flex lg:hidden overflow-x-auto py-2 space-x-1 border-t border-slate-800 scrollbar-none">
            <button
              onClick={() => onViewChange("metadata")}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                currentView === "metadata" ? "bg-blue-600 text-white" : "text-slate-400 bg-slate-800/40"
              }`}
            >
              <Settings className="w-3 h-3" />
              <span>Thông tin</span>
            </button>
            <button
              onClick={() => onViewChange("editor")}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                currentView === "editor" ? "bg-blue-600 text-white" : "text-slate-400 bg-slate-800/40"
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>Chương</span>
            </button>
            <button
              onClick={() => onViewChange("toc")}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                currentView === "toc" ? "bg-blue-600 text-white" : "text-slate-400 bg-slate-800/40"
              }`}
            >
              <List className="w-3 h-3" />
              <span>Mục Lục</span>
            </button>
            <button
              onClick={() => onViewChange("search")}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                currentView === "search" ? "bg-blue-600 text-white" : "text-slate-400 bg-slate-800/40"
              }`}
            >
              <Search className="w-3 h-3" />
              <span>Tìm kiếm</span>
            </button>
            <button
              onClick={() => onViewChange("assets")}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                currentView === "assets" ? "bg-blue-600 text-white" : "text-slate-400 bg-slate-800/40"
              }`}
            >
              <FolderOpen className="w-3 h-3" />
              <span>Hình ảnh & CSS</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
