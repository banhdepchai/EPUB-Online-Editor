import React, { useState } from "react";
import {
  Sparkles,
  X,
  Check,
  Languages,
  CheckCheck,
  FileText,
  Code,
  Wand2,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface AiAssistModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeChapterText: string;
  onApplyResult: (newContent: string) => void;
}

export const AiAssistModal: React.FC<AiAssistModalProps> = ({
  isOpen,
  onClose,
  activeChapterText,
  onApplyResult,
}) => {
  const [action, setAction] = useState<string>("fix_grammar");
  const [targetLanguage, setTargetLanguage] = useState("Tiếng Việt");
  const [customPrompt, setCustomPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resultText, setResultText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleProcess = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setResultText("");

    try {
      const res = await fetch("/api/ai/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          text: activeChapterText,
          prompt: customPrompt,
          targetLanguage,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Có lỗi từ máy chủ AI");
      }

      setResultText(data.result);
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể xử lý yêu cầu AI.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (resultText) {
      // Clean code block ticks if any
      let cleaned = resultText.trim();
      if (cleaned.startsWith("```html")) {
        cleaned = cleaned.replace(/^```html\s*/i, "").replace(/\s*```$/, "");
      } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }

      onApplyResult(cleaned);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-300">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Trợ Lý AI Biên Tập EPUB</h3>
              <p className="text-xs text-slate-400">Sử dụng Gemini AI để sửa lỗi, dịch thuật và tối ưu nội dung</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Action Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Chọn tính năng AI cần thực hiện:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setAction("fix_grammar")}
                className={`flex items-center space-x-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                  action === "fix_grammar"
                    ? "bg-purple-600/20 border-purple-500 text-purple-200 shadow"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/50"
                }`}
              >
                <CheckCheck className="w-4 h-4 text-purple-400" />
                <span>Sửa Lỗi Chính Tả & Văn Phong</span>
              </button>

              <button
                onClick={() => setAction("translate")}
                className={`flex items-center space-x-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                  action === "translate"
                    ? "bg-purple-600/20 border-purple-500 text-purple-200 shadow"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/50"
                }`}
              >
                <Languages className="w-4 h-4 text-indigo-400" />
                <span>Dịch Thuật Chương</span>
              </button>

              <button
                onClick={() => setAction("summarize")}
                className={`flex items-center space-x-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                  action === "summarize"
                    ? "bg-purple-600/20 border-purple-500 text-purple-200 shadow"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/50"
                }`}
              >
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Tóm Tắt Nội Dung</span>
              </button>

              <button
                onClick={() => setAction("custom_prompt")}
                className={`flex items-center space-x-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                  action === "custom_prompt"
                    ? "bg-purple-600/20 border-purple-500 text-purple-200 shadow"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/50"
                }`}
              >
                <Wand2 className="w-4 h-4 text-emerald-400" />
                <span>Yêu Cầu Tùy Chỉnh</span>
              </button>
            </div>
          </div>

          {/* Conditional Sub-options */}
          {action === "translate" && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Ngôn ngữ đích:
              </label>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs"
              >
                <option value="Tiếng Việt">Tiếng Việt</option>
                <option value="Tiếng Anh">Tiếng Anh (English)</option>
                <option value="Tiếng Pháp">Tiếng Pháp (Français)</option>
                <option value="Tiếng Trung">Tiếng Trung (Chinese)</option>
                <option value="Tiếng Nhật">Tiếng Nhật (Japanese)</option>
              </select>
            </div>
          )}

          {action === "custom_prompt" && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Yêu cầu cho AI:
              </label>
              <textarea
                rows={2}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Ví dụ: Viết lại đoạn văn theo phong cách kiếm hiệp, bổ sung câu thoại cho nhân vật..."
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs focus:border-purple-500"
              />
            </div>
          )}

          {/* Execute AI Button */}
          <button
            onClick={handleProcess}
            disabled={isLoading || !activeChapterText}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
                <span>Gemini AI Đang Xử Lý Nội Dung...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Bắt Đầu Xử Lý AI</span>
              </>
            )}
          </button>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* AI Result Box */}
          {resultText && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-purple-300 font-semibold">
                <span>Kết quả AI tạo ra:</span>
                <span className="text-[10px] text-slate-400">Xem trước & Áp dụng</span>
              </div>
              <div className="max-h-48 overflow-y-auto p-4 bg-slate-950 border border-purple-900/50 rounded-xl text-slate-200 text-xs font-serif leading-relaxed">
                {resultText}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
          >
            Hủy
          </button>

          {resultText && (
            <button
              onClick={handleApply}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-emerald-900/30"
            >
              <Check className="w-4 h-4" />
              <span>Áp Dụng Vào Chương Hiện Tại</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
