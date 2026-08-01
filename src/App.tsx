import React, { useState, useRef, useEffect } from "react";
import { parseEpub } from "./lib/epubParser";
import { exportEpubBlob, downloadEpubFile } from "./lib/epubExporter";
import { createSampleBook } from "./lib/sampleBook";
import {
  fixDuplicateChapterNumbers,
  parseChapterTitle,
  buildChapterTitle,
  createChapterXhtmlFromPrevious,
  generateNextChapterIdAndHref,
  updateXhtmlHeading,
} from "./lib/tocUtils";
import { EpubBook, EpubChapter, ViewMode, EpubMetadata, EpubAsset } from "./types";
import { Navbar } from "./components/Navbar";
import { MetadataEditor } from "./components/MetadataEditor";
import { ChapterSidebar } from "./components/ChapterSidebar";
import { ContentEditor } from "./components/ContentEditor";
import { TocManager } from "./components/TocManager";
import { SearchReplaceView } from "./components/SearchReplaceView";
import { AssetManager } from "./components/AssetManager";
import { AiAssistModal } from "./components/AiAssistModal";
import {
  Upload,
  BookOpen,
  Sparkles,
  RefreshCw,
  FileText,
  Layers,
  List,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
} from "lucide-react";

export default function App() {
  const [book, setBook] = useState<EpubBook | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewMode>("editor");
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load sample book on start
  useEffect(() => {
    const sample = createSampleBook();
    setBook(sample);
    if (sample.chapters.length > 0) {
      setActiveChapterId(sample.chapters[0].id);
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".epub")) {
      setErrorMessage("Vui lòng chọn tệp có định dạng .epub!");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const parsedBook = await parseEpub(file, file.name);
      setBook(parsedBook);
      if (parsedBook.chapters.length > 0) {
        setActiveChapterId(parsedBook.chapters[0].id);
      }
      setCurrentView("editor");
    } catch (err: any) {
      console.error("Lỗi đọc EPUB:", err);
      setErrorMessage(err.message || "Không thể mở tệp EPUB này. Tệp có thể đã bị hỏng.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleExport = async () => {
    if (!book) return;
    setIsExporting(true);
    try {
      const blob = await exportEpubBlob(book);
      downloadEpubFile(blob, book.filename || `${book.metadata.title || "book"}.epub`);
    } catch (err: any) {
      alert(`Không thể xuất file EPUB: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleLoadSample = () => {
    const sample = createSampleBook();
    setBook(sample);
    if (sample.chapters.length > 0) {
      setActiveChapterId(sample.chapters[0].id);
    }
    setCurrentView("editor");
  };

  // Metadata Updates
  const handleMetadataChange = (updatedMetadata: EpubMetadata) => {
    if (!book) return;
    setBook({
      ...book,
      metadata: updatedMetadata,
    });
  };

  // Chapter Operations
  const handleSelectChapter = (id: string) => {
    setActiveChapterId(id);
  };

  const handleInsertChapterAtIndex = (
    targetIndex?: number,
    position: "before" | "after" = "after"
  ) => {
    if (!book) return;

    const total = book.chapters.length;
    let insertAt =
      targetIndex !== undefined
        ? position === "after"
          ? targetIndex + 1
          : targetIndex
        : total;
    insertAt = Math.max(0, Math.min(insertAt, total));

    // Determine reference chapter for copying XHTML structure & stripping <p>
    let refIndex =
      targetIndex !== undefined
        ? targetIndex
        : total > 0
        ? total - 1
        : -1;
    if (refIndex < 0 && total > 0) refIndex = 0;

    const prevChapter =
      refIndex >= 0 && refIndex < total ? book.chapters[refIndex] : null;

    let newTitle = `Chương ${insertAt + 1}: Chương Mới`;
    if (prevChapter) {
      const parsed = parseChapterTitle(prevChapter.title);
      if (parsed.num !== null) {
        const nextNum = position === "after" ? parsed.num + 1 : parsed.num;
        newTitle = buildChapterTitle(
          parsed.prefix,
          nextNum,
          parsed.separator,
          "Chương Mới"
        );
      }
    }

    const { newId, newHref } = generateNextChapterIdAndHref(
      prevChapter,
      insertAt,
      book.chapters
    );

    const baseContent = prevChapter
      ? prevChapter.content
      : `<h1>${newTitle}</h1>`;
    const newContent = createChapterXhtmlFromPrevious(baseContent, newTitle);

    const newChapter: EpubChapter = {
      id: newId,
      href: newHref,
      fullPath: book.baseDir ? `${book.baseDir}/${newHref}` : newHref,
      title: newTitle,
      content: newContent,
      mediaType: "application/xhtml+xml",
      playOrder: insertAt + 1,
    };

    const updatedChapters = [...book.chapters];
    updatedChapters.splice(insertAt, 0, newChapter);

    setBook({
      ...book,
      chapters: updatedChapters,
    });
    setActiveChapterId(newId);
  };

  const handleAddChapter = () => {
    handleInsertChapterAtIndex(
      book?.chapters.length ? book.chapters.length - 1 : undefined,
      "after"
    );
  };

  const handleDeleteChapter = (id: string) => {
    if (!book || book.chapters.length <= 1) return;
    const updated = book.chapters.filter((ch) => ch.id !== id);
    setBook({
      ...book,
      chapters: updated,
    });
    if (activeChapterId === id && updated.length > 0) {
      setActiveChapterId(updated[0].id);
    }
  };

  const handleReorderChapter = (id: string, direction: "up" | "down") => {
    if (!book) return;
    const idx = book.chapters.findIndex((ch) => ch.id === id);
    if (idx === -1) return;

    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= book.chapters.length) return;

    const list = [...book.chapters];
    const temp = list[idx];
    list[idx] = list[newIdx];
    list[newIdx] = temp;

    setBook({
      ...book,
      chapters: list,
    });
  };

  const handleRenameChapter = (id: string, newTitle: string) => {
    if (!book) return;
    setBook({
      ...book,
      chapters: book.chapters.map((ch) => {
        if (ch.id === id) {
          const newContent = updateXhtmlHeading(ch.content, null, 0, newTitle);
          return {
            ...ch,
            title: newTitle,
            content: newContent,
          };
        }
        return ch;
      }),
    });
  };

  const handleChangeChapterContent = (id: string, newContent: string) => {
    if (!book) return;
    setBook({
      ...book,
      chapters: book.chapters.map((ch) =>
        ch.id === id ? { ...ch, content: newContent } : ch
      ),
    });
  };

  // Search and Replace on Selected Chapters (Supports XHTML & Regex)
  const handleReplaceSelected = (
    search: string,
    replace: string,
    matchCase: boolean,
    useRegex: boolean,
    selectedChapterIds: string[]
  ): number => {
    if (!book || !search || selectedChapterIds.length === 0) return 0;

    let totalReplaced = 0;
    try {
      let regex: RegExp;
      const flags = matchCase ? "g" : "gi";
      if (useRegex) {
        regex = new RegExp(search, flags);
      } else {
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        regex = new RegExp(escaped, flags);
      }

      const selectedSet = new Set(selectedChapterIds);

      const updatedChapters = book.chapters.map((ch) => {
        if (!selectedSet.has(ch.id)) return ch;

        const matches = ch.content.match(regex);
        if (matches) {
          totalReplaced += matches.length;
          const newContent = ch.content.replace(regex, replace);
          return { ...ch, content: newContent };
        }
        return ch;
      });

      setBook({ ...book, chapters: updatedChapters });
      return totalReplaced;
    } catch (e) {
      console.error("Lỗi khi thay thế theo điều kiện:", e);
      return 0;
    }
  };

  // Auto Generate TOC
  const handleAutoGenerateToc = () => {
    if (!book) return;
    const parser = new DOMParser();

    const updatedChapters = book.chapters.map((ch) => {
      try {
        const doc = parser.parseFromString(ch.content, "text/html");
        const heading = doc.querySelector("h1, h2, h3, h4, title");
        if (heading && heading.textContent?.trim()) {
          return { ...ch, title: heading.textContent.trim() };
        }
      } catch (e) {}
      return ch;
    });

    setBook({ ...book, chapters: updatedChapters });
  };

  // Fix Duplicate Chapter Numbers (+1 for duplicate and subsequent chapters)
  const handleFixDuplicateChapters = () => {
    if (!book) return;
    const { updatedChapters, changesCount } = fixDuplicateChapterNumbers(book.chapters, true, true);
    if (changesCount > 0) {
      setBook({ ...book, chapters: updatedChapters });
      alert(`Đã tự động cộng +1 và sửa số thứ tự cho ${changesCount} chương trùng (bắt đầu từ chương sau Mục lục)!`);
    } else {
      alert("Không tìm thấy chương nào bị trùng số thứ tự!");
    }
  };

  // Asset Operations
  const handleUploadAsset = (file: File) => {
    if (!book) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const assetId = `img_${Date.now()}`;
      const assetHref = `Images/${file.name}`;
      const newAsset: EpubAsset = {
        id: assetId,
        href: assetHref,
        fullPath: `${book.baseDir}/${assetHref}`,
        mediaType: file.type || "image/jpeg",
        dataUrl,
        blob: file,
      };

      setBook({
        ...book,
        assets: [...book.assets, newAsset],
      });
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateCss = (assetId: string, newCss: string) => {
    if (!book) return;
    setBook({
      ...book,
      assets: book.assets.map((a) =>
        a.id === assetId ? { ...a, text: newCss } : a
      ),
    });
  };

  const activeChapter = book?.chapters.find((ch) => ch.id === activeChapterId) || null;

  return (
    <div
      className="h-screen w-full bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleFileDrop}
    >
      {/* Invisible file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".epub"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
        }}
      />

      {/* Navigation Bar */}
      <Navbar
        bookTitle={book?.metadata.title || "EPUB Editor"}
        filename={book?.filename || ""}
        currentView={currentView}
        onViewChange={setCurrentView}
        onUploadClick={() => fileInputRef.current?.click()}
        onExportClick={handleExport}
        onLoadSample={handleLoadSample}
        isExporting={isExporting}
        hasBookLoaded={!!book}
        onOpenAiModal={() => setIsAiModalOpen(true)}
      />

      {/* Error Notification */}
      {errorMessage && (
        <div className="bg-rose-900/80 border-b border-rose-700 p-3 text-center text-xs text-rose-100 font-medium flex items-center justify-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-300" />
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="underline ml-4 font-bold"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Main Container */}
      {!book || isLoading ? (
        /* Empty Dropzone / Loading State */
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto">
          {isLoading ? (
            <div className="space-y-4">
              <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
              <p className="text-base font-semibold text-slate-200">
                Đang giải nén & phân tích tệp EPUB...
              </p>
            </div>
          ) : (
            <div className="bg-slate-900/80 border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-3xl p-8 sm:p-12 shadow-2xl transition-all space-y-6 w-full">
              <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto text-blue-400">
                <Upload className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">Kéo thả tệp EPUB vào đây</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Hoặc bấm bên dưới để mở file từ máy tính của bạn
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-900/40 transition-all"
                >
                  Chọn Tệp EPUB Từ Máy Tính
                </button>
                <button
                  onClick={handleLoadSample}
                  className="w-full sm:w-auto px-6 py-3 bg-indigo-900/40 hover:bg-indigo-900/60 text-indigo-200 rounded-xl text-xs font-semibold border border-indigo-700/50 transition-all flex items-center justify-center space-x-1.5"
                >
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span>Mở Sách Mẫu "Hoàng Tử Bé"</span>
                </button>
              </div>
            </div>
          )}
        </main>
      ) : (
        /* Loaded Application Workspace Views */
        <main className="flex-1 flex overflow-hidden">
          {/* VIEW 1: CHAPTERS & CONTENT EDITOR */}
          {currentView === "editor" && (
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden h-full min-h-0">
              <ChapterSidebar
                chapters={book.chapters}
                activeChapterId={activeChapterId}
                onSelectChapter={handleSelectChapter}
                onAddChapter={handleAddChapter}
                onAddChapterAt={handleInsertChapterAtIndex}
                onDeleteChapter={handleDeleteChapter}
                onReorderChapter={handleReorderChapter}
                onRenameChapter={handleRenameChapter}
                onFixDuplicates={handleFixDuplicateChapters}
              />
              <ContentEditor
                chapter={activeChapter}
                onChangeContent={handleChangeChapterContent}
                onChangeTitle={(id, title) => handleRenameChapter(id, title)}
                onOpenAi={() => setIsAiModalOpen(true)}
              />
            </div>
          )}

          {/* VIEW 2: METADATA & COVER EDITOR */}
          {currentView === "metadata" && (
            <div className="flex-1 overflow-y-auto">
              <MetadataEditor
                metadata={book.metadata}
                onChange={handleMetadataChange}
                onOpenAi={() => setIsAiModalOpen(true)}
              />
            </div>
          )}

          {/* VIEW 3: TABLE OF CONTENTS MANAGER */}
          {currentView === "toc" && (
            <div className="flex-1 overflow-y-auto">
              <TocManager
                chapters={book.chapters}
                onUpdateChapterTitle={handleRenameChapter}
                onReorderChapter={handleReorderChapter}
                onDeleteChapter={handleDeleteChapter}
                onAddChapterAt={handleInsertChapterAtIndex}
                onAutoGenerateToc={handleAutoGenerateToc}
                onUpdateChapters={(updatedChapters) => {
                  setBook({ ...book, chapters: updatedChapters });
                }}
              />
            </div>
          )}

          {/* VIEW 4: SEARCH & REPLACE */}
          {currentView === "search" && (
            <div className="flex-1 overflow-y-auto">
              <SearchReplaceView
                chapters={book.chapters}
                onReplaceInChapter={handleChangeChapterContent}
                onReplaceSelected={handleReplaceSelected}
              />
            </div>
          )}

          {/* VIEW 5: ASSET MANAGER */}
          {currentView === "assets" && (
            <div className="flex-1 overflow-y-auto">
              <AssetManager
                assets={book.assets}
                onUploadAsset={handleUploadAsset}
                onUpdateCss={handleUpdateCss}
              />
            </div>
          )}
        </main>
      )}

      {/* AI Assistant Modal */}
      <AiAssistModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        activeChapterText={activeChapter?.content || ""}
        onApplyResult={(newContent) => {
          if (activeChapterId) {
            handleChangeChapterContent(activeChapterId, newContent);
          }
        }}
      />
    </div>
  );
}
