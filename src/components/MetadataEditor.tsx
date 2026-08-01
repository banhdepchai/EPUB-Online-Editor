import React, { useRef } from "react";
import { EpubMetadata } from "../types";
import {
  Image as ImageIcon,
  Upload,
  Book,
  User,
  Building,
  Globe,
  FileText,
  Key,
  Shield,
  Sparkles,
  CheckCircle2,
  Trash2,
} from "lucide-react";

interface MetadataEditorProps {
  metadata: EpubMetadata;
  onChange: (updated: EpubMetadata) => void;
  onOpenAi: () => void;
}

export const MetadataEditor: React.FC<MetadataEditorProps> = ({
  metadata,
  onChange,
  onOpenAi,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof EpubMetadata, value: string) => {
    onChange({
      ...metadata,
      [field]: value,
    });
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      onChange({
        ...metadata,
        coverImageDataUrl: dataUrl,
        coverImageBlob: file,
        coverImageType: file.type || "image/jpeg",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCover = () => {
    onChange({
      ...metadata,
      coverImageDataUrl: null,
      coverImageHref: null,
      coverImageBlob: null,
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-900 p-6 rounded-2xl border border-blue-800/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Book className="w-6 h-6 text-blue-400" />
            <span>Thông Tin Chi Tiết & Ảnh Bìa Sách</span>
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            Chỉnh sửa tiêu đề, tác giả, ngôn ngữ, nhà xuất bản và cập nhật ảnh bìa chất lượng cao cho file EPUB.
          </p>
        </div>
        <button
          onClick={onOpenAi}
          className="self-start md:self-auto flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Gợi Ý / Tóm Tắt Mới Bằng AI</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Cover Image & Quick Actions */}
        <div className="lg:col-span-1 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex flex-col items-center justify-between space-y-4">
          <div className="w-full text-center">
            <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center justify-center space-x-1.5">
              <ImageIcon className="w-4 h-4 text-blue-400" />
              <span>Ảnh Bìa Sách (Cover)</span>
            </h3>

            {/* Cover Image Container */}
            <div className="relative group w-48 h-72 mx-auto rounded-xl overflow-hidden shadow-2xl border-2 border-slate-700 bg-slate-950 flex items-center justify-center">
              {metadata.coverImageDataUrl ? (
                <img
                  src={metadata.coverImageDataUrl}
                  alt="Ảnh bìa sách"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="text-center p-4">
                  <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">Chưa có ảnh bìa</p>
                </div>
              )}

              {/* Hover Overlay Buttons */}
              <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center space-y-2 p-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 shadow-lg"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Thay Ảnh Bìa</span>
                </button>
                {metadata.coverImageDataUrl && (
                  <button
                    onClick={handleRemoveCover}
                    className="w-full py-2 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 shadow-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa Ảnh Bìa</span>
                  </button>
                )}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp, image/svg+xml"
              className="hidden"
              onChange={handleCoverUpload}
            />

            <p className="text-xs text-slate-400 mt-3">
              Định dạng hỗ trợ: JPG, PNG, WEBP, SVG. Khuyên dùng tỉ lệ 2:3 (ví dụ: 1200x1800px).
            </p>
          </div>

          <div className="w-full pt-4 border-t border-slate-800 space-y-2 text-xs text-slate-400">
            <div className="flex items-center justify-between">
              <span>Định dạng EPUB:</span>
              <span className="font-semibold text-slate-200">EPUB 3.0 / 2.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Encoding:</span>
              <span className="font-semibold text-slate-200">UTF-8</span>
            </div>
          </div>
        </div>

        {/* Right Column: Metadata Input Form */}
        <div className="lg:col-span-2 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-5">
          {/* Title & Author */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1">
                <Book className="w-3.5 h-3.5 text-blue-400" />
                <span>Tiêu Đề Tác Phẩm (Title) *</span>
              </label>
              <input
                type="text"
                value={metadata.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Nhập tên sách..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-slate-100 text-sm font-medium transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>Tác Giả / Người Sáng Tác (Author) *</span>
              </label>
              <input
                type="text"
                value={metadata.creator}
                onChange={(e) => handleChange("creator", e.target.value)}
                placeholder="Nhập tên tác giả..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-slate-100 text-sm font-medium transition-all"
              />
            </div>
          </div>

          {/* Publisher & Language */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>Nhà Xuất Bản (Publisher)</span>
              </label>
              <input
                type="text"
                value={metadata.publisher}
                onChange={(e) => handleChange("publisher", e.target.value)}
                placeholder="Ví dụ: NXB Trẻ, NXB Văn Học..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-slate-100 text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ngôn Ngữ (Language)</span>
              </label>
              <select
                value={metadata.language}
                onChange={(e) => handleChange("language", e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-slate-100 text-sm transition-all"
              >
                <option value="vi">Tiếng Việt (vi)</option>
                <option value="en">English (en)</option>
                <option value="fr">Français (fr)</option>
                <option value="zh">中文 (zh)</option>
                <option value="ja">日本語 (ja)</option>
                <option value="ko">한국어 (ko)</option>
              </select>
            </div>
          </div>

          {/* Identifier & Rights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Mã Định Danh (ISBN / UUID)</span>
              </label>
              <input
                type="text"
                value={metadata.identifier}
                onChange={(e) => handleChange("identifier", e.target.value)}
                placeholder="urn:uuid:..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-slate-100 text-xs font-mono transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span>Bản Quyền (Rights)</span>
              </label>
              <input
                type="text"
                value={metadata.rights}
                onChange={(e) => handleChange("rights", e.target.value)}
                placeholder="Ví dụ: Public Domain, Copyright 2026..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-slate-100 text-sm transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Mô Tả / Giới Thiệu Tác Phẩm (Description)</span>
            </label>
            <textarea
              rows={4}
              value={metadata.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Viết tóm tắt nội dung cuốn sách..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-slate-100 text-sm leading-relaxed transition-all"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 p-3 rounded-xl">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>Mọi thay đổi thông tin metadata được tự động cập nhật khi xuất file EPUB mới.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
