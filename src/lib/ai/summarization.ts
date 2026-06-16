import { createAdminClient } from "@/lib/supabase/admin";
import { generateText } from "@/lib/ai/gemini";

const SUMMARY_PROMPTS = {
  chapter: (content: string, topic?: string) =>
    `Generate a detailed chapter summary from the following content${topic ? ` focusing on "${topic}"` : ""}. Include key concepts, definitions, and important points:\n\n${content}`,
  topic: (content: string, topic?: string) =>
    `Generate a focused topic summary about "${topic || "the main topic"}" from the following content. Explain concepts clearly for a student:\n\n${content}`,
  full: (content: string) =>
    `Generate a comprehensive full document summary covering all major sections, themes, and key takeaways:\n\n${content}`,
  bullet: (content: string) =>
    `Generate concise bullet-point notes from the following content. Use clear, scannable bullet points organized by topic:\n\n${content}`,
  exam: (content: string) =>
    `Generate exam revision notes from the following content. Include key definitions, formulas, important facts, common exam questions, and memory aids:\n\n${content}`,
};

export async function generateSummary(
  userId: string,
  documentId: string,
  type: "chapter" | "topic" | "full" | "bullet" | "exam",
  topic?: string
): Promise<string> {
  const supabase = createAdminClient();

  const { data: chunks } = await supabase
    .from("document_chunks")
    .select("content, page_number")
    .eq("document_id", documentId)
    .eq("user_id", userId)
    .order("chunk_index", { ascending: true });

  if (!chunks?.length) {
    throw new Error("No content found for this document");
  }

  let content = chunks.map((c) => c.content).join("\n\n");

  if (content.length > 30000) {
    content = content.slice(0, 30000) + "\n\n[Content truncated for processing]";
  }

  const promptFn = SUMMARY_PROMPTS[type];
  const prompt = promptFn(content, topic);

  const systemInstruction =
    "You are an expert educational content summarizer. Create clear, accurate, and well-structured summaries for students. Use markdown formatting where appropriate.";

  return generateText(prompt, systemInstruction);
}

export function summaryToPdfContent(title: string, summary: string): { title: string; lines: string[] } {
  const lines = summary
    .split("\n")
    .map((line) => line.replace(/^#+\s*/, "").replace(/\*\*/g, "").replace(/^[-*]\s*/, "• "))
    .filter(Boolean);

  return { title, lines };
}
