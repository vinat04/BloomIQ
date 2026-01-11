import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useLearning } from "@/contexts/LearningContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  User,
  BookOpen,
  Map,
  Brain,
  MessageCircle,
  ArrowRight,
  Loader2,
  Calendar,
} from "lucide-react";

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const { topics, fetchTopics, selectTopic, isLoading } = useLearning();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (user) {
      fetchTopics();
    }
  }, [user, authLoading, navigate, fetchTopics]);

  const handleTopicClick = async (topic: any) => {
    await selectTopic(topic);
    navigate("/roadmap");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (authLoading || isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <User className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">
                My Profile
              </h1>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass-card rounded-xl p-4 text-center">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{topics.length}</p>
            <p className="text-sm text-muted-foreground">Topics</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-2">
              <Brain className="w-5 h-5 text-accent" />
            </div>
            <p className="text-2xl font-bold text-foreground">-</p>
            <p className="text-sm text-muted-foreground">Quizzes Taken</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center mx-auto mb-2">
              <Map className="w-5 h-5 text-success" />
            </div>
            <p className="text-2xl font-bold text-foreground">-</p>
            <p className="text-sm text-muted-foreground">Skills Mastered</p>
          </div>
        </div>

        {/* Topics List */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-xl font-display font-semibold text-foreground mb-4">
            My Learning Topics
          </h2>

          {topics.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                You haven't started learning any topics yet.
              </p>
              <Button variant="hero" onClick={() => navigate("/")}>
                Start Learning
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {topics.map((topic, index) => (
                <div
                  key={topic.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 cursor-pointer animate-fade-in"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => handleTopicClick(topic)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{topic.topic}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>Started {formatDate(topic.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={(e) => {
                      e.stopPropagation();
                      handleTopicClick(topic);
                    }}>
                      <Map className="w-4 h-4 mr-1" />
                      Roadmap
                    </Button>
                    <Button variant="ghost" size="sm" onClick={(e) => {
                      e.stopPropagation();
                      selectTopic(topic);
                      navigate("/quiz");
                    }}>
                      <Brain className="w-4 h-4 mr-1" />
                      Quiz
                    </Button>
                    <Button variant="ghost" size="sm" onClick={(e) => {
                      e.stopPropagation();
                      selectTopic(topic);
                      navigate("/chat");
                    }}>
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Chat
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 glass-card rounded-2xl p-6 text-center">
          <p className="text-muted-foreground mb-4">
            Ready to learn something new?
          </p>
          <Button variant="hero" onClick={() => navigate("/")}>
            Start New Topic
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
