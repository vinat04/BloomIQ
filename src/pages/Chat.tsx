import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useLearning } from "@/contexts/LearningContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { streamChat } from "@/lib/ai";
import { toast } from "sonner";
import {
  MessageCircle,
  Send,
  Loader2,
  Sparkles,
  User,
  Bot,
  ArrowRight,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Chat() {
  const { user, loading: authLoading } = useAuth();
  const { currentTopic, selectedNode } = useLearning();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Add initial greeting when topic changes
  useEffect(() => {
    if (currentTopic && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: `Hi! 👋 I'm your AI learning mentor for **${currentTopic.topic}**. ${
            selectedNode ? `I see you're working on "${selectedNode.title}". ` : ""
          }Feel free to ask me anything about this topic - I'm here to help you understand concepts, answer questions, and guide your learning journey!`,
        },
      ]);
    }
  }, [currentTopic, selectedNode]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !currentTopic) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    let assistantContent = "";

    try {
      await streamChat(
        currentTopic.topic,
        messages.map((m) => ({ role: m.role, content: m.content })),
        userMessage,
        {
          onDelta: (delta) => {
            assistantContent += delta;
            setMessages((prev) => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage?.role === "assistant") {
                return prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: assistantContent } : m
                );
              }
              return [...prev, { role: "assistant", content: assistantContent }];
            });
          },
          onDone: () => {
            setIsLoading(false);
          },
          onError: (error) => {
            toast.error(error.message);
            setIsLoading(false);
          },
        }
      );
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
      setIsLoading(false);
    }
  };

  if (!currentTopic) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 animate-bounce-subtle">
            <MessageCircle className="w-10 h-10 text-accent" />
          </div>
          <h2 className="text-2xl font-display font-bold text-foreground mb-2">
            Choose a Topic First
          </h2>
          <p className="text-muted-foreground mb-6">
            Select a learning topic to chat with your AI mentor.
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
      <div className="animate-fade-in h-[calc(100vh-6rem)] flex flex-col">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">AI Mentor</h1>
              <p className="text-muted-foreground">{currentTopic.topic}</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex gap-3 animate-fade-in",
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-gradient-to-br from-accent to-primary text-primary-foreground"
                )}
              >
                {message.role === "user" ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
              <div
                className={cn(
                  "max-w-[80%] p-4 rounded-2xl",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-card border border-border rounded-tl-sm"
                )}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-primary text-primary-foreground flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-card border border-border p-4 rounded-2xl rounded-tl-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <div className="py-4">
            <p className="text-xs text-muted-foreground mb-2">Quick questions:</p>
            <div className="flex flex-wrap gap-2">
              {[
                `Explain ${selectedNode?.title || currentTopic.topic} simply`,
                "What are the key concepts?",
                "Give me a real-world example",
                "What should I learn first?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="px-3 py-1.5 text-sm bg-card border border-border rounded-full hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="pt-4 border-t border-border">
          <div className="flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Ask your AI mentor anything..."
              className="flex-1 h-12 rounded-xl"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              variant="hero"
              className="h-12 px-6"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
