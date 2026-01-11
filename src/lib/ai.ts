const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-learning`;

interface StreamOptions {
  onDelta: (text: string) => void;
  onDone: () => void;
  onError?: (error: Error) => void;
}

export async function callAI<T>(action: string, params: Record<string, unknown>): Promise<T> {
  const response = await fetch(AI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ action, ...params }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `AI request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.result;
}

export async function streamChat(
  topic: string,
  chatHistory: Array<{ role: string; content: string }>,
  userMessage: string,
  options: StreamOptions
): Promise<void> {
  const response = await fetch(AI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      action: "mentor_chat",
      topic,
      chatHistory,
      userMessage,
    }),
  });

  if (!response.ok || !response.body) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    options.onError?.(new Error(error.error || "Failed to start chat stream"));
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") {
        streamDone = true;
        break;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) options.onDelta(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  // Final flush
  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (raw.startsWith(":") || raw.trim() === "") continue;
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) options.onDelta(content);
      } catch { /* ignore */ }
    }
  }

  options.onDone();
}

export interface RoadmapNode {
  title: string;
  description: string;
  order_index: number;
}

export interface PersonalizedRoadmapNode extends RoadmapNode {
  initial_mastery: "weak" | "learning" | "strong";
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

export interface AssessmentQuestion {
  question: string;
  options: string[];
  correct_answer: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  concept: string;
  explanation?: string;
}

export interface LearningResource {
  title: string;
  url: string;
  type: "youtube" | "website" | "article" | "course";
  description: string;
}

export type SelfRating = "none" | "basic" | "comfortable" | "expert";

export interface SelfRatings {
  [concept: string]: SelfRating;
}

export async function generateRoadmap(topic: string): Promise<RoadmapNode[]> {
  return callAI<RoadmapNode[]>("generate_roadmap", { topic });
}

export async function generateAssessment(topic: string): Promise<AssessmentQuestion[]> {
  return callAI<AssessmentQuestion[]>("generate_assessment", { topic });
}

export async function generatePersonalizedRoadmap(
  topic: string,
  assessmentAnswers: number[],
  assessmentQuestions: AssessmentQuestion[]
): Promise<PersonalizedRoadmapNode[]> {
  return callAI<PersonalizedRoadmapNode[]>("generate_personalized_roadmap", {
    topic,
    assessmentAnswers,
    assessmentQuestions,
  });
}

export async function generateQuiz(topic: string, nodeTitle?: string, difficulty?: string): Promise<QuizQuestion[]> {
  return callAI<QuizQuestion[]>("generate_quiz", { topic, nodeTitle, difficulty });
}

export async function explainAnswer(question: string, userAnswer: string, correctAnswer: string): Promise<string> {
  return callAI<string>("explain_answer", { question, userAnswer, correctAnswer });
}

export async function recommendResources(topic: string, nodeTitle?: string): Promise<LearningResource[]> {
  return callAI<LearningResource[]>("recommend_resources", { topic, nodeTitle });
}
