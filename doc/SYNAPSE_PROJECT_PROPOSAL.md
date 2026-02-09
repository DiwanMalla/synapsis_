# 🧠 Synapse: The Visual Knowledge Graph

**Project Vision:**
A "Second Brain" web application that allows users to dump thoughts, notes, and links, and automatically connects them using AI embeddings. The core feature is a dynamic 2D/3D graph visualization where ideas are nodes and relationships are edges.

**Why this project?**
1.  **High Value:** Solves the "note chaos" problem.
2.  **Technically Impressive:** Requires understanding Vector DBs, Graphs, and AI.
3.  **Modern Stack:** Next.js 15, TypeScript, Tailwind, Supabase (Postgres + pgvector).

---

## 🛠️ The Tech Stack (2026 Edition)
*   **Frontend:** Next.js 15 (App Router), React, TypeScript.
*   **Styling:** Tailwind CSS + Shadcn UI (for beautiful components).
*   **Visualization:** React Flow (2D graph) or React Force Graph (3D/2D).
*   **Backend/DB:** Supabase (PostgreSQL with `pgvector` extension).
*   **AI/Embeddings:** OpenAI API (text-embedding-3-small) or Ollama (local).
*   **State Management:** Zustand (client-side graph state).

---

## 📅 Development Roadmap (4 Phases)

### Phase 1: The Foundation (Week 1)
**Goal:** Set up the project, database, and basic UI.
1.  [ ] **Initialize:** Next.js + TypeScript + Tailwind. (Done!)
2.  [ ] **UI Library:** Install Shadcn UI (Button, Input, Card).
3.  [ ] **Database:** Create a Supabase project. Enable `vector` extension.
4.  [ ] **Schema:** Design the `notes` table (id, content, created_at, embedding vector).
5.  [ ] **Basic Input:** Create a simple form to add a text note to the database.

### Phase 2: The Intelligence (Week 2)
**Goal:** Make the app "smart" by generating embeddings for notes.
1.  [ ] **AI Setup:** Get an OpenAI API key (or set up local Ollama).
2.  [ ] **Embedding Pipeline:** Write a server action to:
    *   Take user input.
    *   Send to AI model -> get vector array (e.g., `[0.12, -0.45, ...]`).
    *   Save text + vector to Supabase.
3.  [ ] **Search:** Implement a "Semantic Search" bar. (Searching "fruit" finds "apple" even if the word "fruit" isn't in the note).

### Phase 3: The Visualization (Week 3)
**Goal:** The "Wow" factor. Visualizing notes as a graph.
1.  [ ] **Graph Lib:** Install `reactflow` or `react-force-graph`.
2.  [ ] **Fetch Nodes:** Pull all notes from Supabase.
3.  [ ] **Calculate Edges:**
    *   For each note, find the top 3 "nearest neighbors" using vector similarity (cosine distance).
    *   Create links (edges) between them.
4.  [ ] **Render:** Display the nodes and edges on a canvas. Add zoom/pan interactions.

### Phase 4: Polish & Deploy (Week 4)
**Goal:** Make it production-ready.
1.  [ ] **Refine UI:** Add dark mode, smooth transitions.
2.  [ ] **Edit/Delete:** Allow managing notes.
3.  [ ] **Authentication:** Add Supabase Auth (Login with Google/GitHub).
4.  [ ] **Deploy:** Push to Vercel.

---

## 🚀 Getting Started Checklist
Before writing code, ensure you have:
1.  **Node.js** installed (check with `node -v`).
2.  **VS Code** with extensions: ESLint, Prettier, Tailwind CSS IntelliSense.
3.  **Supabase Account** (free tier is perfect).
4.  **OpenAI API Key** (or Ollama running locally).

**Next Step:** Open `synapse` in VS Code and install Shadcn UI components.
