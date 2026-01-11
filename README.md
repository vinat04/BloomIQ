# BloomIQ – AI Adaptive Learning System

## Overview
BloomIQ is an AI-powered adaptive learning platform that personalizes the learning experience by assessing user knowledge, identifying learning gaps, and generating customized learning roadmaps. The system supports adaptive quizzes with explanations and curated learning resources to help users progressively master selected topics.

---

## Key Features
- Diagnostic pre-assessment quiz
- Personalized learning roadmap generation
- Adaptive topic-wise quizzes
- AI-generated explanations for incorrect answers
- Curated learning resources (videos and articles)
- User profile for tracking topics and progress

---

## Learning Flow
1. User selects a topic
2. Pre-assessment quiz evaluates knowledge
3. Personalized roadmap is generated
4. User studies recommended resources
5. Post-learning quizzes validate understanding
6. Progress is updated based on performance

---

## Tech Stack
**Frontend**
- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

**Backend**
- Supabase Edge Functions

**AI Integration**
- Large Language Model (LLM) API for quiz generation, explanations, and roadmap creation

---

## Running Locally
```sh
git clone <REPOSITORY_URL>
cd BloomIQ
npm install
npm run dev
