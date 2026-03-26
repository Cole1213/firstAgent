# Semester Study Assistant

An AI-powered study assistant built with **LangChain.js** that uses the **ReAct (Reasoning + Acting) pattern** to help you manage your BYU Winter 2026 course load. It can answer questions about your syllabi, do math for homework, and search the web — all in a single chat interface with real-time streaming.

## Courses Loaded

| Course | Title |
|--------|-------|
| ECON 110 | Introduction to Economics |
| FIN 201 | Principles of Finance |
| GSCM 201 | Supply Chain Management |
| GSCM 211 | Operations Management |
| IS 590R | AI Applications in Business |

---

## Architecture

```
  ┌────────────────────────────────────────────────┐
  │                  Browser (UI)                  │
  │         public/index.html  ←  SSE stream       │
  └────────────────┬───────────────────────────────┘
                   │  HTTP / SSE
  ┌────────────────▼───────────────────────────────┐
  │             Express Server (server.js)         │
  │        POST /api/chat   GET /api/chat/stream   │
  └────────────────┬───────────────────────────────┘
                   │
  ┌────────────────▼───────────────────────────────┐
  │           ReAct Agent (src/agent.js)           │
  │   Thought → Action → Observation → repeat      │
  │                                                │
  │  ┌────────────┐ ┌───────────┐ ┌─────────────┐ │
  │  │ Calculator │ │ Web Search│ │ Syllabi KB  │ │
  │  │  (mathjs)  │ │ (Tavily)  │ │ (HNSWLib)   │ │
  │  └────────────┘ └───────────┘ └──────┬──────┘ │
  │                                      │        │
  │  ┌──────────────┐  ┌─────────────────▼──────┐ │
  │  │ Session      │  │ HNSWLib Vector Store   │ │
  │  │ Memory (k=10)│  │ (persistent, local)    │ │
  │  └──────────────┘  └────────────────────────┘ │
  └────────────────────────────────────────────────┘
```

---

## Prerequisites

- **Node.js** v18 or later
- **OpenAI API key** (GPT-4o + embeddings)
- **Tavily API key** (web search)

---

## Setup

1. **Clone the repo**

```bash
git clone <repo-url>
cd firstAgent
```

2. **Install Node.js dependencies**

```bash
npm install
```

3. **Create your environment file**

```bash
cp .env.example .env
```

Open `.env` and fill in your API keys:

```
OPENAI_API_KEY=sk-...
TAVILY_API_KEY=tvly-...
PORT=3000
VECTOR_STORE_PATH=./vector_store
```

4. **Ingest your course syllabi**

```bash
npm run ingest
```

This reads all `.txt` files from the `documents/` folder (your syllabi), splits them into chunks, embeds them, and saves the HNSWLib index to `./vector_store`.

5. **Start the server**

```bash
npm start
```

6. **Open the app**

Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | — | OpenAI API key for GPT-4o and text-embedding-3-small |
| `TAVILY_API_KEY` | Yes | — | Tavily API key for web search |
| `PORT` | No | `3000` | Port the Express server listens on |
| `VECTOR_STORE_PATH` | No | `./vector_store` | Directory path for persistent HNSWLib index |

---

## Tools

### Calculator (`calculator`)
Evaluates mathematical expressions using the `mathjs` library. Useful for finance formulas, economics problems, GPA calculations, and general homework math.

### Web Search (`web_search`)
Queries the Tavily API for current information from the web. Returns the top 3 results with titles, snippets, and URLs. Used for topics not covered by your syllabi.

### Course Syllabi Search (`knowledge_base_search`)
Performs similarity search against the HNSWLib vector store containing your ingested course syllabi. Returns the top 3 most relevant passages with source attribution (e.g., "Source: fin_201.txt"). Use this for grading policies, exam dates, office hours, textbook requirements, and assignment details.

### Conversation Memory (implicit)
Maintains per-session chat history (last 10 exchanges) so the agent can reference earlier messages in the conversation.

---

## Example Queries

1. **Syllabus lookup**: "When is the final exam for FIN 201?"
2. **Grading info**: "What's the grading breakdown for ECON 110?"
3. **Calculator**: "What is the present value of $1000 received in 5 years at 8% interest?"
4. **Web search**: "What are the current Federal Reserve interest rates?"
5. **Cross-course**: "Do any of my classes have group projects?"
6. **Memory**: Ask a follow-up like "What percentage is homework worth?" after asking about a course

---

## Adding or Updating Syllabi

To add a new course or update an existing syllabus:

1. Place the `.txt` file in the `documents/` folder
2. Re-run ingestion: `npm run ingest`
3. Restart the server: `npm start`

---

## Project Structure

```
firstAgent/
├── aiDocs/
│   ├── context.md          # Project orientation for AI tools
│   ├── prd.md              # Product requirements document
│   └── changelog.md        # Change log
├── ai/
│   └── roadmap.md          # Phased project roadmap
├── public/
│   └── index.html          # Chat web UI (HTML + CSS + JS)
├── src/
│   ├── agent.js            # ReAct agent — study assistant persona
│   ├── tools/
│   │   ├── calculator.js   # Math evaluation tool (mathjs)
│   │   ├── webSearch.js    # Tavily web search tool
│   │   └── ragTool.js      # HNSWLib syllabi search tool
│   ├── memory.js           # Per-session conversation memory (k=10)
│   ├── vectorStore.js      # HNSWLib vector store initialisation
│   ├── ingestDocuments.js  # Document ingestion script
│   └── logger.js           # Winston structured logger
├── documents/              # Course syllabi (.txt files)
├── vector_store/           # Persistent HNSWLib index (gitignored)
├── logs/                   # Log files (gitignored)
├── .cursorrules            # Cursor AI coding rules
├── .gitignore
├── .env.example            # Template for environment variables
├── package.json
├── server.js               # Express server with SSE streaming
└── README.md               # This file
```

---

## Logging

All structured logs are written in two places:

- **Console** — colorized, human-readable format
- **`logs/agent.log`** — JSON-formatted, one object per line

Every tool invocation is logged with:
- Tool name
- Input arguments
- Result summary (truncated)
- Latency in milliseconds

Agent reasoning steps are also logged with the action taken and the observation received. Use the log file for debugging and auditing agent behaviour.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the Express server |
| `npm run ingest` | Ingest syllabi from `documents/` into the HNSWLib vector store |
| `npm run dev` | Start with nodemon (auto-restart on changes) |
