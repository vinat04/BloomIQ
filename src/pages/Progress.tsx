import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useLearning } from "@/contexts/LearningContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  ArrowRight,
  Trophy,
  Target,
  Flame,
  BookOpen,
  CheckCircle2,
  Circle,
  AlertCircle,
} from "lucide-react";

export default function Progress() {
  const { user, loading: authLoading } = useAuth();
  const { currentTopic, roadmapNodes, topics, fetchTopics } = useLearning();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (user) {
      fetchTopics();
    }
  }, [user, authLoading, navigate, fetchTopics]);

  const stats = useMemo(() => {
    const weak = roadmapNodes.filter((n) => n.mastery === "weak").length;
    const learning = roadmapNodes.filter((n) => n.mastery === "learning").length;
    const strong = roadmapNodes.filter((n) => n.mastery === "strong").length;
    const total = roadmapNodes.length;
    const progress = total > 0 ? Math.round(((learning * 0.5 + strong) / total) * 100) : 0;

    return { weak, learning, strong, total, progress };
  }, [roadmapNodes]);

  if (!currentTopic) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <BarChart3 className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-display font-bold text-foreground mb-2">
            No Progress Yet
          </h2>
          <p className="text-muted-foreground mb-6">
            Start learning to track your progress!
          </p>
          <Button variant="hero" size="lg" onClick={() => navigate("/")}>
            Start Learning
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-success" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Your Progress</h1>
              <p className="text-muted-foreground">{currentTopic.topic}</p>
            </div>
          </div>
        </div>

        {/* Main Progress */}
        <div className="glass-card rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Circle Progress */}
            <div className="relative w-48 h-48 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${stats.progress * 2.51} 251`}
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(var(--accent))" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-display font-bold gradient-text">
                  {stats.progress}%
                </span>
                <span className="text-sm text-muted-foreground">Complete</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 grid grid-cols-3 gap-4 w-full">
              <div className="text-center p-4 bg-destructive/10 rounded-xl">
                <AlertCircle className="w-6 h-6 text-destructive mx-auto mb-2" />
                <span className="text-2xl font-bold text-foreground">{stats.weak}</span>
                <p className="text-sm text-muted-foreground">Needs Practice</p>
              </div>
              <div className="text-center p-4 bg-warning/10 rounded-xl">
                <Circle className="w-6 h-6 text-warning mx-auto mb-2" />
                <span className="text-2xl font-bold text-foreground">{stats.learning}</span>
                <p className="text-sm text-muted-foreground">Learning</p>
              </div>
              <div className="text-center p-4 bg-success/10 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-success mx-auto mb-2" />
                <span className="text-2xl font-bold text-foreground">{stats.strong}</span>
                <p className="text-sm text-muted-foreground">Mastered</p>
              </div>
            </div>
          </div>
        </div>

        {/* Achievement Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {[
            {
              icon: Trophy,
              title: "Topics Explored",
              value: topics.length,
              color: "bg-warning/10 text-warning",
            },
            {
              icon: Target,
              title: "Skills Mastered",
              value: stats.strong,
              color: "bg-success/10 text-success",
            },
            {
              icon: Flame,
              title: "Topics In Progress",
              value: stats.learning,
              color: "bg-secondary/10 text-secondary",
            },
          ].map((stat, i) => (
            <div
              key={stat.title}
              className="glass-card rounded-xl p-6 text-center animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3",
                  stat.color
                )}
              >
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-3xl font-display font-bold text-foreground">{stat.value}</span>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
            </div>
          ))}
        </div>

        {/* Topic Breakdown */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-display font-semibold text-foreground mb-4">
            Topic Breakdown
          </h3>
          <div className="space-y-3">
            {roadmapNodes.map((node, index) => (
              <div
                key={node.id}
                className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    node.mastery === "strong"
                      ? "bg-success text-success-foreground"
                      : node.mastery === "learning"
                      ? "bg-warning text-warning-foreground"
                      : "bg-destructive/20 text-destructive"
                  )}
                >
                  {node.mastery === "strong" ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : node.mastery === "learning" ? (
                    <Circle className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{node.title}</p>
                  <p className="text-sm text-muted-foreground capitalize">{node.mastery}</p>
                </div>
                <div
                  className={cn(
                    "w-24 h-2 rounded-full overflow-hidden bg-muted",
                    "shrink-0"
                  )}
                >
                  <div
                    className={cn(
                      "h-full transition-all duration-500",
                      node.mastery === "strong"
                        ? "bg-success w-full"
                        : node.mastery === "learning"
                        ? "bg-warning w-1/2"
                        : "bg-destructive/50 w-1/6"
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Button variant="hero" size="lg" onClick={() => navigate("/quiz")}>
            Continue Learning
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
