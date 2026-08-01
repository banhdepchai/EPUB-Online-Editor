export interface EpubMetadata {
  title: string;
  creator: string;
  publisher: string;
  language: string;
  identifier: string;
  description: string;
  rights: string;
  coverImageHref: string | null;
  coverImageDataUrl: string | null;
  coverImageBlob?: Blob | null;
  coverImageType?: string;
}

export interface EpubChapter {
  id: string;
  href: string; // Relative path inside OPF base dir (e.g., "chapter1.xhtml" or "Text/chapter1.xhtml")
  fullPath: string; // Full zip path
  title: string; // Title in TOC or h1
  content: string; // Full XHTML content string
  mediaType: string;
  playOrder: number;
}

export interface EpubAsset {
  id: string;
  href: string;
  fullPath: string;
  mediaType: string;
  dataUrl?: string; // For images
  text?: string; // For CSS or text files
  blob?: Blob;
  isCover?: boolean;
}

export interface EpubBook {
  rawZipAny: any; // JSZip instance
  opfPath: string;
  baseDir: string; // Directory of content.opf (e.g., "OEBPS" or "")
  metadata: EpubMetadata;
  chapters: EpubChapter[];
  assets: EpubAsset[];
  tocNcxPath: string | null;
  navXhtmlPath: string | null;
  filename: string;
}

export type ViewMode = "metadata" | "editor" | "toc" | "assets" | "preview" | "search";
export type EditorTab = "visual" | "code" | "preview";
