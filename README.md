# Synapse: AI-Powered Second Brain

**Synapse** is a visual knowledge management system that uses AI (Vector Embeddings) to automatically organize and connect your thoughts.

![Synapse Screenshot](public/screenshot.png)

## 🚀 Features

*   **Brain Dump:** Capture thoughts instantly.
*   **AI Auto-Linking:** Automatically connects related notes using cosine similarity search.
*   **Knowledge Graph:** Visualize your ideas as a 2D/3D interactive network.
*   **Semantic Search:** Find notes by meaning, not just keywords (e.g., search "food" to find "pizza").
*   **Full CRUD:** Create, Read, Update, Delete functionality.
*   **Dark/Light Mode:** Beautiful, accessible UI.

## 🛠️ Tech Stack

*   **Frontend:** Next.js 15 (App Router), React, TypeScript
*   **Styling:** Tailwind CSS, Shadcn UI
*   **Backend:** Supabase (PostgreSQL)
*   **AI Engine:** 
    *   **Embeddings:** Ollama (nomic-embed-text) / OpenAI (Ready)
    *   **Vector DB:** pgvector extension
*   **Visualization:** react-force-graph

## 🏗️ Architecture

### Database Schema (Supabase)

```sql
-- Notes Table
create table notes (
  id bigint primary key generated always as identity,
  content text not null,
  created_at timestamptz default now(),
  embedding vector(768) -- Stores AI semantic vector
);

-- Vector Search Function
create or replace function match_notes (...)
returns table (id bigint, content text, similarity float)
```

### Data Flow
1.  User inputs text -> Server Action `createNote`
2.  Text sent to AI Model -> Returns `vector[768]`
3.  Text + Vector saved to Postgres.
4.  Frontend fetches notes + edges (calculated via K-Nearest Neighbors).

## 🏃‍♂️ Getting Started

1.  **Clone the repo**
    ```bash
    git clone https://github.com/yourusername/synapse.git
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Setup Environment**
    Create `.env.local`:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

## 📄 License
MIT License. Created by **Diwan Malla**.
