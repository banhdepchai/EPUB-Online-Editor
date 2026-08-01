import JSZip from "jszip";
import { EpubBook, EpubChapter, EpubMetadata, EpubAsset } from "../types";

// Helper to normalize path slashes
export function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\//, "");
}

// Get directory name from a path
export function getDirName(filePath: string): string {
  const norm = normalizePath(filePath);
  const idx = norm.lastIndexOf("/");
  return idx !== -1 ? norm.substring(0, idx) : "";
}

// Combine base directory with relative path
export function combinePath(baseDir: string, relPath: string): string {
  if (!baseDir) return normalizePath(relPath);
  return normalizePath(`${baseDir}/${relPath}`);
}

export async function parseEpub(file: File | ArrayBuffer, originalFilename = "book.epub"): Promise<EpubBook> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);

  // 1. Find container.xml
  const containerFile = loadedZip.file("META-INF/container.xml");
  if (!containerFile) {
    throw new Error("Tệp EPUB không hợp lệ: Không tìm thấy META-INF/container.xml");
  }

  const containerXml = await containerFile.async("text");
  const parser = new DOMParser();
  const containerDoc = parser.parseFromString(containerXml, "text/xml");
  const rootfileEl = containerDoc.querySelector("rootfile");
  if (!rootfileEl) {
    throw new Error("Tệp EPUB không hợp lệ: Không tìm thấy thẻ <rootfile> trong container.xml");
  }

  const opfPath = normalizePath(rootfileEl.getAttribute("full-path") || "content.opf");
  const baseDir = getDirName(opfPath);

  // 2. Read OPF
  const opfFile = loadedZip.file(opfPath);
  if (!opfFile) {
    throw new Error(`Không tìm thấy file OPF tại vị trí: ${opfPath}`);
  }

  const opfXml = await opfFile.async("text");
  const opfDoc = parser.parseFromString(opfXml, "text/xml");

  // Parse Metadata
  const metadataEl = opfDoc.querySelector("metadata");
  const getDc = (name: string): string => {
    if (!metadataEl) return "";
    const el =
      metadataEl.getElementsByTagNameNS("http://purl.org/dc/elements/1.1/", name)[0] ||
      metadataEl.querySelector(`dc\\:${name}, ${name}`);
    return el?.textContent?.trim() || "";
  };

  const title = getDc("title") || "Chưa có tiêu đề";
  const creator = getDc("creator") || "Chưa rõ tác giả";
  const publisher = getDc("publisher") || "";
  const language = getDc("language") || "vi";
  const identifier = getDc("identifier") || "";
  const description = getDc("description") || "";
  const rights = getDc("rights") || "";

  // Parse Manifest
  const manifestItems = Array.from(opfDoc.querySelectorAll("manifest > item"));
  const itemMap = new Map<string, { id: string; href: string; mediaType: string; properties: string }>();

  manifestItems.forEach((item) => {
    const id = item.getAttribute("id") || "";
    const href = item.getAttribute("href") || "";
    const mediaType = item.getAttribute("media-type") || "";
    const properties = item.getAttribute("properties") || "";
    if (id && href) {
      itemMap.set(id, { id, href, mediaType, properties });
    }
  });

  // Find Cover Image ID
  let coverId: string | null = null;

  // Method A: <meta name="cover" content="cover-image-id"/>
  const metaCover = metadataEl?.querySelector('meta[name="cover"]');
  if (metaCover) {
    coverId = metaCover.getAttribute("content");
  }

  // Method B: item with properties="cover-image"
  if (!coverId) {
    for (const [id, item] of itemMap.entries()) {
      if (item.properties.includes("cover-image")) {
        coverId = id;
        break;
      }
    }
  }

  // Find cover href & load cover image data
  let coverImageHref: string | null = null;
  let coverImageDataUrl: string | null = null;
  let coverImageBlob: Blob | null = null;
  let coverImageType: string | undefined;

  if (coverId && itemMap.has(coverId)) {
    const item = itemMap.get(coverId)!;
    coverImageHref = item.href;
    const coverFullPath = combinePath(baseDir, item.href);
    const coverFile = loadedZip.file(coverFullPath);
    if (coverFile) {
      coverImageType = item.mediaType || "image/jpeg";
      const base64 = await coverFile.async("base64");
      coverImageDataUrl = `data:${coverImageType};base64,${base64}`;
      const arrayBuf = await coverFile.async("arraybuffer");
      coverImageBlob = new Blob([arrayBuf], { type: coverImageType });
    }
  }

  // 3. Find NCX / Nav TOC
  let tocNcxPath: string | null = null;
  let navXhtmlPath: string | null = null;

  // Check spine toc attribute
  const spineEl = opfDoc.querySelector("spine");
  const spineTocId = spineEl?.getAttribute("toc");
  if (spineTocId && itemMap.has(spineTocId)) {
    tocNcxPath = combinePath(baseDir, itemMap.get(spineTocId)!.href);
  }

  for (const [_, item] of itemMap.entries()) {
    if (item.properties.includes("nav")) {
      navXhtmlPath = combinePath(baseDir, item.href);
    } else if (item.mediaType === "application/x-dtbncx+xml" && !tocNcxPath) {
      tocNcxPath = combinePath(baseDir, item.href);
    }
  }

  // Read TOC titles from NCX if present
  const tocTitleMap = new Map<string, string>(); // href -> title
  if (tocNcxPath) {
    const ncxFile = loadedZip.file(tocNcxPath);
    if (ncxFile) {
      const ncxXml = await ncxFile.async("text");
      const ncxDoc = parser.parseFromString(ncxXml, "text/xml");
      const navPoints = Array.from(ncxDoc.querySelectorAll("navPoint"));
      navPoints.forEach((np) => {
        const navLabel = np.querySelector("navLabel > text")?.textContent?.trim();
        const contentSrc = np.querySelector("content")?.getAttribute("src");
        if (contentSrc && navLabel) {
          // src may contain anchor e.g. chapter1.xhtml#sec1
          const cleanSrc = contentSrc.split("#")[0];
          tocTitleMap.set(cleanSrc, navLabel);
        }
      });
    }
  }

  // 4. Parse Chapters from Spine
  const spineItemrefs = Array.from(opfDoc.querySelectorAll("spine > itemref"));
  const chapters: EpubChapter[] = [];

  for (let i = 0; i < spineItemrefs.length; i++) {
    const idref = spineItemrefs[i].getAttribute("idref");
    if (!idref || !itemMap.has(idref)) continue;

    const item = itemMap.get(idref)!;
    const fullPath = combinePath(baseDir, item.href);
    const chapterFile = loadedZip.file(fullPath);

    let content = "";
    if (chapterFile) {
      content = await chapterFile.async("text");
    }

    // Determine Chapter Title
    let title = tocTitleMap.get(item.href) || "";
    if (!title) {
      // Try to parse H1 or Title from XHTML
      try {
        const doc = parser.parseFromString(content, "text/html");
        const h1 = doc.querySelector("h1, h2, h3, title");
        if (h1 && h1.textContent?.trim()) {
          title = h1.textContent.trim();
        }
      } catch (e) {
        // Fallback
      }
    }
    if (!title) {
      title = `Chương ${i + 1}`;
    }

    chapters.push({
      id: item.id,
      href: item.href,
      fullPath,
      title,
      content,
      mediaType: item.mediaType || "application/xhtml+xml",
      playOrder: i + 1,
    });
  }

  // 5. Parse Other Assets (Images, CSS, Fonts)
  const assets: EpubAsset[] = [];
  for (const [id, item] of itemMap.entries()) {
    // Skip chapters and ncx
    if (
      item.mediaType === "application/xhtml+xml" ||
      item.mediaType === "text/html" ||
      item.mediaType === "application/x-dtbncx+xml"
    ) {
      continue;
    }

    const fullPath = combinePath(baseDir, item.href);
    const assetFile = loadedZip.file(fullPath);
    if (!assetFile) continue;

    const isCover = id === coverId;
    let dataUrl: string | undefined;
    let text: string | undefined;

    if (item.mediaType.startsWith("image/")) {
      const base64 = await assetFile.async("base64");
      dataUrl = `data:${item.mediaType};base64,${base64}`;
    } else if (item.mediaType.includes("css") || item.mediaType.includes("text")) {
      text = await assetFile.async("text");
    }

    assets.push({
      id: item.id,
      href: item.href,
      fullPath,
      mediaType: item.mediaType,
      dataUrl,
      text,
      isCover,
    });
  }

  const metadata: EpubMetadata = {
    title,
    creator,
    publisher,
    language,
    identifier: identifier || `urn:uuid:${Math.random().toString(36).substring(2)}`,
    description,
    rights,
    coverImageHref,
    coverImageDataUrl,
    coverImageBlob,
    coverImageType,
  };

  return {
    rawZipAny: loadedZip,
    opfPath,
    baseDir,
    metadata,
    chapters,
    assets,
    tocNcxPath,
    navXhtmlPath,
    filename: originalFilename,
  };
}
