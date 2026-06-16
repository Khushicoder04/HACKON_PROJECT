import { createAdminClient } from "@/lib/supabase/admin";
import { generateText } from "@/lib/ai/gemini";
import type { DailyTask, Recommendation } from "@/types";

export async function analyzePerformance(userId: string) {
  const supabase = createAdminClient();

  const [{ data: attempts }, { data: documents }, { data: progress }] =
    await Promise.all([
      supabase
        .from("quiz_attempts")
        .select("score, weak_topics, completed_at")
        .eq("user_id", userId)
        .order("completed_at", { ascending: false })
        .limit(20),
      supabase
        .from("documents")
        .select("id, title, created_at")
        .eq("user_id", userId)
        .eq("status", "ready"),
      supabase
        .from("progress_tracking")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(30),
    ]);

  const allWeakTopics: string[] = [];
  attempts?.forEach((a) => {
    if (Array.isArray(a.weak_topics)) {
      allWeakTopics.push(...a.weak_topics);
    }
  });

  const topicFrequency: Record<string, number> = {};
  allWeakTopics.forEach((t) => {
    topicFrequency[t] = (topicFrequency[t] || 0) + 1;
  });

  const sortedWeakTopics = Object.entries(topicFrequency)
    .sort(([, a], [, b]) => b - a)
    .map(([topic]) => topic);

  const avgScore =
    attempts?.length
      ? attempts.reduce((sum, a) => sum + Number(a.score), 0) / attempts.length
      : 0;

  return {
    weakTopics: sortedWeakTopics.slice(0, 5),
    averageScore: Math.round(avgScore * 100) / 100,
    totalQuizzes: attempts?.length || 0,
    totalDocuments: documents?.length || 0,
    recentProgress: progress || [],
    documents: documents || [],
  };
}

export async function generateStudyPlan(userId: string): Promise<{
  title: string;
  description: string;
  goals: string[];
  dailyTasks: DailyTask[];
  weakTopics: string[];
}> {
  const analysis = await analyzePerformance(userId);

  const prompt = `Create a personalized 7-day study plan for a student with the following profile:

- Average quiz score: ${analysis.averageScore}%
- Total quizzes taken: ${analysis.totalQuizzes}
- Weak topics: ${analysis.weakTopics.join(", ") || "None identified yet"}
- Available documents: ${analysis.documents.map((d) => d.title).join(", ") || "None"}

Return ONLY valid JSON:
{
  "title": "plan title",
  "description": "brief description",
  "goals": ["goal1", "goal2", "goal3"],
  "dailyTasks": [
    { "day": 1, "tasks": ["task1", "task2"], "topics": ["topic1"] }
  ],
  "weakTopics": ["topic1", "topic2"]
}`;

  const response = await generateText(
    prompt,
    "You are an expert learning coach. Create practical, achievable study plans."
  );

  const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned);
}

export async function generateRecommendations(userId: string): Promise<Recommendation[]> {
  const supabase = createAdminClient();
  const analysis = await analyzePerformance(userId);
  const recommendations: Omit<Recommendation, "id" | "created_at">[] = [];

  for (const topic of analysis.weakTopics.slice(0, 3)) {
    recommendations.push({
      user_id: userId,
      type: "revision",
      title: `Revise: ${topic}`,
      description: `Based on your quiz performance, ${topic} needs more practice.`,
      priority: 3,
      metadata: { topic },
      is_read: false,
    });
  }

  if (analysis.averageScore < 70 && analysis.totalQuizzes > 0) {
    recommendations.push({
      user_id: userId,
      type: "quiz",
      title: "Take a practice quiz",
      description: "Your average score suggests more practice would help strengthen your understanding.",
      priority: 2,
      metadata: { difficulty: "easy" },
      is_read: false,
    });
  }

  for (const doc of analysis.documents.slice(0, 2)) {
    recommendations.push({
      user_id: userId,
      type: "document",
      title: `Review: ${doc.title}`,
      description: "Revisit this document to reinforce your learning.",
      priority: 1,
      metadata: { documentId: doc.id },
      is_read: false,
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      user_id: userId,
      type: "topic",
      title: "Upload your first document",
      description: "Start your learning journey by uploading study materials.",
      priority: 1,
      metadata: {},
      is_read: false,
    });
  }

  await supabase.from("recommendations").delete().eq("user_id", userId).eq("is_read", false);

  const { data: inserted } = await supabase
    .from("recommendations")
    .insert(recommendations)
    .select();

  return inserted || [];
}

export async function getRecommendedTopics(userId: string): Promise<string[]> {
  const analysis = await analyzePerformance(userId);

  if (analysis.weakTopics.length > 0) {
    return analysis.weakTopics;
  }

  const supabase = createAdminClient();
  const { data: chunks } = await supabase
    .from("document_chunks")
    .select("metadata")
    .eq("user_id", userId)
    .limit(10);

  const topics = new Set<string>();
  chunks?.forEach((c) => {
    const meta = c.metadata as Record<string, string>;
    if (meta?.topic) topics.add(meta.topic);
  });

  if (topics.size === 0) {
    return ["General Studies", "Document Review", "Practice Quizzes"];
  }

  return [...topics].slice(0, 5);
}
