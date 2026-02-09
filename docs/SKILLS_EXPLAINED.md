# What are "Skills" in AI Engineering?

In modern AI development (like we are doing with Synapse), a **Skill** (often called a "Tool" or "Function") is a specific capability you give to an LLM.

## The Concept
Normally, an LLM just outputs text. It can't "do" anything.
**Skills** bridge the gap between "Thinking" and "Doing".

### How it works in Synapse:
Instead of just asking the AI: *"What is in my notes?"*
We give the AI a **Skill** called `search_notes(query)`.

1.  **User asks:** "Where did I save that recipe for lasagna?"
2.  **AI thinks:** "I need to find a note. I have a skill for that."
3.  **AI calls Skill:** `search_notes("lasagna recipe")`
4.  **App executes code:** Runs a database query.
5.  **App returns data:** "Found note #42: 'Grandma's Lasagna...'"
6.  **AI answers user:** "I found it! It's in Note #42..."

## Skills We Will Build
For Project Synapse, we will build these specific skills for our Agent:

1.  **`save_thought`**:
    *   *Description:* Takes raw text, cleans it, and saves it to the DB.
    *   *Code:* Database INSERT command.

2.  **`recall_memory`**:
    *   *Description:* Searches the vector database for similar past thoughts.
    *   *Code:* `pgvector` cosine similarity search.

3.  **`connect_ideas`**:
    *   *Description:* Creates a permanent link between two nodes in the graph.
    *   *Code:* Insert into `edges` table.

## Why call them "Skills"?
This term comes from frameworks like **Semantic Kernel** (Microsoft) or **LangChain**. It treats the AI like an employee. You don't just write a script; you "teach" the agent a new skill by writing a function it can call.
