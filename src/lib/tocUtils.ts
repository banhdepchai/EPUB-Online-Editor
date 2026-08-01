import { EpubChapter } from "../types";

export interface ParsedChapterTitle {
  prefix: string;
  num: number | null;
  separator: string;
  subtitle: string;
  fullOriginal: string;
  hasSpacesInNum: boolean;
  rawNumStr: string | null;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Extracts prefix, chapter number (handling spaces in numbers like "5 0" -> 50), separator and subtitle.
 * Examples:
 * - "Chương 5 0: Khởi đầu" -> { prefix: "Chương ", num: 50, hasSpacesInNum: true, rawNumStr: "5 0", separator: ": ", subtitle: "Khởi đầu" }
 * - "Chương 1: Khởi đầu" -> { prefix: "Chương ", num: 1, hasSpacesInNum: false, rawNumStr: "1", separator: ": ", subtitle: "Khởi đầu" }
 * - "5 0. Cuộc chiến" -> { prefix: "", num: 50, hasSpacesInNum: true, rawNumStr: "5 0", separator: ". ", subtitle: "Cuộc chiến" }
 */
export function parseChapterTitle(title: string): ParsedChapterTitle {
  const cleanTitle = (title || "").trim();

  // Pattern 1: Keywords like "Chương", "Chapter", "Hồi", "Bài", "Tập", "Phần", "Quyển" followed by number (possibly spaced like 5 0)
  const matchKeyword = cleanTitle.match(
    /^(Chương|Chapter|Hồi|Bài|Tập|Phần|Quyển)\s*(\d(?:\s*\d)*)([\s:\-\.]*)(.*)$/i
  );
  if (matchKeyword) {
    const rawNumStr = matchKeyword[2];
    const cleanedNumStr = rawNumStr.replace(/\s+/g, "");
    const parsedNum = parseInt(cleanedNumStr, 10);
    const hasSpacesInNum = rawNumStr !== cleanedNumStr;

    return {
      prefix: `${matchKeyword[1]} `,
      num: isNaN(parsedNum) ? null : parsedNum,
      separator: matchKeyword[3] || ": ",
      subtitle: matchKeyword[4]?.trim() || "",
      fullOriginal: cleanTitle,
      hasSpacesInNum,
      rawNumStr,
    };
  }

  // Pattern 2: Starting number like "5 0. Subtitle" or "1 - Subtitle"
  const matchNumberStart = cleanTitle.match(/^(\d(?:\s*\d)*)([\s:\-\.]+)(.*)$/);
  if (matchNumberStart) {
    const rawNumStr = matchNumberStart[1];
    const cleanedNumStr = rawNumStr.replace(/\s+/g, "");
    const parsedNum = parseInt(cleanedNumStr, 10);
    const hasSpacesInNum = rawNumStr !== cleanedNumStr;

    return {
      prefix: "",
      num: isNaN(parsedNum) ? null : parsedNum,
      separator: matchNumberStart[2] || ". ",
      subtitle: matchNumberStart[3]?.trim() || "",
      fullOriginal: cleanTitle,
      hasSpacesInNum,
      rawNumStr,
    };
  }

  // Pattern 3: Embedded number like "Hồi thứ 5 0: ..."
  const matchEmbedded = cleanTitle.match(/^(.*?\D)(\d(?:\s*\d)*)([\s:\-\.]*)(.*)$/);
  if (matchEmbedded) {
    const rawNumStr = matchEmbedded[2];
    const cleanedNumStr = rawNumStr.replace(/\s+/g, "");
    const parsedNum = parseInt(cleanedNumStr, 10);
    const hasSpacesInNum = rawNumStr !== cleanedNumStr;

    return {
      prefix: matchEmbedded[1],
      num: isNaN(parsedNum) ? null : parsedNum,
      separator: matchEmbedded[3] || ": ",
      subtitle: matchEmbedded[4]?.trim() || "",
      fullOriginal: cleanTitle,
      hasSpacesInNum,
      rawNumStr,
    };
  }

  return {
    prefix: "Chương ",
    num: null,
    separator: ": ",
    subtitle: cleanTitle,
    fullOriginal: cleanTitle,
    hasSpacesInNum: false,
    rawNumStr: null,
  };
}

/**
 * Reconstructs a chapter title from components
 */
export function buildChapterTitle(
  prefix: string,
  newNum: number,
  separator: string,
  subtitle: string,
  padZeros: boolean = false
): string {
  const numStr = padZeros && newNum < 10 ? `0${newNum}` : `${newNum}`;
  const cleanPrefix = prefix !== undefined ? prefix : "Chương ";
  if (subtitle) {
    const sep = separator || ": ";
    return `${cleanPrefix}${numStr}${sep}${subtitle}`;
  } else {
    return `${cleanPrefix}${numStr}`;
  }
}

/**
 * Finds the index of the Table of Contents (Mục lục) chapter or initial front-matter in a list of chapters.
 * Returns -1 if no TOC chapter is found.
 */
export function findTocChapterIndex(chapters: EpubChapter[]): number {
  if (!chapters || chapters.length === 0) return -1;

  for (let i = 0; i < chapters.length; i++) {
    const title = (chapters[i].title || "").toLowerCase().trim();
    const href = (chapters[i].href || "").toLowerCase().trim();
    if (
      /^(mục\s*lục|table\s*of\s*contents|danh\s*mục\s*chương|toc)$/i.test(title) ||
      /mục\s*lục|table\s*of\s*contents/i.test(title) ||
      /toc\.xhtml|nav\.xhtml|toc\.ncx|toc\.html/i.test(href)
    ) {
      return i;
    }
  }

  return -1;
}

/**
 * Updates heading tag <h1>, <h2>, <h3>, <h4> inside chapter XHTML content so its text matches newTitle
 */
export function updateXhtmlHeading(
  content: string,
  _oldNumStr: string | number | null = null,
  _newNum: number = 0,
  newTitle: string
): string {
  if (!content) return content;

  let hasHeading = false;
  // Match any heading <h1-4> tag (including <h4>) inside the XHTML content
  let updated = content.replace(
    /<h([1-4])([^>]*)>([\s\S]*?)<\/h\1>/i,
    (_match, level, attrs) => {
      hasHeading = true;
      return `<h${level}${attrs}>${newTitle}</h${level}>`;
    }
  );

  // Fallback: if no <h1-4> heading tag was present, insert <h4>${newTitle}</h4> inside <body>
  if (!hasHeading && /<body[^>]*>/i.test(updated)) {
    updated = updated.replace(/(<body[^>]*>)/i, `$1\n  <h4>${newTitle}</h4>`);
  }

  return updated;
}

/**
 * Synchronizes heading tags (<h1-4>, especially <h4>) inside each chapter's XHTML content
 * so that they match the chapter's title in the Table of Contents.
 */
export function syncAllHeadingsWithToc(chapters: EpubChapter[]): {
  updatedChapters: EpubChapter[];
  updatedCount: number;
} {
  let updatedCount = 0;
  const updatedChapters = chapters.map((ch) => {
    const newContent = updateXhtmlHeading(ch.content, null, 0, ch.title);
    if (newContent !== ch.content) {
      updatedCount++;
      return { ...ch, content: newContent };
    }
    return ch;
  });
  return { updatedChapters, updatedCount };
}

/**
 * First removes any spaces inside chapter numbers (e.g. "5 0" -> 50),
 * and then automatically renumbers (+1) any duplicate or out-of-order chapter numbers,
 * starting from chapters following the Table of Contents (Mục lục).
 */
export function fixDuplicateChapterNumbers(
  chapters: EpubChapter[],
  updateXhtml: boolean = true,
  startAfterToc: boolean = true
): {
  updatedChapters: EpubChapter[];
  changesCount: number;
  duplicateDetails: string[];
  spacedCount: number;
} {
  let changesCount = 0;
  let spacedCount = 0;
  let lastNum = 0;
  const seenNums = new Set<number>();
  const duplicateDetails: string[] = [];

  const tocIdx = startAfterToc ? findTocChapterIndex(chapters) : -1;
  const startIdx = tocIdx !== -1 ? tocIdx + 1 : 0;

  // Step 1: Normalize spaced chapter numbers first (e.g. "5 0" -> 50)
  const normalizedChapters = chapters.map((ch, idx) => {
    if (idx < startIdx) return ch; // Skip front matter/TOC

    const parsed = parseChapterTitle(ch.title);

    if (parsed.hasSpacesInNum && parsed.num !== null) {
      spacedCount++;
      const cleanedTitle = buildChapterTitle(
        parsed.prefix,
        parsed.num,
        parsed.separator,
        parsed.subtitle
      );

      let newContent = ch.content;
      if (updateXhtml) {
        newContent = updateXhtmlHeading(
          ch.content,
          parsed.rawNumStr,
          parsed.num,
          cleanedTitle
        );
      }

      return {
        ...ch,
        title: cleanedTitle,
        content: newContent,
      };
    }

    return ch;
  });

  // Step 2: Fix duplicate & out-of-order chapter numbers (+1 increment)
  const updatedChapters = normalizedChapters.map((ch, idx) => {
    if (idx < startIdx) {
      // Still sync heading in XHTML for front-matter / TOC if updateXhtml is true
      if (updateXhtml) {
        const newContent = updateXhtmlHeading(ch.content, null, 0, ch.title);
        return { ...ch, content: newContent };
      }
      return ch;
    }

    const parsed = parseChapterTitle(ch.title);

    if (parsed.num === null) {
      if (updateXhtml) {
        const newContent = updateXhtmlHeading(ch.content, null, 0, ch.title);
        return { ...ch, content: newContent };
      }
      return ch;
    }

    const currentNum = parsed.num;
    let newNum = currentNum;

    // Check if duplicate, <= lastNum, or jump >= 2 from lastNum
    if (seenNums.has(currentNum) || currentNum <= lastNum || currentNum >= lastNum + 2) {
      newNum = lastNum + 1;
    }

    lastNum = newNum;
    seenNums.add(newNum);

    const newTitle = buildChapterTitle(
      parsed.prefix,
      newNum,
      parsed.separator,
      parsed.subtitle
    );

    let newContent = ch.content;
    if (updateXhtml) {
      newContent = updateXhtmlHeading(
        ch.content,
        parsed.rawNumStr || currentNum,
        newNum,
        newTitle
      );
    }

    if (newNum !== currentNum || newTitle !== ch.title || newContent !== ch.content) {
      if (newNum !== currentNum) {
        changesCount++;
        duplicateDetails.push(`"${ch.title}" ➔ "${newTitle}"`);
      }

      return {
        ...ch,
        title: newTitle,
        content: newContent,
      };
    }

    return ch;
  });

  return {
    updatedChapters,
    changesCount: changesCount + spacedCount,
    duplicateDetails,
    spacedCount,
  };
}

/**
 * Sequential renumbering of chapters, starting numbering from the chapter following the Table of Contents (Mục lục).
 */
export function renumberAllChapters(
  chapters: EpubChapter[],
  options: {
    prefix?: string;
    startNum?: number;
    padZeros?: boolean;
    keepSubtitles?: boolean;
    updateXhtml?: boolean;
    startAfterToc?: boolean;
  } = {}
): { updatedChapters: EpubChapter[]; changesCount: number; tocIndex: number } {
  const {
    prefix = "Chương ",
    startNum = 1,
    padZeros = false,
    keepSubtitles = true,
    updateXhtml = true,
    startAfterToc = true,
  } = options;

  let changesCount = 0;
  const tocIndex = startAfterToc ? findTocChapterIndex(chapters) : -1;
  const startIdx = tocIndex !== -1 ? tocIndex + 1 : 0;

  const updatedChapters = chapters.map((ch, idx) => {
    // Front matter / TOC chapters before startIdx
    if (idx < startIdx) {
      let newContent = ch.content;
      if (updateXhtml) {
        newContent = updateXhtmlHeading(ch.content, null, 0, ch.title);
      }
      if (newContent !== ch.content) {
        changesCount++;
      }
      return { ...ch, content: newContent };
    }

    // Story chapters starting after TOC
    const storyIdx = idx - startIdx;
    const targetNum = startNum + storyIdx;
    const parsed = parseChapterTitle(ch.title);
    const subtitle = keepSubtitles ? parsed.subtitle : "";

    const newTitle = buildChapterTitle(
      prefix,
      targetNum,
      subtitle ? ": " : "",
      subtitle,
      padZeros
    );

    let newContent = ch.content;
    if (updateXhtml) {
      newContent = updateXhtmlHeading(
        ch.content,
        parsed.rawNumStr || parsed.num,
        targetNum,
        newTitle
      );
    }

    if (newTitle !== ch.title || newContent !== ch.content) {
      changesCount++;
    }

    return {
      ...ch,
      title: newTitle,
      content: newContent,
    };
  });

  return { updatedChapters, changesCount, tocIndex };
}

/**
 * Copies XHTML content from a reference chapter and strips out all <p>...</p> tags and their contents.
 * Updates <h1>..<h3> headings and <title> tag with newTitle.
 */
export function createChapterXhtmlFromPrevious(
  prevContent: string,
  newTitle: string
): string {
  if (!prevContent || !prevContent.trim()) {
    return `<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${newTitle}</title>
</head>
<body>
  <h1>${newTitle}</h1>
</body>
</html>`;
  }

  // 1. Remove all <p ...>...</p> tags and their contents (case-insensitive, multiline)
  let cleaned = prevContent.replace(/<p\b[^>]*>[\s\S]*?<\/p>/gi, "");
  // Remove self-closing <p ... /> tags
  cleaned = cleaned.replace(/<p\b[^>]*\/>/gi, "");

  // 2. Update heading <h1-3> if present
  let hasHeading = false;
  cleaned = cleaned.replace(/<h([1-3])([^>]*)>([\s\S]*?)<\/h\1>/i, (match, level, attrs) => {
    hasHeading = true;
    return `<h${level}${attrs}>${newTitle}</h${level}>`;
  });

  // If no heading was found in body, insert standard <h1> if <body> exists
  if (!hasHeading && /<body[^>]*>/i.test(cleaned)) {
    cleaned = cleaned.replace(/(<body[^>]*>)/i, `$1\n  <h1>${newTitle}</h1>`);
  }

  // 3. Update <title> in <head> if present
  cleaned = cleaned.replace(/<title>[\s\S]*?<\/title>/i, `<title>${newTitle}</title>`);

  // 4. Collapse multiple blank lines down to maximum 2 blank lines
  cleaned = cleaned.replace(/(\r?\n\s*){3,}/g, "\n\n");

  return cleaned;
}

/**
 * Finds the last sequence of digits in a string and increments it by `incrementBy`.
 * Preserves leading zero padding if applicable (e.g., "P1C1" + 1 -> "P1C2", "09" + 1 -> "10", "P1C01" + 1 -> "P1C02").
 */
export function incrementLastNumberInString(
  str: string,
  incrementBy: number = 1
): string {
  if (!str) return `chapter_${incrementBy}`;

  const match = str.match(/^(.*?)(\d+)(\D*)$/);
  if (match) {
    const prefix = match[1];
    const numStr = match[2];
    const suffix = match[3];
    const newNum = parseInt(numStr, 10) + incrementBy;
    const paddedNum = String(Math.max(0, newNum)).padStart(numStr.length, "0");
    return `${prefix}${paddedNum}${suffix}`;
  }

  return `${str}_${incrementBy}`;
}

/**
 * Generates a unique ID and Href for a new chapter based on the previous chapter's ID and Href.
 * Increments the last number in the preceding chapter's ID (e.g. P1C1 -> P1C2) and updates the HTML file name similarly.
 */
export function generateNextChapterIdAndHref(
  prevChapter: EpubChapter | null,
  insertIndex: number,
  existingChapters: EpubChapter[]
): { newId: string; newHref: string } {
  const existingIds = new Set(existingChapters.map((c) => c.id));
  const existingHrefs = new Set(existingChapters.map((c) => c.href));

  // 1. Generate unique ID (e.g. P1C1 -> P1C2)
  let attemptId = "";
  if (prevChapter?.id) {
    let inc = 1;
    attemptId = incrementLastNumberInString(prevChapter.id, inc);
    while (existingIds.has(attemptId) && inc < 1000) {
      inc++;
      attemptId = incrementLastNumberInString(prevChapter.id, inc);
    }
  } else {
    attemptId = `chapter_${insertIndex + 1}`;
    let inc = 1;
    while (existingIds.has(attemptId) && inc < 1000) {
      inc++;
      attemptId = `chapter_${insertIndex + 1}_${inc}`;
    }
  }

  // 2. Generate unique Href (e.g. Text/P1C1.xhtml -> Text/P1C2.xhtml)
  let attemptHref = "";
  if (prevChapter?.href) {
    const lastSlash = prevChapter.href.lastIndexOf("/");
    const dir = lastSlash !== -1 ? prevChapter.href.substring(0, lastSlash + 1) : "";
    const fileWithExt = lastSlash !== -1 ? prevChapter.href.substring(lastSlash + 1) : prevChapter.href;
    const lastDot = fileWithExt.lastIndexOf(".");
    const ext = lastDot !== -1 ? fileWithExt.substring(lastDot) : ".xhtml";
    const fileBase = lastDot !== -1 ? fileWithExt.substring(0, lastDot) : fileWithExt;

    let inc = 1;
    const candidateBase = incrementLastNumberInString(fileBase, inc);
    attemptHref = `${dir}${candidateBase}${ext}`;

    while (existingHrefs.has(attemptHref) && inc < 1000) {
      inc++;
      const nextCandidateBase = incrementLastNumberInString(fileBase, inc);
      attemptHref = `${dir}${nextCandidateBase}${ext}`;
    }
  } else {
    attemptHref = `Text/${attemptId}.xhtml`;
    let inc = 1;
    while (existingHrefs.has(attemptHref) && inc < 1000) {
      inc++;
      attemptHref = `Text/${attemptId}_${inc}.xhtml`;
    }
  }

  return { newId: attemptId, newHref: attemptHref };
}

/**
 * Extracts clean HTML content inside <body>...</body> for visual editing and reader preview,
 * removing document wrappers (<?xml...>, <html>, <head>, <title>, <body>) that can cause display artifacts like top title boxes.
 */
export function extractChapterBodyHtml(content: string): string {
  if (!content) return "";

  // If it contains a <body>...</body> tag
  if (/<body[^>]*>/i.test(content) && /<\/body>/i.test(content)) {
    const match = content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (match && match[1] !== undefined) {
      return match[1].trim();
    }
  }

  // Fallback: Strip out <?xml...>, <!DOCTYPE...>, <head>...</head>, <html>, </html>, <body>, </body>
  let clean = content;
  clean = clean.replace(/<\?xml[^>]*\?>/gi, "");
  clean = clean.replace(/<!DOCTYPE[^>]*>/gi, "");
  clean = clean.replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, "");
  clean = clean.replace(/<\/?html\b[^>]*>/gi, "");
  clean = clean.replace(/<\/?body\b[^>]*>/gi, "");

  return clean.trim();
}

/**
 * Updates full XHTML document content with new body HTML from visual editor,
 * maintaining <head> and <title> structure if present.
 */
export function updateChapterBodyHtml(
  fullContent: string,
  newBodyHtml: string,
  title?: string
): string {
  if (!fullContent || !/<body[^>]*>/i.test(fullContent)) {
    return newBodyHtml;
  }

  let updated = fullContent.replace(
    /(<body[^>]*>)([\s\S]*?)(<\/body>)/i,
    `$1\n${newBodyHtml}\n$3`
  );

  if (title) {
    updated = updated.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
  }

  return updated;
}


