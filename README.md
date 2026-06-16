# LearnSphere AI

An AI-powered educational learning platform built with Next.js, Supabase, Gemini AI, and RAG architecture. LearnSphere AI helps students upload study materials, interact with documents using AI, generate quizzes, track learning progress, and receive personalized study recommendations.

---

## 🚀 Features

### Authentication

* User Registration
* User Login
* Logout
* Google OAuth Login
* User Profile Management

### Dashboard

* Total Uploaded Documents
* Total Quizzes Taken
* Learning Streak
* Recent Activity
* Recommended Topics
* Analytics Overview

### Document Upload System

Supports:

* PDF
* DOCX
* TXT

Features:

* File Upload
* Text Extraction
* Document Processing
* Storage Management

### AI Chat with Documents

* ChatGPT-like Interface
* Context-Aware Responses
* Conversational Learning
* Chat History
* Retrieval-Augmented Generation (RAG)

### Citation-Based Answers

Every AI response includes:

* Source Document
* Page Number
* Relevant Content Snippet

### Intelligent Summarization

Generate:

* Chapter Summaries
* Topic Summaries
* Full Document Summaries
* Bullet Notes
* Revision Notes

### Quiz Generator

Quiz Types:

* Multiple Choice Questions
* True / False
* Fill in the Blanks
* Short Answer Questions

Difficulty Levels:

* Easy
* Medium
* Hard

### Quiz Evaluation

* Automatic Scoring
* Answer Validation
* Explanations
* Performance Analysis

### Personalized Learning Assistant

* Study Plan Generation
* Weak Topic Analysis
* Learning Recommendations
* Daily Goals

### Semantic Search

* Search Across Documents
* Similar Concept Discovery
* Topic Matching
* Semantic Retrieval

### Progress Tracking

* Learning Progress Monitoring
* Quiz Performance Tracking
* Study Time Tracking
* Topic Completion Statistics

### Study Recommendations

* Topics to Revise
* Practice Questions
* Difficult Chapters
* AI-Based Suggestions

### Admin Panel

* User Management
* Document Monitoring
* Usage Analytics
* System Overview

---

## 🛠 Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* Shadcn UI

### Backend

* Next.js API Routes
* Server Actions

### Authentication

* NextAuth
* Google OAuth

### Database

* Supabase PostgreSQL

### Vector Database

* pgvector

### AI & Machine Learning

* Gemini AI
* LangChain
* RAG Architecture

### Deployment

* Vercel

---

## 📂 Project Structure

```bash
learnsphere-ai/

app/
├── auth/
├── dashboard/
├── api/

components/
├── dashboard/
├── layout/
├── chat/
├── upload/
├── quiz/

lib/
├── ai/
├── auth/
├── rag/
├── supabase/

hooks/
types/
actions/

public/
```

---

## 🗄 Database Schema

Main Tables:

* users
* documents
* document_chunks
* embeddings
* quizzes
* questions
* quiz_attempts
* chat_sessions
* chat_messages
* study_plans
* recommendations
* progress_tracking

---

## 🤖 AI Workflow

```text
User Uploads Document
        ↓
Text Extraction
        ↓
Chunking
        ↓
Embeddings Generation
        ↓
Vector Storage (pgvector)
        ↓
User Question
        ↓
Semantic Search
        ↓
Relevant Chunks Retrieved
        ↓
Gemini AI
        ↓
Final Response + Citations
```

---

## 🔒 Security Features

* Authentication & Authorization
* Protected Routes
* Secure API Access
* Environment Variable Protection
* Database Access Control

---

## 📊 Future Enhancements

* Voice-Based Learning
* AI Tutor Mode
* Flashcard Generation
* Multi-Language Support
* Real-Time Collaboration
* Mobile Application

---

## 👨‍💻 Author

Developed as an AI-Powered Educational Platform project using modern web technologies and generative AI.

---

## 📄 License

This project is developed for educational and academic purposes.






This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


