import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLearning } from "@/contexts/LearningContext";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ArrowRight, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  Sparkles,
  BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "quiz" | "complete";

export default function Assessment() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { 
    pendingTopic, 
    assessmentQuestions, 
    isLoading, 
    completeAssessment, 
    cancelAssessment 
  } = useLearning();

  const [step, setStep] = useState<Step>("quiz");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!pendingTopic || !assessmentQuestions || assessmentQuestions.length === 0) {
      navigate("/");
    }
  }, [pendingTopic, assessmentQuestions, navigate]);

  const handleSelectAnswer = (answerIndex: number) => {
    if (showFeedback) return;
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;
    setShowFeedback(true);
  };

  const handleNextQuestion = () => {
    const newAnswers = [...answers, selectedAnswer!];
    setAnswers(newAnswers);
    
    if (currentQuestionIndex < assessmentQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      setStep("complete");
    }
  };

  const handleComplete = async () => {
    await completeAssessment(answers);
    navigate("/roadmap");
  };

  const handleCancel = () => {
    cancelAssessment();
    navigate("/");
  };

  if (authLoading || !pendingTopic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentQuestion = assessmentQuestions[currentQuestionIndex];
  const isCorrect = selectedAnswer === currentQuestion?.correct_answer;
  const correctCount = answers.filter((a, i) => a === assessmentQuestions[i]?.correct_answer).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-secondary/10 blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Button variant="ghost" onClick={handleCancel} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Cancel
            </Button>
            <div className="text-center">
              <h1 className="text-xl font-display font-bold text-foreground">
                Knowledge Assessment
              </h1>
              <p className="text-sm text-muted-foreground">{pendingTopic}</p>
            </div>
            <div className="w-24" /> {/* Spacer for alignment */}
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-12">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all",
              step === "quiz" ? "bg-primary text-primary-foreground" : "bg-primary/20 text-primary"
            )}>
              <BookOpen className="w-5 h-5" />
            </div>
            <div className={cn(
              "w-16 h-1 rounded",
              step === "complete" ? "bg-primary" : "bg-border"
            )} />
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all",
              step === "complete" ? "bg-primary text-primary-foreground" : "bg-border text-muted-foreground"
            )}>
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          {/* Step: Quiz */}
          {step === "quiz" && currentQuestion && (
            <div className="animate-fade-in">
              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground mb-2">
                  Question {currentQuestionIndex + 1} of {assessmentQuestions.length}
                </p>
                <div className="w-full bg-border rounded-full h-2 mb-6">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${((currentQuestionIndex + 1) / assessmentQuestions.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="glass-card rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className={cn(
                    "px-2 py-1 rounded text-xs font-medium",
                    currentQuestion.difficulty === "beginner" ? "bg-green-500/20 text-green-500" :
                    currentQuestion.difficulty === "intermediate" ? "bg-yellow-500/20 text-yellow-500" :
                    "bg-red-500/20 text-red-500"
                  )}>
                    {currentQuestion.difficulty}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {currentQuestion.concept}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  {currentQuestion.question}
                </h3>
              </div>

              <div className="space-y-3 mb-8">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrectOption = index === currentQuestion.correct_answer;
                  
                  let optionStyle = "border-border hover:border-primary/50";
                  if (showFeedback) {
                    if (isCorrectOption) {
                      optionStyle = "border-green-500 bg-green-500/10";
                    } else if (isSelected && !isCorrectOption) {
                      optionStyle = "border-red-500 bg-red-500/10";
                    }
                  } else if (isSelected) {
                    optionStyle = "border-primary bg-primary/10";
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handleSelectAnswer(index)}
                      disabled={showFeedback}
                      className={cn(
                        "w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4",
                        optionStyle
                      )}
                    >
                      <span className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0",
                        isSelected && !showFeedback ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}>
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="text-foreground">{option}</span>
                      {showFeedback && isCorrectOption && (
                        <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" />
                      )}
                      {showFeedback && isSelected && !isCorrectOption && (
                        <XCircle className="w-5 h-5 text-red-500 ml-auto" />
                      )}
                    </button>
                  );
                })}
              </div>

              {showFeedback && (
                <div className={cn(
                  "p-4 rounded-xl mb-6 animate-fade-in",
                  isCorrect ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"
                )}>
                  <p className={cn(
                    "font-medium mb-2",
                    isCorrect ? "text-green-500" : "text-red-500"
                  )}>
                    {isCorrect ? "Correct! Great job!" : "Not quite right"}
                  </p>
                  {!isCorrect && currentQuestion.explanation && (
                    <p className="text-sm text-muted-foreground">
                      {currentQuestion.explanation}
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-center">
                {!showFeedback ? (
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={selectedAnswer === null}
                    variant="hero"
                    size="lg"
                  >
                    Submit Answer
                  </Button>
                ) : (
                  <Button
                    onClick={handleNextQuestion}
                    variant="hero"
                    size="lg"
                  >
                    {currentQuestionIndex < assessmentQuestions.length - 1 ? "Next Question" : "See Results"}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Step: Complete */}
          {step === "complete" && (
            <div className="animate-fade-in text-center">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                Assessment Complete!
              </h2>
              <p className="text-muted-foreground mb-4">
                You answered {correctCount} of {assessmentQuestions.length} questions correctly.
              </p>
              <p className="text-sm text-muted-foreground mb-8">
                Based on your responses, we'll create a personalized roadmap that focuses on what you need to learn.
              </p>

              <Button
                onClick={handleComplete}
                disabled={isLoading}
                variant="hero"
                size="lg"
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Your Roadmap...
                  </>
                ) : (
                  <>
                    Generate My Roadmap
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
