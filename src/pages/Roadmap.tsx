import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useLearning } from "@/contexts/LearningContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Map, 
  CheckCircle2, 
  Circle, 
  AlertCircle,
  ArrowRight,
  Loader2,
  BookOpen
} from "lucide-react";

export default function Roadmap() {
  const { user, loading: authLoading } = useAuth();
  const { currentTopic, roadmapNodes, selectedNode, selectNode, isLoading, fetchTopics } = useLearning();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (user) {
      fetchTopics();
    }
  }, [user, authLoading, navigate, fetchTopics]);

  const getMasteryIcon = (mastery: string) => {
    switch (mastery) {
      case "strong":
        return <CheckCircle2 className="w-5 h-5" />;
      case "learning":
        return <Circle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getMasteryColor = (mastery: string) => {
    switch (mastery) {
      case "strong":
        return "bg-success text-success-foreground border-success";
      case "learning":
        return "bg-warning text-warning-foreground border-warning";
      default:
        return "bg-destructive/10 text-destructive border-destructive/30";
    }
  };

  if (!currentTopic) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 animate-bounce-subtle">
            <Map className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-display font-bold text-foreground mb-2">
            No Learning Topic Selected
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Start by entering a topic you want to learn. I'll create a personalized roadmap just for you.
          </p>
          <Button variant="hero" size="lg" onClick={() => navigate("/")}>
            Choose a Topic
            <ArrowRight className="w-5 h-5" />
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
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Map className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">
                Learning Roadmap
              </h1>
              <p className="text-muted-foreground">{currentTopic.topic}</p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-8 p-4 glass-card rounded-xl">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-destructive" />
            <span className="text-sm text-muted-foreground">Needs Practice</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-warning" />
            <span className="text-sm text-muted-foreground">Learning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-success" />
            <span className="text-sm text-muted-foreground">Mastered</span>
          </div>
        </div>

        {/* Roadmap */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {roadmapNodes.map((node, index) => (
              <div
                key={node.id}
                className={cn(
                  "relative animate-fade-in",
                  index > 0 && "mt-4"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Connector Line */}
                {index < roadmapNodes.length - 1 && (
                  <div className="absolute left-6 top-16 w-0.5 h-8 bg-border" />
                )}

                {/* Node Card */}
                <button
                  onClick={() => selectNode(selectedNode?.id === node.id ? null : node)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border-2 transition-all duration-300",
                    "hover:shadow-lg hover:-translate-y-0.5",
                    selectedNode?.id === node.id
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Mastery Indicator */}
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                        getMasteryColor(node.mastery)
                      )}
                    >
                      {getMasteryIcon(node.mastery)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          Step {index + 1}
                        </span>
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full capitalize",
                            node.mastery === "strong" && "bg-success/10 text-success",
                            node.mastery === "learning" && "bg-warning/10 text-warning",
                            node.mastery === "weak" && "bg-destructive/10 text-destructive"
                          )}
                        >
                          {node.mastery}
                        </span>
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">{node.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {node.description}
                      </p>
                    </div>

                    {/* Arrow */}
                    <ArrowRight
                      className={cn(
                        "w-5 h-5 text-muted-foreground transition-transform shrink-0",
                        selectedNode?.id === node.id && "rotate-90 text-primary"
                      )}
                    />
                  </div>
                </button>

                {/* Expanded Actions */}
                {selectedNode?.id === node.id && (
                  <div className="mt-3 p-4 bg-muted/50 rounded-xl animate-scale-in">
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => navigate("/quiz")}
                      >
                        Take Quiz
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate("/resources")}
                      >
                        <BookOpen className="w-4 h-4 mr-1" />
                        Resources
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/chat")}
                      >
                        Ask AI Mentor
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
