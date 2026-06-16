import { createAdminClient } from "@/lib/supabase/admin";
import { generateEmbedding } from "@/lib/ai/gemini";
import { chunkText } from "@/lib/documents/chunk-text";
import { extractText } from "@/lib/documents/extract-text";
import { logActivity, updateDailyProgress, updateLearningStreak } from "@/lib/auth-helpers";

export async function processDocument(
  documentId: string,
  userId: string,
  buffer: Buffer,
  fileType: "pdf" | "docx" | "txt"
) {
  const supabase = createAdminClient();

  try {
    const { text, pageCount, wordCount } = await extractText(buffer, fileType);
    const chunks = chunkText(text, pageCount);

    await supabase
      .from("documents")
      .update({ page_count: pageCount, word_count: wordCount })
      .eq("id", documentId);

    for (const chunk of chunks) {
      const { data: insertedChunk, error: chunkError } = await supabase
        .from("document_chunks")
        .insert({
          document_id: documentId,
          user_id: userId,
          content: chunk.content,
          chunk_index: chunk.chunkIndex,
          page_number: chunk.pageNumber,
          token_count: chunk.tokenCount,
        })
        .select("id")
        .single();

      if (chunkError || !insertedChunk) continue;

      const embedding = await generateEmbedding(chunk.content);

      await supabase.from("embeddings").insert({
        chunk_id: insertedChunk.id,
        document_id: documentId,
        user_id: userId,
        embedding,
      });
    }

    await supabase
      .from("documents")
      .update({ status: "ready" })
      .eq("id", documentId);

    await updateLearningStreak(userId);
    await updateDailyProgress(userId, { documents_uploaded: 1 });
    await logActivity(userId, "document_processed", "document", documentId, {
      pageCount,
      wordCount,
      chunkCount: chunks.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Processing failed";
    await supabase
      .from("documents")
      .update({ status: "failed", error_message: message })
      .eq("id", documentId);
    throw error;
  }
}

export async function uploadDocument(
  userId: string,
  file: File
): Promise<{ documentId: string; storagePath: string }> {
  const supabase = createAdminClient();
  const fileType = file.name.split(".").pop()?.toLowerCase();

  if (!fileType || !["pdf", "docx", "txt"].includes(fileType)) {
    throw new Error("Unsupported file type. Please upload PDF, DOCX, or TXT.");
  }

  const storagePath = `${userId}/${Date.now()}-${file.name}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: document, error: docError } = await supabase
    .from("documents")
    .insert({
      user_id: userId,
      title: file.name.replace(/\.[^/.]+$/, ""),
      file_name: file.name,
      file_type: fileType as "pdf" | "docx" | "txt",
      file_size: file.size,
      storage_path: storagePath,
      status: "processing",
    })
    .select()
    .single();

  if (docError || !document) throw docError || new Error("Failed to create document record");

  await logActivity(userId, "document_uploaded", "document", document.id, {
    fileName: file.name,
  });

  processDocument(document.id, userId, buffer, fileType as "pdf" | "docx" | "txt").catch(
    console.error
  );

  return { documentId: document.id, storagePath };
}
