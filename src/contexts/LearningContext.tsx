import React, { createContext, useContext, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { 
  generateRoadmap, 
  generateQuiz, 
  recommendResources, 
  generateAssessment,
  generatePersonalizedRoadmap,
  type RoadmapNode, 
  type QuizQuestion, 
  type LearningResource,
  type AssessmentQuestion,
  type SelfRatings,
  type PersonalizedRoadmapNode
} from "@/lib/ai";
import { toast } from "sonner";

interface Topic {
  id: string;
  topic: string;
  description: string | null;
  created_at: string;
}

interface StoredRoadmapNode {
  id: string;
  topic_id: string;
  title: string;
  description: string | null;
  mastery: "weak" | "learning" | "strong";
  order_index: number;
}

interface LearningContextType {
  currentTopic: Topic | null;
  topics: Topic[];
  roadmapNodes: StoredRoadmapNode[];
  selectedNode: StoredRoadmapNode | null;
  isLoading: boolean;
  pendingTopic: string | null;
  assessmentQuestions: AssessmentQuestion[];
  createTopic: (topicName: string) => Promise<void>;
  startAssessment: (topicName: string) => Promise<void>;
  completeAssessment: (answers: number[]) => Promise<void>;
  cancelAssessment: () => void;
  selectTopic: (topic: Topic) => void;
  selectNode: (node: StoredRoadmapNode | null) => void;
  updateNodeMastery: (nodeId: string, mastery: "weak" | "learning" | "strong") => Promise<void>;
  fetchTopics: () => Promise<void>;
  quizQuestions: QuizQuestion[];
  generateQuizForNode: (nodeTitle?: string, difficulty?: string) => Promise<void>;
  resources: LearningResource[];
  fetchResources: (nodeTitle?: string) => Promise<void>;
}

const LearningContext = createContext<LearningContextType | undefined>(undefined);

export function LearningProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [roadmapNodes, setRoadmapNodes] = useState<StoredRoadmapNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<StoredRoadmapNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [pendingTopic, setPendingTopic] = useState<string | null>(null);
  const [assessmentQuestions, setAssessmentQuestions] = useState<AssessmentQuestion[]>([]);

  const fetchTopics = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("learning_topics")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching topics:", error);
      return;
    }

    setTopics(data || []);
  }, [user]);

  const fetchRoadmapNodes = useCallback(async (topicId: string) => {
    const { data, error } = await supabase
      .from("roadmap_nodes")
      .select("*")
      .eq("topic_id", topicId)
      .order("order_index", { ascending: true });

    if (error) {
      console.error("Error fetching roadmap nodes:", error);
      return;
    }

    setRoadmapNodes(data || []);
  }, []);

  // Start the assessment flow - generates assessment questions
  const startAssessment = useCallback(async (topicName: string) => {
    if (!user) {
      toast.error("Please sign in to create a topic");
      return;
    }

    // Clear previous topic state before starting new assessment
    setCurrentTopic(null);
    setRoadmapNodes([]);
    setSelectedNode(null);
    setQuizQuestions([]);
    setResources([]);
    
    setIsLoading(true);
    setPendingTopic(topicName);
    
    try {
      toast.info("Preparing your knowledge assessment...");
      const questions = await generateAssessment(topicName);
      setAssessmentQuestions(questions);
    } catch (error) {
      console.error("Error generating assessment:", error);
      toast.error("Failed to generate assessment. Please try again.");
      setPendingTopic(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Complete assessment and generate personalized roadmap based on quiz answers only
  const completeAssessment = useCallback(async (answers: number[]) => {
    if (!user || !pendingTopic) {
      toast.error("Something went wrong. Please try again.");
      return;
    }

    setIsLoading(true);
    try {
      // Create the topic
      const { data: topicData, error: topicError } = await supabase
        .from("learning_topics")
        .insert({ topic: pendingTopic, user_id: user.id })
        .select()
        .single();

      if (topicError) throw topicError;

      // Generate personalized roadmap based on quiz answers
      toast.info("Creating your personalized learning roadmap...");
      const roadmap = await generatePersonalizedRoadmap(
        pendingTopic,
        answers,
        assessmentQuestions
      );

      // Save roadmap nodes with initial mastery from assessment
      const nodesWithTopicId = roadmap.map((node, index) => ({
        topic_id: topicData.id,
        user_id: user.id,
        title: node.title,
        description: node.description,
        mastery: node.initial_mastery || "weak",
        order_index: index,
      }));

      const { error: nodesError } = await supabase
        .from("roadmap_nodes")
        .insert(nodesWithTopicId);

      if (nodesError) throw nodesError;

      toast.success("Personalized roadmap created!");
      setCurrentTopic(topicData);
      await fetchRoadmapNodes(topicData.id);
      await fetchTopics();
      
      // Clear assessment state
      setPendingTopic(null);
      setAssessmentQuestions([]);
    } catch (error) {
      console.error("Error completing assessment:", error);
      toast.error("Failed to create roadmap. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [user, pendingTopic, assessmentQuestions, fetchRoadmapNodes, fetchTopics]);

  const cancelAssessment = useCallback(() => {
    setPendingTopic(null);
    setAssessmentQuestions([]);
  }, []);

  // Legacy createTopic without assessment (keeping for backwards compatibility)
  const createTopic = useCallback(async (topicName: string) => {
    if (!user) {
      toast.error("Please sign in to create a topic");
      return;
    }

    setIsLoading(true);
    try {
      const { data: topicData, error: topicError } = await supabase
        .from("learning_topics")
        .insert({ topic: topicName, user_id: user.id })
        .select()
        .single();

      if (topicError) throw topicError;

      toast.info("Generating your personalized learning roadmap...");
      const roadmap = await generateRoadmap(topicName);

      const nodesWithTopicId = roadmap.map((node, index) => ({
        topic_id: topicData.id,
        user_id: user.id,
        title: node.title,
        description: node.description,
        mastery: "weak" as const,
        order_index: index,
      }));

      const { error: nodesError } = await supabase
        .from("roadmap_nodes")
        .insert(nodesWithTopicId);

      if (nodesError) throw nodesError;

      toast.success("Learning roadmap created!");
      setCurrentTopic(topicData);
      await fetchRoadmapNodes(topicData.id);
      await fetchTopics();
    } catch (error) {
      console.error("Error creating topic:", error);
      toast.error("Failed to create topic. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchRoadmapNodes, fetchTopics]);

  const selectTopic = useCallback(async (topic: Topic) => {
    setCurrentTopic(topic);
    setSelectedNode(null);
    await fetchRoadmapNodes(topic.id);
  }, [fetchRoadmapNodes]);

  const selectNode = useCallback((node: StoredRoadmapNode | null) => {
    setSelectedNode(node);
  }, []);

  const updateNodeMastery = useCallback(async (nodeId: string, mastery: "weak" | "learning" | "strong") => {
    const { error } = await supabase
      .from("roadmap_nodes")
      .update({ mastery })
      .eq("id", nodeId);

    if (error) {
      console.error("Error updating mastery:", error);
      toast.error("Failed to update progress");
      return;
    }

    setRoadmapNodes(prev => prev.map(n => n.id === nodeId ? { ...n, mastery } : n));
    toast.success("Progress updated!");
  }, []);

  const generateQuizForNode = useCallback(async (nodeTitle?: string, difficulty?: string) => {
    if (!currentTopic) return;
    
    setIsLoading(true);
    try {
      const questions = await generateQuiz(currentTopic.topic, nodeTitle, difficulty);
      setQuizQuestions(questions);
    } catch (error) {
      console.error("Error generating quiz:", error);
      toast.error("Failed to generate quiz. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [currentTopic]);

  const fetchResources = useCallback(async (nodeTitle?: string) => {
    if (!currentTopic) return;
    
    setIsLoading(true);
    try {
      const recs = await recommendResources(currentTopic.topic, nodeTitle);
      setResources(recs);
    } catch (error) {
      console.error("Error fetching resources:", error);
      toast.error("Failed to fetch resources. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [currentTopic]);

  return (
    <LearningContext.Provider
      value={{
        currentTopic,
        topics,
        roadmapNodes,
        selectedNode,
        isLoading,
        pendingTopic,
        assessmentQuestions,
        createTopic,
        startAssessment,
        completeAssessment,
        cancelAssessment,
        selectTopic,
        selectNode,
        updateNodeMastery,
        fetchTopics,
        quizQuestions,
        generateQuizForNode,
        resources,
        fetchResources,
      }}
    >
      {children}
    </LearningContext.Provider>
  );
}

export function useLearning() {
  const context = useContext(LearningContext);
  if (context === undefined) {
    throw new Error("useLearning must be used within a LearningProvider");
  }
  return context;
}
