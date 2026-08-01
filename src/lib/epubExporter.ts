import JSZip from "jszip";
import { EpubBook, EpubChapter, EpubMetadata, EpubAsset } from "../types";
import { combinePath, normalizePath, getDirName } from "./epubParser";

export function escapeXml(unsafe: string): string {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Sanitize string into valid XML NCName (ID)
export function sanitizeXmlId(rawId: string, defaultPrefix = "item"): string {
  if (!rawId) return `${defaultPrefix}_${Math.random().toString(36).substring(2, 7)}`;
  // XML NCName must start with letter or underscore, followed by letters, digits, underscores, hyphens, dots
  let clean = rawId.replace(/[^a-zA-Z0-9_\-\.]/g, "_");
  if (/^[^a-zA-Z_]/.test(clean)) {
    clean = `${defaultPrefix}_` + clean;
  }
  return clean;
}

// Strip baseDir prefix if present so href is strictly relative to content.opf location
export function getRelHref(href: string, baseDir: string): string {
  let normHref = normalizePath(href || "");
  let normBase = normalizePath(baseDir || "");
  if (normBase && normHref.startsWith(normBase + "/")) {
    normHref = normHref.substring(normBase.length + 1);
  }
  return normHref;
}

export function ensureValidXhtml(content: string, title: string, cssRelPath = "Styles/style.css"): string {
  let bodyContent = content || "<p></p>";

  // Ensure void HTML tags are self-closing in XHTML
  bodyContent = bodyContent.replace(/<(img|br|hr|input|meta|link)([^>]*)(?<!\/)>/gi, "<$1$2 />");

  // If content is full html document, extract body content
  if (/<html[^>]*>/i.test(bodyContent) && /<body[^>]*>/i.test(bodyContent)) {
    const match = bodyContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (match) {
      bodyContent = match[1];
    }
  }

  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="vi">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <title>${escapeXml(title)}</title>
  <link rel="stylesheet" type="text/css" href="${escapeXml(cssRelPath)}" />
</head>
<body>
${bodyContent}
</body>
</html>`;
}

export async function exportEpubBlob(book: EpubBook): Promise<Blob> {
  const zip = new JSZip();

  // 1. mimetype (MUST BE FIRST, UNCOMPRESSED / STORE mode)
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

  const rawOpfPath = normalizePath(book.opfPath || "OEBPS/content.opf");
  const baseDir = getDirName(rawOpfPath); // e.g. "OEBPS" or ""
  const opfPath = rawOpfPath;

  // 2. META-INF/container.xml
  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="${opfPath}" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
  zip.file("META-INF/container.xml", containerXml);

  const usedXmlIds = new Set<string>();
  const manifestItems: string[] = [];
  const chapterManifestItems: string[] = [];
  const spineItems: string[] = [];

  // Cover Image Asset Setup
  let coverAsset = book.assets.find((a) => a.isCover);
  let coverId = coverAsset ? sanitizeXmlId(coverAsset.id, "cover") : "cover_image";
  let coverRelHref = coverAsset ? getRelHref(coverAsset.href, baseDir) : "Images/cover.jpg";

  while (usedXmlIds.has(coverId)) {
    coverId = `${coverId}_img`;
  }
  usedXmlIds.add(coverId);

  // Write Cover Image to Zip if dataUrl exists
  if (book.metadata.coverImageDataUrl) {
    const fullCoverPath = combinePath(baseDir, coverRelHref);
    const base64Data = book.metadata.coverImageDataUrl.split(",")[1];
    if (base64Data) {
      zip.file(fullCoverPath, base64Data, { base64: true });
    }
  }

  if (book.metadata.coverImageDataUrl || coverAsset) {
    const mime = book.metadata.coverImageType || coverAsset?.mediaType || "image/jpeg";
    manifestItems.push(
      `    <item id="${coverId}" href="${escapeXml(coverRelHref)}" media-type="${mime}" properties="cover-image"/>`
    );
  }

  // Stylesheet Setup
  const cssRelHref = "Styles/style.css";
  let cssId = "style_css";
  while (usedXmlIds.has(cssId)) {
    cssId = `${cssId}_1`;
  }
  usedXmlIds.add(cssId);
  manifestItems.push(`    <item id="${cssId}" href="${escapeXml(cssRelHref)}" media-type="text/css"/>`);

  // Chapters Processing (Guarantee at least 1 chapter)
  const chaptersToExport =
    book.chapters.length > 0
      ? book.chapters
      : [
          {
            id: "chapter_1",
            href: "Text/chapter_1.xhtml",
            fullPath: combinePath(baseDir, "Text/chapter_1.xhtml"),
            title: book.metadata.title || "Chương 1",
            content: "<h1>Chương 1</h1>\n<p>Nội dung sách...</p>",
            mediaType: "application/xhtml+xml",
            playOrder: 1,
          },
        ];

  chaptersToExport.forEach((ch, idx) => {
    let rawId = ch.id || `chapter_${idx + 1}`;
    let chId = sanitizeXmlId(rawId, "chap");
    while (usedXmlIds.has(chId)) {
      chId = `${chId}_${idx + 1}`;
    }
    usedXmlIds.add(chId);

    let rawHref = ch.href || `Text/chapter_${idx + 1}.xhtml`;
    let relHref = getRelHref(rawHref, baseDir);
    if (!relHref) relHref = `Text/chapter_${idx + 1}.xhtml`;

    chapterManifestItems.push(
      `    <item id="${chId}" href="${escapeXml(relHref)}" media-type="application/xhtml+xml"/>`
    );
    spineItems.push(`    <itemref idref="${chId}"/>`);

    // Depth calculation for CSS path
    const depth = relHref.split("/").length - 1;
    const cssRelPath = depth > 0 ? "../".repeat(depth) + cssRelHref : cssRelHref;

    const formattedContent = ensureValidXhtml(ch.content, ch.title, cssRelPath);
    const fullChZipPath = combinePath(baseDir, relHref);
    zip.file(fullChZipPath, formattedContent);
  });

  // NCX (EPUB2)
  const ncxRelHref = "toc.ncx";
  let ncxId = "ncx";
  while (usedXmlIds.has(ncxId)) {
    ncxId = `${ncxId}_toc`;
  }
  usedXmlIds.add(ncxId);
  manifestItems.push(
    `    <item id="${ncxId}" href="${escapeXml(ncxRelHref)}" media-type="application/x-dtbncx+xml"/>`
  );

  // NAV XHTML (EPUB3)
  const navRelHref = "nav.xhtml";
  let navId = "nav";
  while (usedXmlIds.has(navId)) {
    navId = `${navId}_toc`;
  }
  usedXmlIds.add(navId);
  manifestItems.push(
    `    <item id="${navId}" href="${escapeXml(navRelHref)}" media-type="application/xhtml+xml" properties="nav"/>`
  );

  // Process Other Assets (Images, Fonts, Extra CSS)
  for (const asset of book.assets) {
    if (asset.isCover) continue;
    let relHref = getRelHref(asset.href, baseDir);
    if (!relHref) continue;

    if (
      relHref === cssRelHref ||
      relHref === ncxRelHref ||
      relHref === navRelHref ||
      asset.mediaType === "application/x-dtbncx+xml"
    ) {
      continue;
    }

    let assetId = sanitizeXmlId(asset.id, "asset");
    while (usedXmlIds.has(assetId)) {
      assetId = `${assetId}_file`;
    }
    usedXmlIds.add(assetId);

    manifestItems.push(
      `    <item id="${assetId}" href="${escapeXml(relHref)}" media-type="${escapeXml(asset.mediaType)}"/>`
    );

    const fullAssetZipPath = combinePath(baseDir, relHref);
    if (asset.dataUrl) {
      const base64 = asset.dataUrl.split(",")[1];
      if (base64) {
        zip.file(fullAssetZipPath, base64, { base64: true });
      }
    } else if (asset.text) {
      zip.file(fullAssetZipPath, asset.text);
    } else if (book.rawZipAny) {
      const origFile = book.rawZipAny.file(asset.fullPath || combinePath(baseDir, relHref));
      if (origFile) {
        const ab = await origFile.async("arraybuffer");
        zip.file(fullAssetZipPath, ab);
      }
    }
  }

  // Write Stylesheet File to Zip
  const cssFullPath = combinePath(baseDir, cssRelHref);
  const cssAsset = book.assets.find((a) => getRelHref(a.href, baseDir) === cssRelHref || a.href.endsWith(".css"));
  const cssContent =
    cssAsset?.text ||
    `@charset "utf-8";
body {
  font-family: serif, "Times New Roman", Georgia;
  line-height: 1.6;
  margin: 1em 1.5em;
  color: #1a1a1a;
}
h1, h2, h3 {
  font-family: sans-serif, "Helvetica Neue", Arial;
  text-align: center;
  color: #111827;
  margin-top: 1.5em;
  margin-bottom: 0.8em;
}
p {
  text-indent: 1.5em;
  margin-bottom: 0.5em;
  text-align: justify;
}
blockquote {
  font-style: italic;
  margin: 1em 2em;
  padding-left: 1em;
  border-left: 3px solid #cbd5e1;
}
.cover-img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 0 auto;
}
`;
  zip.file(cssFullPath, cssContent);

  // Generate TOC NCX File
  const navPointsXml = chaptersToExport
    .map((ch, idx) => {
      let relHref = getRelHref(ch.href || `Text/chapter_${idx + 1}.xhtml`, baseDir);
      return `    <navPoint id="navPoint-${idx + 1}" playOrder="${idx + 1}">
      <navLabel>
        <text>${escapeXml(ch.title)}</text>
      </navLabel>
      <content src="${escapeXml(relHref)}"/>
    </navPoint>`;
    })
    .join("\n");

  const ncxXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//xmlns/" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${escapeXml(book.metadata.identifier || "urn:uuid:book-id")}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${escapeXml(book.metadata.title)}</text>
  </docTitle>
  <navMap>
${navPointsXml}
  </navMap>
</ncx>`;

  zip.file(combinePath(baseDir, ncxRelHref), ncxXml);

  // Generate NAV XHTML File
  const navOlItems = chaptersToExport
    .map((ch, idx) => {
      let relHref = getRelHref(ch.href || `Text/chapter_${idx + 1}.xhtml`, baseDir);
      return `      <li><a href="${escapeXml(relHref)}">${escapeXml(ch.title)}</a></li>`;
    })
    .join("\n");

  const navXhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>Mục lục - ${escapeXml(book.metadata.title)}</title>
  <link rel="stylesheet" type="text/css" href="${escapeXml(cssRelHref)}"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Mục lục</h1>
    <ol>
${navOlItems}
    </ol>
  </nav>
</body>
</html>`;

  zip.file(combinePath(baseDir, navRelHref), navXhtml);

  // Generate content.opf File
  const opfContent = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeXml(book.metadata.title)}</dc:title>
    <dc:creator>${escapeXml(book.metadata.creator)}</dc:creator>
    <dc:publisher>${escapeXml(book.metadata.publisher)}</dc:publisher>
    <dc:language>${escapeXml(book.metadata.language || "vi")}</dc:language>
    <dc:identifier id="BookId">${escapeXml(book.metadata.identifier || "urn:uuid:book-id")}</dc:identifier>
    <dc:description>${escapeXml(book.metadata.description)}</dc:description>
    <dc:rights>${escapeXml(book.metadata.rights)}</dc:rights>
    <meta name="cover" content="${coverId}"/>
    <meta property="dcterms:modified">${new Date().toISOString().split(".")[0]}Z</meta>
  </metadata>
  <manifest>
${manifestItems.concat(chapterManifestItems).join("\n")}
  </manifest>
  <spine toc="${ncxId}">
${spineItems.join("\n")}
  </spine>
</package>`;

  zip.file(opfPath, opfContent);

  // Generate ZIP blob in deflate mode with store mimetype
  const zipBlob = await zip.generateAsync({
    type: "blob",
    mimeType: "application/epub+zip",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });

  return zipBlob;
}

export function downloadEpubFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".epub") ? filename : `${filename}.epub`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
