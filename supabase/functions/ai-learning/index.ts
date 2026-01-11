import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, topic, nodeTitle, difficulty, question, userAnswer, correctAnswer, chatHistory, userMessage, selfRatings, assessmentAnswers, assessmentQuestions } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "generate_assessment":
        systemPrompt = `You are an expert educator creating an assessment to gauge a student's current knowledge level. 

CRITICAL: You MUST return ONLY valid JSON. No explanations, no code, no markdown - JUST the JSON array.

Generate exactly 10 multiple-choice questions that range from beginner to advanced concepts. Return a JSON array with this EXACT structure:
[
  {"question": "question text here", "options": ["Option A", "Option B", "Option C", "Option D"], "correct_answer": 0, "difficulty": "beginner", "concept": "concept being tested", "explanation": "Brief explanation of why the correct answer is right and common misconceptions"}
]

RULES:
- correct_answer is the index (0-3) of the correct option
- difficulty must be exactly one of: "beginner", "intermediate", "advanced"
- Include 4 beginner, 3 intermediate, and 3 advanced questions
- Each question should test a different concept/subtopic
- explanation should be 1-2 sentences explaining the correct answer (shown when user gets it wrong)
- DO NOT include any text before or after the JSON array
- DO NOT wrap in markdown code blocks`;
        userPrompt = `Create 10 assessment questions to test prior knowledge about "${topic}". Cover key foundational concepts through advanced topics. Each question should test a different concept. Include a brief explanation for each question. Return ONLY the JSON array, nothing else.`;
        break;

      case "generate_personalized_roadmap":
        const quizResults = assessmentAnswers && assessmentQuestions ? assessmentQuestions.map((q: any, i: number) => {
          const userAns = assessmentAnswers[i];
          const isCorrect = userAns === q.correct_answer;
          return `- "${q.concept}" (${q.difficulty}): ${isCorrect ? "CORRECT" : "INCORRECT"}`;
        }).join("\n") : "No quiz completed";

        const correctCount = assessmentAnswers && assessmentQuestions ? 
          assessmentQuestions.filter((q: any, i: number) => assessmentAnswers[i] === q.correct_answer).length : 0;
        const totalQuestions = assessmentQuestions?.length || 0;

        systemPrompt = `You are an expert educational curriculum designer. Based on a student's pre-assessment quiz results, create a personalized learning roadmap.

CRITICAL: You MUST return ONLY valid JSON. No explanations, no markdown - JUST the JSON array.

IMPORTANT RULES FOR INITIAL MASTERY:
1. The pre-quiz ONLY identifies knowledge gaps - it CANNOT confirm mastery
2. Mark topics as "weak" if the student got related questions WRONG
3. Mark topics as "learning" if they got related questions CORRECT (they showed some knowledge, but need practice to confirm mastery)
4. NEVER use "strong" - this can only be earned through subsequent topic-specific quizzes
5. Order topics from foundational to advanced
6. Focus more on areas where the student struggled

Return a JSON array with this exact structure:
[
  {"title": "subtopic name", "description": "brief description", "order_index": 0, "initial_mastery": "weak"}
]
Include 6-10 subtopics based on the quiz performance. Use only "weak" or "learning" for initial_mastery.`;
        
        userPrompt = `Create a personalized learning roadmap for: "${topic}"

QUIZ PERFORMANCE (${correctCount}/${totalQuestions} correct):
${quizResults}

Based on this quiz data, create a roadmap that:
1. Focuses heavily on concepts they got WRONG (mark as "weak")
2. Marks concepts they got CORRECT as "learning" (they showed knowledge but need to confirm through practice)
3. NEVER mark anything as "strong" - that must be earned through topic quizzes later
4. Includes related foundational topics they may have missed
5. Orders from basic to advanced

Return ONLY the JSON array.`;
        break;

      case "generate_roadmap":
        systemPrompt = `You are an expert educational curriculum designer. Generate a learning roadmap for any topic. Return a JSON array of subtopics with this exact structure:
[
  {"title": "subtopic name", "description": "brief description of what this covers", "order_index": 0}
]
Include 6-10 subtopics, ordered from foundational to advanced. Be specific and practical.`;
        userPrompt = `Create a comprehensive learning roadmap for: "${topic}". Include foundational concepts first, then progressively more advanced topics.`;
        break;

      case "generate_quiz":
        systemPrompt = `You are an expert educator creating quiz questions. Generate exactly 5 multiple-choice questions. Return a JSON array with this exact structure:
[
  {"question": "question text", "options": ["A", "B", "C", "D"], "correct_answer": 0, "explanation": "why this is correct"}
]
The correct_answer is the index (0-3) of the correct option. Make questions ${difficulty || 'easy'} difficulty.`;
        userPrompt = `Create 5 ${difficulty || 'easy'} multiple-choice questions about "${nodeTitle || topic}".`;
        break;

      case "explain_answer":
        systemPrompt = `You are a patient and encouraging tutor. Explain why an answer is wrong and teach the concept clearly. Be concise but thorough.`;
        userPrompt = `The student answered "${userAnswer}" to this question: "${question}"
The correct answer was: "${correctAnswer}"
Please explain why their answer was incorrect and help them understand the correct concept.`;
        break;

      case "recommend_resources":
        systemPrompt = `You are a learning resources curator. Recommend specific YouTube video suggestions and article resources. Return a JSON array with this exact structure:
[
  {"title": "Specific video/article title suggestion", "description": "What you'll learn from this resource", "type": "youtube|article"}
]

RULES:
- Only use types "youtube" or "article" - no other types
- For "youtube": Suggest specific video titles that likely exist on YouTube (popular tutorials, channel names, etc.)
- For "article": Suggest specific article topics with recommended sites like Medium, freeCodeCamp, GeeksforGeeks, MDN, etc.
- Include 3-4 YouTube video suggestions and 2-3 article suggestions
- Be specific about what the video/article covers
- Focus on beginner-friendly content first, then intermediate`;
        userPrompt = `Recommend YouTube videos and articles for learning: "${nodeTitle || topic}". Give specific suggestions that learners can search for.`;
        break;

      case "mentor_chat":
        systemPrompt = `You are BloomIQ, an AI learning mentor. You're friendly, encouraging, and knowledgeable. Help students understand concepts, answer questions, and guide their learning journey. Use examples and analogies. If they're struggling, break things down into simpler parts. Celebrate their progress!`;
        
        const messages = [
          { role: "system", content: systemPrompt },
          ...(chatHistory || []).slice(-10),
          { role: "user", content: userMessage }
        ];
        
        const chatResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages,
            stream: true,
          }),
        });

        if (!chatResponse.ok) {
          const errorText = await chatResponse.text();
          console.error("AI gateway error:", chatResponse.status, errorText);
          
          if (chatResponse.status === 429) {
            return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
              status: 429,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          if (chatResponse.status === 402) {
            return new Response(JSON.stringify({ error: "Usage limit reached. Please try again later." }), {
              status: 402,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          throw new Error("AI gateway error");
        }

        return new Response(chatResponse.body, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Non-streaming response for structured data
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    let content = data.choices[0].message.content;
    
    console.log("Raw AI response:", content.substring(0, 500));
    
    // Try to parse JSON from the response
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        content = jsonMatch[1].trim();
      }
      
      // Try to find JSON array in the content
      const arrayMatch = content.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        content = arrayMatch[0];
      }
      
      const parsed = JSON.parse(content);
      
      // Validate that for assessment, we got an array
      if (action === "generate_assessment" && !Array.isArray(parsed)) {
        console.error("Assessment did not return array:", typeof parsed);
        throw new Error("Invalid assessment format");
      }
      
      return new Response(JSON.stringify({ result: parsed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Content:", content.substring(0, 200));
      // For actions that expect JSON arrays, return an error
      if (["generate_assessment", "generate_roadmap", "generate_personalized_roadmap", "generate_quiz", "recommend_resources"].includes(action)) {
        return new Response(JSON.stringify({ error: "Failed to parse AI response. Please try again." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Return as plain text if not JSON
      return new Response(JSON.stringify({ result: content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("AI learning function error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
