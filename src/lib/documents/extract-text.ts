import pdf from "pdf-parse";

export async function extractTextFromPdf(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
  const data = await pdf(buffer);
  return {
    text: data.text,
    pageCount: data.numpages,
  };
}

export async function extractTextFromDocx(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  const wordCount = result.value.split(/\s+/).length;
  const estimatedPages = Math.max(1, Math.ceil(wordCount / 300));
  return {
    text: result.value,
    pageCount: estimatedPages,
  };
}

export function extractTextFromTxt(buffer: Buffer): { text: string; pageCount: number } {
  const text = buffer.toString("utf-8");
  const wordCount = text.split(/\s+/).length;
  const estimatedPages = Math.max(1, Math.ceil(wordCount / 300));
  return { text, pageCount: estimatedPages };
}

export async function extractText(
  buffer: Buffer,
  fileType: "pdf" | "docx" | "txt"
): Promise<{ text: string; pageCount: number; wordCount: number }> {
  let result: { text: string; pageCount: number };

  switch (fileType) {
    case "pdf":
      result = await extractTextFromPdf(buffer);
      break;
    case "docx":
      result = await extractTextFromDocx(buffer);
      break;
    case "txt":
      result = extractTextFromTxt(buffer);
      break;
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }

  const wordCount = result.text.split(/\s+/).filter(Boolean).length;
  return { ...result, wordCount };
}

export function getFileType(fileName: string): "pdf" | "docx" | "txt" | null {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "docx") return "docx";
  if (ext === "txt") return "txt";
  return null;
}
