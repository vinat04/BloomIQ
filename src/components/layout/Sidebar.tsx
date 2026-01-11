import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLearning } from "@/contexts/LearningContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Map,
  Brain,
  BookOpen,
  MessageCircle,
  BarChart3,
  Plus,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
  User,
} from "lucide-react";

const navItems = [
  { icon: Map, label: "Roadmap", path: "/roadmap" },
  { icon: Brain, label: "Quiz", path: "/quiz" },
  { icon: BookOpen, label: "Resources", path: "/resources" },
  { icon: MessageCircle, label: "AI Mentor", path: "/chat" },
  { icon: BarChart3, label: "Progress", path: "/progress" },
  { icon: User, label: "Profile", path: "/profile" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentTopic, topics, selectTopic } = useLearning();
  const { signOut } = useAuth();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen transition-all duration-300 flex flex-col",
        "bg-sidebar text-sidebar-foreground",
        collapsed ? "w-16" : "w-64"
      )}
      style={{ background: "var(--gradient-sidebar)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="font-display font-bold text-lg text-sidebar-foreground">BloomIQ</h1>
            <p className="text-xs text-sidebar-foreground/60">AI Learning Mentor</p>
          </div>
        )}
      </div>

      {/* Topic Selector */}
      {!collapsed && currentTopic && (
        <div className="p-4 border-b border-sidebar-border">
          <p className="text-xs text-sidebar-foreground/60 mb-2">Current Topic</p>
          <div className="p-2 rounded-lg bg-sidebar-accent">
            <p className="font-medium text-sm truncate">{currentTopic.topic}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Button
              key={item.path}
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 h-11 transition-all duration-200",
                collapsed ? "px-3" : "px-4",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
              onClick={() => navigate(item.path)}
            >
              <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-inherit")} />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </Button>
          );
        })}
      </nav>

      {/* Topics List */}
      {!collapsed && topics.length > 0 && (
        <div className="p-3 border-t border-sidebar-border">
          <p className="text-xs text-sidebar-foreground/60 mb-2 px-1">Your Topics</p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {topics.slice(0, 5).map((topic) => (
              <button
                key={topic.id}
                onClick={() => selectTopic(topic)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                  topic.id === currentTopic?.id
                    ? "bg-sidebar-primary/20 text-sidebar-primary"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <span className="truncate block">{topic.topic}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 h-10 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
            collapsed && "px-3"
          )}
          onClick={() => navigate("/")}
        >
          <Plus className="w-5 h-5 shrink-0" />
          {!collapsed && <span>New Topic</span>}
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 h-10 text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10",
            collapsed && "px-3"
          )}
          onClick={signOut}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
