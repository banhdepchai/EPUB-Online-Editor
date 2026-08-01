import React, { useState } from "react";
import { EpubAsset } from "../types";
import {
  FolderOpen,
  Upload,
  Code,
  FileCode,
  Image as ImageIcon,
  Check,
  Save,
} from "lucide-react";

interface AssetManagerProps {
  assets: EpubAsset[];
  onUploadAsset: (file: File) => void;
  onUpdateCss: (assetId: string, newCss: string) => void;
}

export const AssetManager: React.FC<AssetManagerProps> = ({
  assets,
  onUploadAsset,
  onUpdateCss,
}) => {
  const [activeTab, setActiveTab] = useState<"images" | "css">("images");
  const cssAsset = assets.find((a) => a.mediaType.includes("css") || a.href.endsWith(".css"));
  const [cssText, setCssText] = useState(cssAsset?.text || "");
  const [isSaved, setIsSaved] = useState(false);

  const imageAssets = assets.filter((a) => a.mediaType.startsWith("image/"));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadAsset(file);
    }
  };

  const handleSaveCss = () => {
    if (cssAsset) {
      onUpdateCss(cssAsset.id, cssText);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <FolderOpen className="w-5 h-5 text-blue-400" />
            <span>Quản Lý Hình Ảnh & Định Dạng CSS</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Xem danh sách hình ảnh đã nhúng và tùy chỉnh file định dạng CSS cho cuốn sách.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("images")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
              activeTab === "images" ? "bg-blue-600 text-white shadow" : "text-slate-400"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Hình Ảnh ({imageAssets.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("css")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
              activeTab === "css" ? "bg-blue-600 text-white shadow" : "text-slate-400"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Tệp CSS (Style)</span>
          </button>
        </div>
      </div>

      {/* Images Gallery */}
      {activeTab === "images" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Danh sách hình ảnh trong EPUB:
            </h3>

            <label className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all shadow">
              <Upload className="w-3.5 h-3.5" />
              <span>Thêm Ảnh Mới</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>

          {imageAssets.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-500">
              Chưa có hình ảnh nào được nhúng trong cuốn sách này.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {imageAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col space-y-2 group hover:border-blue-500/50 transition-all"
                >
                  <div className="w-full h-36 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-slate-800/80">
                    {asset.dataUrl ? (
                      <img
                        src={asset.dataUrl}
                        alt={asset.href}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-700" />
                    )}
                  </div>

                  <div className="text-[11px] space-y-0.5">
                    <p className="font-semibold text-slate-200 truncate">{asset.href}</p>
                    <p className="text-slate-500 font-mono text-[10px]">{asset.mediaType}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CSS Editor */}
      {activeTab === "css" && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Code className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-semibold text-slate-200">
                Chỉnh Sửa Style CSS ({cssAsset?.href || "Styles/style.css"})
              </h3>
            </div>

            <button
              onClick={handleSaveCss}
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow"
            >
              {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaved ? "Đã Lưu CSS!" : "Lưu Thay Đổi"}</span>
            </button>
          </div>

          <textarea
            rows={16}
            value={cssText}
            onChange={(e) => setCssText(e.target.value)}
            className="w-full bg-slate-950 text-indigo-300 font-mono text-xs p-4 rounded-xl border border-slate-800 focus:border-blue-500 leading-relaxed focus:outline-none"
            placeholder="Nhập mã CSS quy định phông chữ, khoảng cách, lề..."
          />
        </div>
      )}
    </div>
  );
};
