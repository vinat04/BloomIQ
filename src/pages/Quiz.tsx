import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useLearning } from "@/contexts/LearningContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { explainAnswer } from "@/lib/ai";
import { toast } from "sonner";
import {
  Brain,
  ArrowRight,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sparkles,
  Trophy,
} from "lucide-react";

type Difficulty = "easy" | "medium" | "hard";

export default function Quiz() {
  const { user, loading: authLoading } = useAuth();
  const { currentTopic, selectedNode, quizQuestions, generateQuizForNode, isLoading, updateNodeMastery } = useLearning();
  const navigate = useNavigate();

  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleStartQuiz = async () => {
    setCurrentQuestion(0);
    setScore(0);
    setQuizComplete(false);
    setSelectedAnswer(null);
    setShowResult(false);
    setExplanation(null);
    await generateQuizForNode(selectedNode?.title, difficulty);
  };

  const handleSelectAnswer = async (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
    setShowResult(true);

    const question = quizQuestions[currentQuestion];
    const isCorrect = index === question.correct_answer;

    if (isCorrect) {
      setScore((prev) => prev + 1);
    } else {
      // Get AI explanation for wrong answer
      setLoadingExplanation(true);
      try {
        const exp = await explainAnswer(
          question.question,
          question.options[index],
          question.options[question.correct_answer]
        );
        setExplanation(exp);
      } catch (err) {
        console.error("Failed to get explanation:", err);
      } finally {
        setLoadingExplanation(false);
      }
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setExplanation(null);
    } else {
      setQuizComplete(true);
      // Update mastery based on score
      if (selectedNode) {
        const percentage = (score / quizQuestions.length) * 100;
        if (percentage >= 80) {
          updateNodeMastery(selectedNode.id, "strong");
        } else if (percentage >= 50) {
          updateNodeMastery(selectedNode.id, "learning");
        }
      }
    }
  };

  const getScoreMessage = () => {
    const percentage = (score / quizQuestions.length) * 100;
    if (percentage >= 80) return { text: "Excellent! You've mastered this topic! 🎉", color: "text-success" };
    if (percentage >= 60) return { text: "Good job! Keep practicing! 💪", color: "text-warning" };
    return { text: "Keep learning! You'll get there! 📚", color: "text-secondary" };
  };

  if (!currentTopic) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Brain className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-display font-bold text-foreground mb-2">
            Choose a Topic First
          </h2>
          <p className="text-muted-foreground mb-6">
            Select a learning topic to start taking quizzes.
          </p>
          <Button variant="hero" size="lg" onClick={() => navigate("/")}>
            Choose a Topic
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <Brain className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Quiz Time</h1>
              <p className="text-muted-foreground">{selectedNode?.title || currentTopic.topic}</p>
            </div>
          </div>
        </div>

        {/* Quiz Content */}
        {quizQuestions.length === 0 && !isLoading ? (
          // Start Quiz
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center mx-auto mb-6 animate-bounce-subtle">
              <Brain className="w-12 h-12 text-secondary" />
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">
              Ready to Test Your Knowledge?
            </h2>
            <p className="text-muted-foreground mb-6">
              Choose a difficulty level and start the quiz!
            </p>

            {/* Difficulty Selection */}
            <div className="flex justify-center gap-3 mb-8">
              {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={cn(
                    "px-6 py-3 rounded-xl font-medium capitalize transition-all",
                    difficulty === d
                      ? d === "easy"
                        ? "bg-success text-success-foreground shadow-lg"
                        : d === "medium"
                        ? "bg-warning text-warning-foreground shadow-lg"
                        : "bg-destructive text-destructive-foreground shadow-lg"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>

            <Button variant="hero" size="xl" onClick={handleStartQuiz}>
              Start Quiz
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        ) : isLoading ? (
          // Loading
          <div className="glass-card rounded-2xl p-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Generating personalized quiz questions...</p>
          </div>
        ) : quizComplete ? (
          // Quiz Complete
          <div className="glass-card rounded-2xl p-8 text-center animate-scale-in">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-12 h-12 text-primary-foreground" />
            </div>
            <h2 className="text-3xl font-display font-bold text-foreground mb-2">
              Quiz Complete!
            </h2>
            <p className={cn("text-xl font-medium mb-4", getScoreMessage().color)}>
              {getScoreMessage().text}
            </p>
            <div className="text-5xl font-display font-bold gradient-text mb-8">
              {score} / {quizQuestions.length}
            </div>
            <div className="flex justify-center gap-4">
              <Button variant="outline" size="lg" onClick={handleStartQuiz}>
                <RefreshCw className="w-5 h-5 mr-2" />
                Retry
              </Button>
              <Button variant="hero" size="lg" onClick={() => navigate("/roadmap")}>
                Continue Learning
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        ) : (
          // Question
          <div className="space-y-6">
            {/* Progress */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">
                Question {currentQuestion + 1} of {quizQuestions.length}
              </span>
              <span className="text-sm font-medium text-primary">
                Score: {score}/{currentQuestion + (showResult ? 1 : 0)}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%` }}
              />
            </div>

            {/* Question Card */}
            <div className="glass-card rounded-2xl p-8">
              <h2 className="text-xl font-semibold text-foreground mb-6">
                {quizQuestions[currentQuestion].question}
              </h2>

              {/* Options */}
              <div className="space-y-3">
                {quizQuestions[currentQuestion].options.map((option, index) => {
                  const isCorrect = index === quizQuestions[currentQuestion].correct_answer;
                  const isSelected = index === selectedAnswer;

                  return (
                    <button
                      key={index}
                      onClick={() => handleSelectAnswer(index)}
                      disabled={showResult}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border-2 transition-all duration-200",
                        showResult
                          ? isCorrect
                            ? "bg-success/10 border-success text-success"
                            : isSelected
                            ? "bg-destructive/10 border-destructive text-destructive"
                            : "bg-muted/50 border-border text-muted-foreground"
                          : "bg-card border-border hover:border-primary hover:bg-primary/5"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium shrink-0",
                            showResult
                              ? isCorrect
                                ? "bg-success text-success-foreground"
                                : isSelected
                                ? "bg-destructive text-destructive-foreground"
                                : "bg-muted text-muted-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {showResult ? (
                            isCorrect ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : isSelected ? (
                              <XCircle className="w-5 h-5" />
                            ) : (
                              String.fromCharCode(65 + index)
                            )
                          ) : (
                            String.fromCharCode(65 + index)
                          )}
                        </span>
                        <span className="font-medium">{option}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {showResult && selectedAnswer !== quizQuestions[currentQuestion].correct_answer && (
                <div className="mt-6 p-4 bg-muted/50 rounded-xl border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-accent" />
                    <span className="font-medium text-foreground">AI Explanation</span>
                  </div>
                  {loadingExplanation ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Getting explanation...</span>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      {explanation || quizQuestions[currentQuestion].explanation}
                    </p>
                  )}
                </div>
              )}

              {/* Next Button */}
              {showResult && (
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full mt-6"
                  onClick={handleNextQuestion}
                >
                  {currentQuestion < quizQuestions.length - 1 ? "Next Question" : "See Results"}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
