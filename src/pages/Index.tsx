import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useLearning } from "@/contexts/LearningContext";
import { Sparkles, Search, ArrowRight, Loader2, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Index() {
  const [topicInput, setTopicInput] = useState("");
  const { user, loading: authLoading } = useAuth();
  const { startAssessment, isLoading, fetchTopics, topics } = useLearning();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (user) {
      fetchTopics();
    }
  }, [user, authLoading, navigate, fetchTopics]);

  const handleCreateTopic = async () => {
    if (!topicInput.trim()) return;
    await startAssessment(topicInput.trim());
    setTopicInput("");
    navigate("/assessment");
  };

  const suggestions = [
    "Python Programming",
    "Data Science Fundamentals",
    "Calculus for Beginners",
    "Machine Learning Basics",
    "JavaScript & React",
    "Digital Marketing",
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Profile Avatar - Top Right */}
      <div className="fixed top-6 right-6 z-50">
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {user?.email?.charAt(0).toUpperCase() || <User className="w-5 h-5" />}
            </AvatarFallback>
          </Avatar>
        </button>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-secondary/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 py-20">

          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-12 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse-glow">
              <Sparkles className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold gradient-text">BloomIQ</h1>
              <p className="text-sm text-muted-foreground">AI Learning Mentor</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="text-center mb-12 animate-fade-in animation-delay-150">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              What would you like to <span className="gradient-text">learn</span> today?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Enter any topic and I'll create a personalized learning roadmap, 
              generate quizzes, and guide you with AI-powered explanations.
            </p>
          </div>

          {/* Search Input */}
          <div className="max-w-2xl mx-auto mb-8 animate-fade-in animation-delay-300">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="e.g., Python basics, calculus, machine learning..."
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateTopic()}
                className="pl-12 pr-32 h-14 text-lg rounded-2xl border-2 border-border focus:border-primary shadow-lg"
                disabled={isLoading}
              />
              <Button
                onClick={handleCreateTopic}
                disabled={!topicInput.trim() || isLoading}
                variant="hero"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-6"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Start Learning
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>


          {/* Empty space where features used to be */}
          <div className="h-16" />

          {/* Recent Topics */}
          {topics.length > 0 && (
            <div className="mt-16 animate-fade-in">
              <h3 className="text-xl font-display font-semibold text-foreground mb-4 text-center">
                Continue Learning
              </h3>
              <div className="flex flex-wrap justify-center gap-3">
                {topics.slice(0, 4).map((topic) => (
                  <Button
                    key={topic.id}
                    variant="outline"
                    onClick={() => {
                      navigate("/roadmap");
                    }}
                    className="rounded-full"
                  >
                    {topic.topic}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
