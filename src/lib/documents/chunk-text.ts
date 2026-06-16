export interface TextChunk {
  content: string;
  chunkIndex: number;
  pageNumber: number | null;
  tokenCount: number;
}

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

export function chunkText(
  text: string,
  pageCount: number,
  chunkSize = CHUNK_SIZE,
  overlap = CHUNK_OVERLAP
): TextChunk[] {
  const cleaned = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!cleaned) return [];

  const words = cleaned.split(/\s+/);
  const chunks: TextChunk[] = [];
  let chunkIndex = 0;

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunkWords = words.slice(i, i + chunkSize);
    const content = chunkWords.join(" ");

    if (content.trim().length < 50 && chunkIndex > 0) break;

    const progress = i / words.length;
    const pageNumber = pageCount > 1 ? Math.max(1, Math.ceil(progress * pageCount)) : 1;

    chunks.push({
      content: content.trim(),
      chunkIndex,
      pageNumber,
      tokenCount: chunkWords.length,
    });

    chunkIndex++;
    if (i + chunkSize >= words.length) break;
  }

  return chunks;
}

export function chunkByPages(text: string, pageCount: number): TextChunk[] {
  const pages = text.split(/\f|\n---+\n/);
  const chunks: TextChunk[] = [];
  let chunkIndex = 0;

  if (pages.length <= 1) {
    return chunkText(text, pageCount);
  }

  for (let pageNum = 0; pageNum < pages.length; pageNum++) {
    const pageChunks = chunkText(pages[pageNum], 1, 800, 150);
    for (const chunk of pageChunks) {
      chunks.push({
        ...chunk,
        chunkIndex,
        pageNumber: pageNum + 1,
      });
      chunkIndex++;
    }
  }

  return chunks;
}
