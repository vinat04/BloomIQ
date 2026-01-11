import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useLearning } from "@/contexts/LearningContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  ArrowRight,
  Loader2,
  FileText,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

export default function Resources() {
  const { user, loading: authLoading } = useAuth();
  const { currentTopic, selectedNode, resources, fetchResources, isLoading } = useLearning();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (currentTopic && resources.length === 0 && !isLoading) {
      fetchResources(selectedNode?.title);
    }
  }, [currentTopic, selectedNode, resources.length, isLoading, fetchResources]);

  const getResourceIcon = () => {
    return <FileText className="w-5 h-5" />;
  };

  const getResourceColor = () => {
    return "bg-info/10 text-info";
  };

  const getResourceUrl = (resource: { title: string }) => {
    const encodedTitle = encodeURIComponent(resource.title);
    return `https://www.google.com/search?q=${encodedTitle}`;
  };

  if (!currentTopic) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <BookOpen className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-display font-bold text-foreground mb-2">
            Choose a Topic First
          </h2>
          <p className="text-muted-foreground mb-6">
            Select a learning topic to get curated resources.
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
      <div className="animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-info" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-foreground">
                  Learning Resources
                </h1>
                <p className="text-muted-foreground">
                  {selectedNode?.title || currentTopic.topic}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => fetchResources(selectedNode?.title)}
              disabled={isLoading}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Resources */}
        {isLoading ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Finding the best resources for you...</p>
          </div>
        ) : resources.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No resources found. Try refreshing!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {resources
              .filter((resource) => resource.type !== "youtube")
              .map((resource, index) => (
                <a
                  key={index}
                  href={getResourceUrl(resource)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "glass-card rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group animate-fade-in"
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                        getResourceColor()
                      )}
                    >
                      {getResourceIcon()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full capitalize",
                            getResourceColor()
                          )}
                        >
                          Article
                        </span>
                      </div>
                      <h3 className="font-semibold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                        {resource.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {resource.description}
                      </p>
                    </div>
                    <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </div>
                </a>
              ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-8 glass-card rounded-2xl p-6 text-center">
          <p className="text-muted-foreground mb-4">
            Ready to test your knowledge after studying?
          </p>
          <Button variant="hero" onClick={() => navigate("/quiz")}>
            Take a Quiz
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
