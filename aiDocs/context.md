# Project Context — Multi-Tool AI Agent

## What This Project Is

This is a **Multi-Tool AI Chatbot Agent** built with **LangChain.js** that demonstrates the **ReAct (Reasoning + Acting) pattern**. The agent can reason about a user's query, decide which tool to use, act by invoking that tool, observe the result, and iterate until it can provide a final answer.

The agent exposes a web-based chat UI served by an Express.js server. Responses are streamed to the browser in real time via Server-Sent Events (SSE).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js v18+ |
| Agent Framework | LangChain.js (`langchain`, `@langchain/openai`, `@langchain/community`) |
| LLM | OpenAI GPT-4o |
| Embeddings | OpenAI `text-embedding-3-small` |
| Vector Store | ChromaDB (local, persistent) |
| Web Search | Tavily API |
| Web Server | Express.js |
| Streaming | Server-Sent Events (SSE) |
| Logging | Winston (structured JSON) |
| Environment | dotenv |

## Key Files and Their Roles

| File | Purpose |
|------|---------|
| `server.js` | Express server — serves the UI, handles `/api/chat` and `/api/chat/stream` endpoints |
| `src/agent.js` | Core ReAct agent — assembles tools, memory, and the LLM into an `AgentExecutor` |
| `src/tools/calculator.js` | Math evaluation tool using `mathjs` |
| `src/tools/webSearch.js` | Tavily-powered web search tool |
| `src/tools/ragTool.js` | Knowledge base similarity search against ChromaDB |
| `src/memory.js` | Conversation memory (BufferWindowMemory, k=10) |
| `src/vectorStore.js` | ChromaDB client initialisation and persistent collection management |
| `src/ingestDocuments.js` | Standalone script to read `.txt` files from `documents/` and upsert into ChromaDB |
| `src/logger.js` | Winston logger with `logToolCall` and `logAgentStep` helpers |
| `public/index.html` | Self-contained chat UI (HTML + CSS + JS) |

## How the ReAct Loop Works

1. **User sends a message** via the chat UI.
2. The Express server forwards it to `runAgent()` (or `streamAgent()` for SSE).
3. The LangChain `AgentExecutor` passes the message + chat history to GPT-4o.
4. The LLM **reasons** about the query and decides whether it needs a tool.
5. If a tool is needed, the executor **acts** — invokes the chosen tool with generated input.
6. The tool result is fed back to the LLM as an **observation**.
7. Steps 4–6 repeat until the LLM produces a **final answer**.
8. The final answer is returned (or streamed) to the user.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key for GPT-4o and embeddings |
| `TAVILY_API_KEY` | Tavily API key for web search |
| `PORT` | Express server port (default `3000`) |
| `CHROMA_DB_PATH` | Path to persistent ChromaDB data (default `./chroma_db`) |
| `COLLECTION_NAME` | ChromaDB collection name (default `agent_documents`) |

## How to Run

```bash
npm install
cp .env.example .env   # fill in your API keys
# Start ChromaDB:  pip install chromadb && chroma run --path ./chroma_db
node src/ingestDocuments.js   # ingest documents into ChromaDB
node server.js                # start the server
# Open http://localhost:3000
```
