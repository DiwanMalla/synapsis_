# Project Synapse: Context & Architecture

> **For AI Agents:** This file serves as the primary context for the "Synapse" project. Read this to understand the goal, stack, and architecture before suggesting code.

## 1. Project Vision
**Synapse** is a "Second Brain" web application that visualizes thoughts as a dynamic knowledge graph.
*   **Core Concept:** Users input unstructured thoughts (text/links).
*   **The Magic:** AI (LLMs + Embeddings) automatically tags, summarizes, and connects these thoughts to existing notes based on semantic similarity.
*   **The Interface:** A 2D/3D interactive graph (nodes and edges) replacing the traditional list view.

## 2. Tech Stack (Strict)
*   **Framework:** Next.js 15+ (App Router).
*   **Language:** TypeScript (Strict mode).
*   **Styling:** Tailwind CSS v4 + Shadcn UI (Radix Primitives).
*   **Icons:** Lucide React.
*   **Database:** Supabase (PostgreSQL).
*   **AI Engine:** 
    *   **Embeddings:** OpenAI `text-embedding-3-small` (or local Ollama).
    *   **Vector Search:** `pgvector` extension on Postgres.
*   **State Management:** React Query (Server state) + Zustand (Client graph state).
*   **Visualization:** `react-force-graph` or `reactflow`.

## 3. Architecture Overview

### Frontend (Client)
*   **InputNexus:** A distraction-free entry point for capturing thoughts.
*   **GraphCanvas:** The main visualization engine.
*   **Sidebar:** Traditional list/search view for fallback navigation.

### Backend (Server Actions)
*   We use **Server Actions** instead of API routes where possible.
*   **Flow:**
    1.  `createNote(content)` -> Saves raw text to DB.
    2.  `generateEmbeddings(content)` -> AI Service creates vector.
    3.  `updateNoteVector(id, vector)` -> Saves vector to DB.
    4.  `findRelated(vector)` -> Performs cosine similarity search.

## 4. "Skills" & Agent capabilities (Phase 2)
The backend will expose "Skills" (Tools) that the AI can use to manipulate the brain:
*   `skill_summarize`: Condense long notes.
*   `skill_connect`: Explicitly link two nodes.
*   `skill_extract_action_items`: Find tasks in notes.

## 5. Development Rules
*   **Components:** Keep them small, reusable, and in `src/components`.
*   **Types:** Define Zod schemas for all data entering the DB.
*   **Style:** Dark mode by default. "Cyberpunk/Scientific" aesthetic.
*   **Performance:** No blocking the UI for AI operations (use Optimistic Updates).
