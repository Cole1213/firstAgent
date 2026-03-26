# Product Requirements Document — Multi-Tool AI Agent

## Problem Statement

Developers and researchers frequently need a single conversational interface that can perform diverse tasks — mathematical computation, real-time web research, and retrieval from a private knowledge base — without switching between applications. Existing chatbots are typically limited to a single capability or lack transparency about which data sources inform their answers.

This project fills that gap by building an AI agent that dynamically selects from multiple specialised tools, cites its sources, and streams its reasoning process to the user in real time.

## User Personas

### 1. Developer / Technical Learner
Wants to ask questions about Node.js, LangChain, or AI concepts and get accurate answers grounded in ingested documentation, with clear source attribution.

### 2. Researcher
Needs up-to-date information from the web combined with the ability to query a curated knowledge base, all in a single conversation thread.

### 3. Student
Requires a calculator for math problems, a search engine for fact-checking, and a study-buddy that remembers context across a multi-turn conversation.

## Tools — Behaviour Specifications

### Tool 1: Calculator (`calculator`)
- **Input**: A valid mathematical expression string (e.g., `"sqrt(144) + 5 * 3"`).
- **Behaviour**: Evaluates the expression using `mathjs`. Returns the numeric result as a string.
- **Error handling**: Returns a human-readable error string on invalid input; never throws.
- **Logging**: Every invocation is logged with tool name, input expression, result, and latency.

### Tool 2: Web Search (`web_search`)
- **Input**: A natural-language search query string.
- **Behaviour**: Queries the Tavily API and returns the top 3 results with titles, snippets, and URLs.
- **Error handling**: Returns an error string if the API call fails.
- **Logging**: Input query, number of results returned, and latency.

### Tool 3: Knowledge Base Search (`knowledge_base_search`)
- **Input**: A natural-language question or keyword query.
- **Behaviour**: Performs a similarity search (top 3) against the ChromaDB vector store. Returns matching passages with source-file attribution.
- **Output format**:
  ```
  Result 1 (Source: document_name.txt):
  <passage text>

  Result 2 (Source: ...):
  <passage text>
  ```
- **Error handling**: Returns an error string if the vector store is unavailable.
- **Logging**: Input query, number of results, sources returned, and latency.

### Tool 4: Conversation Memory (implicit)
- Implemented via `BufferWindowMemory` (k=10).
- Maintains per-session chat history so the agent can reference earlier messages.
- Memory is keyed by `sessionId` — each browser tab gets its own conversation thread.

## Acceptance Criteria

| # | Criterion |
|---|-----------|
| 1 | The agent correctly selects the calculator tool when the user asks a math question. |
| 2 | The agent correctly selects web search for questions about current events or topics not in the knowledge base. |
| 3 | The agent correctly selects the knowledge base for questions covered by ingested documents. |
| 4 | RAG results include source-file attribution visible in the chat UI. |
| 5 | The chat UI streams tokens in real time (no waiting for full completion). |
| 6 | Tool usage badges (calculator, search, RAG) appear on relevant assistant messages. |
| 7 | Conversation memory persists within a session — the agent can reference earlier messages. |
| 8 | All tool invocations are logged to `logs/agent.log` with structured JSON. |
| 9 | The project runs successfully with `npm install && node server.js` (after environment setup). |
| 10 | The README provides clear, complete setup instructions. |

## Non-Functional Requirements

- **Streaming**: All agent responses are streamed via SSE for low perceived latency.
- **Logging**: Structured JSON logs via Winston; every tool call logged with name, input, output, and latency.
- **Persistence**: ChromaDB vector store persists to disk; survives server restarts.
- **Security**: No API keys in source code; all secrets via environment variables.
- **Error resilience**: Tool errors are caught and returned as strings; the agent never crashes from a tool failure.

## Out of Scope

- User authentication / multi-user access control.
- Deployment to cloud providers (this is a local-dev project).
- Fine-tuning or custom model training.
- File upload for dynamic document ingestion via the UI.
- Database-backed chat history persistence (memory is in-process only).
- Automated test suite (manual testing via the UI is acceptable).
