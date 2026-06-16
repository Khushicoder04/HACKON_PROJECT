import { createAdminClient } from "@/lib/supabase/admin";
import { generateText } from "@/lib/ai/gemini";
import type { Question, QuizGenerateRequest } from "@/types";

interface GeneratedQuestion {
  question_type: Question["question_type"];
  question_text: string;
  options: string[] | null;
  correct_answer: string;
  explanation: string;
  topic: string;
}

export async function generateQuiz(
  userId: string,
  request: QuizGenerateRequest
): Promise<{ quizId: string; questions: Question[] }> {
  const supabase = createAdminClient();

  const { data: chunks } = await supabase
    .from("document_chunks")
    .select("content")
    .eq("document_id", request.documentId)
    .eq("user_id", userId)
    .order("chunk_index", { ascending: true })
    .limit(20);

  if (!chunks?.length) {
    throw new Error("No content found for quiz generation");
  }

  const content = chunks.map((c) => c.content).join("\n\n").slice(0, 25000);
  const typesStr = request.questionTypes.join(", ");

  const prompt = `Based on the following educational content, generate exactly ${request.questionCount} quiz questions.

Requirements:
- Difficulty: ${request.difficulty}
- Question types to use: ${typesStr}
${request.topic ? `- Focus topic: ${request.topic}` : ""}
- Mix question types evenly
- Each question must have a clear correct answer and explanation

Content:
${content}

Return ONLY valid JSON array with this structure:
[
  {
    "question_type": "mcq" | "true_false" | "fill_blank" | "short_answer",
    "question_text": "question here",
    "options": ["A", "B", "C", "D"] or null for non-mcq,
    "correct_answer": "answer",
    "explanation": "why this is correct",
    "topic": "topic name"
  }
]`;

  const systemInstruction =
    "You are an expert quiz generator for educational content. Return ONLY valid JSON, no markdown code blocks.";

  const response = await generateText(prompt, systemInstruction);
  const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  let generated: GeneratedQuestion[];
  try {
    generated = JSON.parse(cleaned);
  } catch {
    throw new Error("Failed to parse generated quiz questions");
  }

  const { data: doc } = await supabase
    .from("documents")
    .select("title")
    .eq("id", request.documentId)
    .single();

  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .insert({
      user_id: userId,
      document_id: request.documentId,
      title: `Quiz: ${doc?.title || "Document"}${request.topic ? ` - ${request.topic}` : ""}`,
      topic: request.topic || null,
      difficulty: request.difficulty,
      question_count: generated.length,
    })
    .select()
    .single();

  if (quizError || !quiz) throw quizError || new Error("Failed to create quiz");

  const questionsToInsert = generated.map((q, index) => ({
    quiz_id: quiz.id,
    question_type: q.question_type,
    question_text: q.question_text,
    options: q.options,
    correct_answer: q.correct_answer,
    explanation: q.explanation,
    difficulty: request.difficulty,
    topic: q.topic,
    order_index: index,
  }));

  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .insert(questionsToInsert)
    .select();

  if (questionsError) throw questionsError;

  return { quizId: quiz.id, questions: questions || [] };
}

export async function evaluateQuiz(
  userId: string,
  quizId: string,
  answers: { questionId: string; answer: string }[],
  timeTakenSeconds?: number
) {
  const supabase = createAdminClient();

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("quiz_id", quizId)
    .order("order_index");

  if (!questions?.length) throw new Error("Quiz not found");

  const evaluatedAnswers = questions.map((q) => {
    const userAnswer = answers.find((a) => a.questionId === q.id)?.answer || "";
    const normalizedUser = userAnswer.trim().toLowerCase();
    const normalizedCorrect = q.correct_answer.trim().toLowerCase();
    const isCorrect =
      normalizedUser === normalizedCorrect ||
      normalizedCorrect.includes(normalizedUser) ||
      (q.question_type === "short_answer" && normalizedUser.length > 3 &&
        calculateSimilarity(normalizedUser, normalizedCorrect) > 0.7);

    return {
      questionId: q.id,
      userAnswer,
      isCorrect,
      correctAnswer: q.correct_answer,
      explanation: q.explanation,
    };
  });

  const correctCount = evaluatedAnswers.filter((a) => a.isCorrect).length;
  const wrongCount = evaluatedAnswers.length - correctCount;
  const score = Math.round((correctCount / evaluatedAnswers.length) * 100 * 100) / 100;

  const weakTopics = evaluatedAnswers
    .filter((a) => !a.isCorrect)
    .map((a) => {
      const q = questions.find((q) => q.id === a.questionId);
      return q?.topic;
    })
    .filter(Boolean) as string[];

  const uniqueWeakTopics = [...new Set(weakTopics)];

  const { data: attempt, error } = await supabase
    .from("quiz_attempts")
    .insert({
      quiz_id: quizId,
      user_id: userId,
      score,
      total_questions: evaluatedAnswers.length,
      correct_count: correctCount,
      wrong_count: wrongCount,
      answers: evaluatedAnswers,
      weak_topics: uniqueWeakTopics,
      time_taken_seconds: timeTakenSeconds,
    })
    .select()
    .single();

  if (error) throw error;

  return { attempt, evaluatedAnswers, score, correctCount, wrongCount, weakTopics: uniqueWeakTopics };
}

function calculateSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.split(/\s+/));
  const wordsB = new Set(b.split(/\s+/));
  const intersection = [...wordsA].filter((w) => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : intersection / union;
}
