import { createAdminClient } from "@/lib/supabase/admin";
import { generateEmbedding } from "@/lib/ai/gemini";
import type { Citation, MatchEmbeddingResult } from "@/types";

export async function searchSimilarChunks(
  userId: string,
  query: string,
  options: {
    limit?: number;
    threshold?: number;
    documentIds?: string[];
  } = {}
): Promise<MatchEmbeddingResult[]> {
  const { limit = 5, threshold = 0.5, documentIds } = options;
  const supabase = createAdminClient();
  const queryEmbedding = await generateEmbedding(query);

  const { data, error } = await supabase.rpc("match_embeddings", {
    query_embedding: queryEmbedding,
    match_user_id: userId,
    match_count: limit,
    match_threshold: threshold,
    filter_document_ids: documentIds?.length ? documentIds : null,
  });

  if (error) throw error;
  return (data || []) as MatchEmbeddingResult[];
}

export async function semanticSearch(
  userId: string,
  query: string,
  limit = 10
) {
  const supabase = createAdminClient();
  const queryEmbedding = await generateEmbedding(query);

  const { data, error } = await supabase.rpc("semantic_search", {
    query_embedding: queryEmbedding,
    match_user_id: userId,
    match_count: limit,
    match_threshold: 0.4,
  });

  if (error) throw error;
  return data || [];
}

export function buildContextFromChunks(chunks: MatchEmbeddingResult[]): string {
  return chunks
    .map(
      (chunk, i) =>
        `[Source ${i + 1}: ${chunk.document_title}, Page ${chunk.page_number || "N/A"}]\n${chunk.content}`
    )
    .join("\n\n---\n\n");
}

export function extractCitations(chunks: MatchEmbeddingResult[]): Citation[] {
  const seen = new Set<string>();
  const citations: Citation[] = [];

  for (const chunk of chunks) {
    const key = `${chunk.document_id}-${chunk.page_number}`;
    if (seen.has(key)) continue;
    seen.add(key);

    citations.push({
      documentId: chunk.document_id,
      documentTitle: chunk.document_title,
      pageNumber: chunk.page_number,
      snippet: chunk.content.slice(0, 200),
    });
  }

  return citations;
}

export async function ragQuery(
  userId: string,
  question: string,
  documentIds?: string[]
): Promise<{ answer: string; citations: Citation[]; chunks: MatchEmbeddingResult[] }> {
  const chunks = await searchSimilarChunks(userId, question, {
    limit: 6,
    threshold: 0.45,
    documentIds,
  });

  if (chunks.length === 0) {
    return {
      answer: "I couldn't find relevant information in your uploaded documents. Please upload documents related to your question or try rephrasing.",
      citations: [],
      chunks: [],
    };
  }

  const context = buildContextFromChunks(chunks);
  const citations = extractCitations(chunks);

  const { generateText } = await import("@/lib/ai/gemini");

  const systemInstruction = `You are LearnSphere AI, an educational assistant. Answer questions based ONLY on the provided context from the user's documents. Be accurate, educational, and clear. If the context doesn't contain enough information, say so. Structure your answer well with paragraphs or bullet points when appropriate.`;

  const prompt = `Context from uploaded documents:\n\n${context}\n\n---\n\nUser Question: ${question}\n\nProvide a comprehensive, educational answer based on the context above.`;

  const answer = await generateText(prompt, systemInstruction);

  return { answer, citations, chunks };
}

export async function* ragQueryStream(
  userId: string,
  question: string,
  documentIds?: string[]
): AsyncGenerator<{ type: "citations"; data: Citation[] } | { type: "text"; data: string }> {
  const chunks = await searchSimilarChunks(userId, question, {
    limit: 6,
    threshold: 0.45,
    documentIds,
  });

  const citations = extractCitations(chunks);
  yield { type: "citations", data: citations };

  if (chunks.length === 0) {
    yield {
      type: "text",
      data: "I couldn't find relevant information in your uploaded documents.",
    };
    return;
  }

  const context = buildContextFromChunks(chunks);
  const { streamText } = await import("@/lib/ai/gemini");

  const systemInstruction = `You are LearnSphere AI, an educational assistant. Answer based ONLY on the provided context. Be accurate and educational.`;

  const prompt = `Context:\n\n${context}\n\n---\n\nQuestion: ${question}`;

  for await (const text of streamText(prompt, systemInstruction)) {
    yield { type: "text", data: text };
  }
}
