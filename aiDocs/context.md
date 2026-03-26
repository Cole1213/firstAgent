# Project Context — Semester Study Assistant

## What This Project Is

This is a **Semester Study Assistant** — an AI chatbot built with **LangChain.js** that uses the **ReAct (Reasoning + Acting) pattern** to help a BYU student manage their Winter 2026 course load. The agent has the student's course syllabi ingested into a vector store and can answer questions about schedules, grading policies, textbooks, assignments, and more.

It also provides a calculator for homework math and web search for anything not covered by the syllabi.

The agent exposes a web-based chat UI served by an Express.js server. Responses are streamed to the browser in real time via Server-Sent Events (SSE).

## Courses Loaded

| Course | Title |
|--------|-------|
| ECON 110 | Introduction to Economics |
| FIN 201 | Principles of Finance |
| GSCM 201 | Supply Chain Management |
| GSCM 211 | Operations Management |
| IS 590R | AI Applications in Business |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js v18+ |
| Agent Framework | LangChain.js (`langchain`, `@langchain/openai`, `@langchain/community`) |
| LLM | OpenAI GPT-4o |
| Embeddings | OpenAI `text-embedding-3-small` |
| Vector Store | HNSWLib (local, persistent, pure JS) |
| Web Search | Tavily API |
| Web Server | Express.js |
| Streaming | Server-Sent Events (SSE) |
| Logging | Winston (structured JSON) |
| Environment | dotenv |

## Key Files and Their Roles

| File | Purpose |
|------|---------|
| `server.js` | Express server — serves the UI, handles `/api/chat` and `/api/chat/stream` endpoints |
| `src/agent.js` | Core ReAct agent — assembles tools, memory, and the LLM; system prompt tailored for study assistance |
| `src/tools/calculator.js` | Math evaluation tool using `mathjs` |
| `src/tools/webSearch.js` | Tavily-powered web search tool |
| `src/tools/ragTool.js` | Knowledge base similarity search against HNSWLib (course syllabi) |
| `src/memory.js` | Per-session conversation memory (k=10) |
| `src/vectorStore.js` | HNSWLib vector store initialisation and persistent index management |
| `src/ingestDocuments.js` | Standalone script to read `.txt` files from `documents/` and embed into HNSWLib |
| `src/logger.js` | Winston logger with `logToolCall` and `logAgentStep` helpers |
| `public/index.html` | Self-contained chat UI (HTML + CSS + JS) |
| `documents/*.txt` | Course syllabi for each class (source material for the knowledge base) |

## How the ReAct Loop Works

1. **User sends a message** via the chat UI.
2. The Express server forwards it to `runAgent()` (or `streamAgent()` for SSE).
3. The LangChain agent passes the message + chat history to GPT-4o.
4. The LLM **reasons** about the query and decides whether it needs a tool.
5. If a tool is needed, the agent **acts** — invokes the chosen tool with generated input.
6. The tool result is fed back to the LLM as an **observation**.
7. Steps 4–6 repeat until the LLM produces a **final answer**.
8. The final answer is returned (or streamed) to the user.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key for GPT-4o and embeddings |
| `TAVILY_API_KEY` | Tavily API key for web search |
| `PORT` | Express server port (default `3000`) |
| `VECTOR_STORE_PATH` | Directory for persistent HNSWLib index (default `./vector_store`) |

## How to Run

```bash
npm install
cp .env.example .env   # fill in your API keys
npm run ingest          # embed course syllabi into HNSWLib
npm start               # start the server
# Open http://localhost:3000
```
