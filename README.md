# Multi-Tool AI Agent

A conversational AI chatbot built with **LangChain.js** that uses the **ReAct (Reasoning + Acting) pattern** to dynamically select from multiple tools — a calculator, web search, and a RAG knowledge base — to answer user queries. Responses are streamed in real time via a polished web UI.

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
  │  │ Calculator │ │ Web Search│ │ RAG / KB    │ │
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

4. **Ingest documents into the knowledge base**

```bash
npm run ingest
```

This reads all `.txt` files from the `documents/` folder, splits them into chunks, embeds them, and saves the HNSWLib index to `./vector_store`.

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
Evaluates mathematical expressions using the `mathjs` library. Handles arithmetic, trigonometry, algebra, and more. Input any valid math expression like `sqrt(144) + 5 * 3`.

### Web Search (`web_search`)
Queries the Tavily API for current information from the web. Returns the top 3 results with titles, snippets, and URLs. Used for real-time information, news, and topics not covered by the knowledge base.

### Knowledge Base Search (`knowledge_base_search`)
Performs similarity search against the HNSWLib vector store containing ingested documents. Returns the top 3 most relevant passages with source-file attribution (e.g., "Source: langchain_guide.txt").

### Conversation Memory (implicit)
Maintains per-session chat history (last 10 exchanges) so the agent can reference earlier messages in the conversation.

---

## Example Queries

1. **Calculator**: "What is the square root of 2048 divided by pi?"
2. **Web Search**: "What are the latest developments in AI regulation?"
3. **Knowledge Base**: "Explain the ReAct pattern for language models"
4. **Multi-tool**: "Calculate 15% of 230, then search the web for current USD to EUR exchange rate"
5. **Memory**: Ask a follow-up like "Can you elaborate on that?" after any answer

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
│   ├── agent.js            # ReAct agent — assembles tools, model, memory
│   ├── tools/
│   │   ├── calculator.js   # Math evaluation tool (mathjs)
│   │   ├── webSearch.js    # Tavily web search tool
│   │   └── ragTool.js      # HNSWLib knowledge base search tool
│   ├── memory.js           # Per-session conversation memory (k=10)
│   ├── vectorStore.js      # HNSWLib vector store initialisation
│   ├── ingestDocuments.js  # Document ingestion script
│   └── logger.js           # Winston structured logger
├── documents/              # Source .txt files for RAG ingestion
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
| `npm run ingest` | Ingest documents from `documents/` into the HNSWLib vector store |
| `npm run dev` | Start with nodemon (auto-restart on changes) |
