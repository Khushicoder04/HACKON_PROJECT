import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTodayDateString } from "@/lib/utils";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "admin") {
    throw new Error("Forbidden");
  }
  return user;
}

export async function updateLearningStreak(userId: string) {
  const supabase = createAdminClient();
  const today = getTodayDateString();

  const { data: user } = await supabase
    .from("users")
    .select("learning_streak, last_active_date")
    .eq("id", userId)
    .single();

  if (!user) return;

  let newStreak = user.learning_streak || 0;

  if (user.last_active_date === today) {
    return newStreak;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (user.last_active_date === yesterdayStr) {
    newStreak += 1;
  } else {
    newStreak = 1;
  }

  await supabase
    .from("users")
    .update({ learning_streak: newStreak, last_active_date: today })
    .eq("id", userId);

  return newStreak;
}

export async function logActivity(
  userId: string,
  action: string,
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, unknown>
) {
  const supabase = createAdminClient();
  await supabase.from("activity_log").insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata: metadata || {},
  });
}

export async function updateDailyProgress(
  userId: string,
  updates: Partial<{
    documents_uploaded: number;
    quizzes_taken: number;
    quiz_score_avg: number;
    study_minutes: number;
  }>
) {
  const supabase = createAdminClient();
  const today = getTodayDateString();

  const { data: existing } = await supabase
    .from("progress_tracking")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  if (existing) {
    await supabase
      .from("progress_tracking")
      .update({
        documents_uploaded:
          (existing.documents_uploaded || 0) + (updates.documents_uploaded || 0),
        quizzes_taken:
          (existing.quizzes_taken || 0) + (updates.quizzes_taken || 0),
        study_minutes:
          (existing.study_minutes || 0) + (updates.study_minutes || 0),
        quiz_score_avg: updates.quiz_score_avg ?? existing.quiz_score_avg,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("progress_tracking").insert({
      user_id: userId,
      date: today,
      ...updates,
    });
  }
}
