import React, { useState, useRef, useEffect } from "react";
import { EpubChapter, EditorTab } from "../types";
import { extractChapterBodyHtml, updateChapterBodyHtml } from "../lib/tocUtils";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Code,
  Eye,
  Edit3,
  Sparkles,
  Type,
  Sun,
  Moon,
  BookOpen,
  Wand2,
  Image as ImageIcon,
  Check,
  RotateCcw,
} from "lucide-react";

interface ContentEditorProps {
  chapter: EpubChapter | null;
  onChangeContent: (chapterId: string, newContent: string) => void;
  onChangeTitle: (chapterId: string, newTitle: string) => void;
  onOpenAi: (action?: string) => void;
}

export const ContentEditor: React.FC<ContentEditorProps> = ({
  chapter,
  onChangeContent,
  onChangeTitle,
  onOpenAi,
}) => {
  const [editorTab, setEditorTab] = useState<EditorTab>("visual");
  const visualRef = useRef<HTMLDivElement>(null);

  // Preview options
  const [previewTheme, setPreviewTheme] = useState<"light" | "sepia" | "dark">("sepia");
  const [previewFontSize, setPreviewFontSize] = useState<number>(18);
  const [previewLineHeight, setPreviewLineHeight] = useState<number>(1.8);
  const [previewFontFamily, setPreviewFontFamily] = useState<"serif" | "sans" | "mono">("serif");

  // Keep visual content synchronized with state
  useEffect(() => {
    if (visualRef.current && chapter) {
      const bodyHtml = extractChapterBodyHtml(chapter.content);
      if (visualRef.current.innerHTML !== bodyHtml) {
        visualRef.current.innerHTML = bodyHtml;
      }
    }
  }, [chapter?.id]);

  if (!chapter) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-950 text-slate-500">
        <p className="text-sm">Vui lòng chọn một chương ở danh sách bên trái để chỉnh sửa.</p>
      </div>
    );
  }

  // Calculate stats
  const bodyHtml = extractChapterBodyHtml(chapter.content);
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = bodyHtml;
  const plainText = tempDiv.innerText || tempDiv.textContent || "";
  const charCount = plainText.length;
  const wordCount = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
  const readTimeMin = Math.ceil(wordCount / 200);

  // Exec command for visual editor
  const execCmd = (cmd: string, value: string | undefined = undefined) => {
    document.execCommand(cmd, false, value);
    if (visualRef.current && chapter) {
      const newBodyHtml = visualRef.current.innerHTML;
      const updatedFullContent = updateChapterBodyHtml(
        chapter.content,
        newBodyHtml,
        chapter.title
      );
      onChangeContent(chapter.id, updatedFullContent);
    }
  };

  const handleVisualInput = () => {
    if (visualRef.current && chapter) {
      const newBodyHtml = visualRef.current.innerHTML;
      const updatedFullContent = updateChapterBodyHtml(
        chapter.content,
        newBodyHtml,
        chapter.title
      );
      onChangeContent(chapter.id, updatedFullContent);
    }
  };

  const escapeHtml = (str: string): string => {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const plainText = e.clipboardData.getData("text/plain");
    if (!plainText) return;

    // Split text into lines, trim whitespace, and convert non-empty lines to <p> tags
    const lines = plainText.split(/\r?\n/);
    const paragraphs = lines
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => `<p>${escapeHtml(line)}</p>`);

    const htmlToInsert =
      paragraphs.length > 0
        ? paragraphs.join("")
        : `<p>${escapeHtml(plainText.trim())}</p>`;

    if (document.queryCommandSupported("insertHTML")) {
      document.execCommand("insertHTML", false, htmlToInsert);
    } else {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        selection.deleteFromDocument();
        const range = selection.getRangeAt(0);
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = htmlToInsert;
        const frag = document.createDocumentFragment();
        let child: Node | null;
        while ((child = tempDiv.firstChild)) {
          frag.appendChild(child);
        }
        range.insertNode(frag);
      }
    }

    if (visualRef.current && chapter) {
      const newBodyHtml = visualRef.current.innerHTML;
      const updatedFullContent = updateChapterBodyHtml(
        chapter.content,
        newBodyHtml,
        chapter.title
      );
      onChangeContent(chapter.id, updatedFullContent);
    }
  };

  const handleInsertImage = () => {
    const url = prompt("Nhập đường dẫn URL hình ảnh:");
    if (url) {
      execCmd("insertImage", url);
    }
  };

  const handleCleanHtml = () => {
    // Simple HTML cleanup
    const clean = chapter.content
      .replace(/style="[^"]*"/gi, "")
      .replace(/class="[^"]*"/gi, "")
      .replace(/<span[^>]*>/gi, "")
      .replace(/<\/span>/gi, "");
    onChangeContent(chapter.id, clean);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden min-w-0">
      {/* Top Header Bar */}
      <div className="bg-slate-900 border-b border-slate-800 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
        {/* Chapter Title Edit */}
        <div className="flex items-center space-x-2 flex-1">
          <BookOpen className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <input
            type="text"
            value={chapter.title}
            onChange={(e) => onChangeTitle(chapter.id, e.target.value)}
            className="bg-slate-950 border border-slate-700 focus:border-blue-500 text-slate-100 font-bold text-base px-3 py-1 rounded-xl w-full max-w-lg"
            placeholder="Tên chương..."
          />
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setEditorTab("visual")}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                editorTab === "visual"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Trực Quan</span>
            </button>
            <button
              onClick={() => setEditorTab("code")}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                editorTab === "code"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Mã XHTML</span>
            </button>
            <button
              onClick={() => setEditorTab("preview")}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                editorTab === "preview"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Xem Thử</span>
            </button>
          </div>

          {/* AI Quick Button */}
          <button
            onClick={() => onOpenAi()}
            className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden md:inline">Trợ Lý AI</span>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-slate-900/60 px-4 py-2 border-b border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <span>Số từ: <strong className="text-slate-200">{wordCount}</strong></span>
          <span>Ký tự: <strong className="text-slate-200">{charCount}</strong></span>
          <span>Thời gian đọc: <strong className="text-slate-200">~{readTimeMin} phút</strong></span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCleanHtml}
            className="hover:text-slate-200 underline"
            title="Xóa bớt thẻ định dạng rác"
          >
            Làm sạch HTML
          </button>
        </div>
      </div>

      {/* Main Tab Editor Body */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 1. VISUAL WYSIWYG MODE */}
        {editorTab === "visual" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Formatting Toolbar */}
            <div className="bg-slate-900 border-b border-slate-800 p-2 flex flex-wrap items-center gap-1 flex-shrink-0">
              <button
                onClick={() => execCmd("bold")}
                className="p-1.5 hover:bg-slate-800 text-slate-300 rounded"
                title="In đậm (Ctrl+B)"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                onClick={() => execCmd("italic")}
                className="p-1.5 hover:bg-slate-800 text-slate-300 rounded"
                title="In nghiêng (Ctrl+I)"
              >
                <Italic className="w-4 h-4" />
              </button>
              <div className="h-4 w-px bg-slate-800 mx-1" />

              <button
                onClick={() => execCmd("formatBlock", "<h1>")}
                className="p-1.5 hover:bg-slate-800 text-slate-300 rounded font-bold text-xs"
                title="Tiêu đề H1"
              >
                H1
              </button>
              <button
                onClick={() => execCmd("formatBlock", "<h2>")}
                className="p-1.5 hover:bg-slate-800 text-slate-300 rounded font-bold text-xs"
                title="Tiêu đề H2"
              >
                H2
              </button>
              <button
                onClick={() => execCmd("formatBlock", "<h3>")}
                className="p-1.5 hover:bg-slate-800 text-slate-300 rounded font-bold text-xs"
                title="Tiêu đề H3"
              >
                H3
              </button>
              <button
                onClick={() => execCmd("formatBlock", "<p>")}
                className="p-1.5 hover:bg-slate-800 text-slate-300 rounded text-xs"
                title="Đoạn văn P"
              >
                Thường
              </button>

              <div className="h-4 w-px bg-slate-800 mx-1" />

              <button
                onClick={() => execCmd("insertUnorderedList")}
                className="p-1.5 hover:bg-slate-800 text-slate-300 rounded"
                title="Danh sách dấu chấm"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => execCmd("insertOrderedList")}
                className="p-1.5 hover:bg-slate-800 text-slate-300 rounded"
                title="Danh sách số"
              >
                <ListOrdered className="w-4 h-4" />
              </button>

              <div className="h-4 w-px bg-slate-800 mx-1" />

              <button
                onClick={() => execCmd("formatBlock", "<blockquote>")}
                className="p-1.5 hover:bg-slate-800 text-slate-300 rounded"
                title="Trích dẫn Blockquote"
              >
                <Quote className="w-4 h-4" />
              </button>
              <button
                onClick={() => execCmd("insertHorizontalRule")}
                className="p-1.5 hover:bg-slate-800 text-slate-300 rounded"
                title="Đường phân cách HR"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={handleInsertImage}
                className="p-1.5 hover:bg-slate-800 text-slate-300 rounded"
                title="Chèn ảnh bằng URL"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              <div className="h-4 w-px bg-slate-800 mx-1" />

              <button
                onClick={() => execCmd("removeFormat")}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded text-xs"
                title="Xóa định dạng"
              >
                Xóa Format
              </button>
            </div>

            {/* Editable Canvas */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-950 flex justify-center">
              <div
                ref={visualRef}
                contentEditable
                onInput={handleVisualInput}
                onPaste={handlePaste}
                className="w-full max-w-3xl min-h-[500px] px-4 py-2 text-slate-100 focus:outline-none focus:ring-0 focus:border-none border-none outline-none leading-relaxed font-serif text-base prose prose-invert max-w-none"
                style={{
                  minHeight: "600px",
                }}
              />
            </div>
          </div>
        )}

        {/* 2. CODE XHTML MODE */}
        {editorTab === "code" && (
          <div className="flex-1 flex flex-col p-4 bg-slate-950 overflow-hidden">
            <div className="mb-2 text-xs text-slate-400 flex items-center justify-between">
              <span>Mã XHTML gốc của chương:</span>
              <span className="text-emerald-400 font-mono text-[11px]">Cấu trúc XHTML tiêu chuẩn</span>
            </div>
            <textarea
              value={chapter.content}
              onChange={(e) => onChangeContent(chapter.id, e.target.value)}
              className="flex-1 w-full bg-slate-900 text-emerald-300 font-mono text-xs p-4 rounded-xl border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 leading-relaxed resize-none focus:outline-none"
              spellCheck={false}
            />
          </div>
        )}

        {/* 3. E-READER PREVIEW MODE */}
        {editorTab === "preview" && (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
            {/* E-Reader Display Controls */}
            <div className="bg-slate-900 p-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs flex-shrink-0">
              {/* Theme Switcher */}
              <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setPreviewTheme("light")}
                  className={`px-2.5 py-1 rounded text-xs font-medium flex items-center space-x-1 ${
                    previewTheme === "light" ? "bg-white text-slate-900 shadow" : "text-slate-400"
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Sáng</span>
                </button>
                <button
                  onClick={() => setPreviewTheme("sepia")}
                  className={`px-2.5 py-1 rounded text-xs font-medium flex items-center space-x-1 ${
                    previewTheme === "sepia" ? "bg-[#fbf0d9] text-[#5f4b32] shadow font-bold" : "text-slate-400"
                  }`}
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>Sepia</span>
                </button>
                <button
                  onClick={() => setPreviewTheme("dark")}
                  className={`px-2.5 py-1 rounded text-xs font-medium flex items-center space-x-1 ${
                    previewTheme === "dark" ? "bg-slate-800 text-slate-100 shadow" : "text-slate-400"
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Tối</span>
                </button>
              </div>

              {/* Font Family */}
              <div className="flex items-center space-x-1">
                <span className="text-slate-400">Phông:</span>
                <select
                  value={previewFontFamily}
                  onChange={(e: any) => setPreviewFontFamily(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-slate-200 px-2 py-1 rounded text-xs"
                >
                  <option value="serif">Có Chân (Serif)</option>
                  <option value="sans">Không Chân (Sans)</option>
                  <option value="mono">Đơn Lập (Mono)</option>
                </select>
              </div>

              {/* Font Size */}
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">Cỡ chữ:</span>
                <button
                  onClick={() => setPreviewFontSize(Math.max(14, previewFontSize - 2))}
                  className="px-2 py-0.5 bg-slate-800 text-slate-200 rounded hover:bg-slate-700"
                >
                  A-
                </button>
                <span className="font-mono text-slate-200">{previewFontSize}px</span>
                <button
                  onClick={() => setPreviewFontSize(Math.min(28, previewFontSize + 2))}
                  className="px-2 py-0.5 bg-slate-800 text-slate-200 rounded hover:bg-slate-700"
                >
                  A+
                </button>
              </div>
            </div>

            {/* Simulated E-Reader Viewport */}
            <div className="flex-1 p-4 sm:p-8 overflow-y-auto flex justify-center">
              <div
                className={`w-full max-w-2xl min-h-[600px] p-8 sm:p-12 rounded-2xl shadow-2xl transition-all ${
                  previewTheme === "light"
                    ? "bg-white text-slate-900 border border-slate-200"
                    : previewTheme === "sepia"
                    ? "bg-[#fbf0d9] text-[#3c2f1d] border border-[#e8d5b5]"
                    : "bg-slate-900 text-slate-100 border border-slate-800"
                }`}
                style={{
                  fontSize: `${previewFontSize}px`,
                  lineHeight: previewLineHeight,
                  fontFamily:
                    previewFontFamily === "serif"
                      ? "Georgia, Cambria, 'Times New Roman', serif"
                      : previewFontFamily === "sans"
                      ? "system-ui, -apple-system, sans-serif"
                      : "monospace",
                }}
                dangerouslySetInnerHTML={{ __html: extractChapterBodyHtml(chapter.content) }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
