# Product Requirements Document — Semester Study Assistant

## Problem Statement

University students juggle multiple courses with different schedules, grading policies, textbook requirements, and assignment deadlines spread across separate syllabi. Finding specific information quickly — "When is my FIN 201 final?" or "What's the grading breakdown for ECON 110?" — means digging through individual documents.

This project builds an AI-powered study assistant that ingests all of a student's course syllabi into a searchable knowledge base, combined with a calculator for homework math and web search for supplementary information — all in a single conversational interface with real-time streaming.

## User Persona

### BYU Student (Winter 2026)
Taking five courses: ECON 110, FIN 201, GSCM 201, GSCM 211, and IS 590R. Needs quick answers about class schedules, grading policies, instructor contact info, textbook requirements, and assignment details. Also needs a calculator for finance and economics homework and web search for topics not covered by syllabi.

## Tools — Behaviour Specifications

### Tool 1: Calculator (`calculator`)
- **Input**: A valid mathematical expression string (e.g., `"sqrt(144) + 5 * 3"`).
- **Behaviour**: Evaluates the expression using `mathjs`. Returns the numeric result as a string.
- **Use cases**: Finance formulas (PV, FV, NPV), economics calculations, GPA math.
- **Error handling**: Returns a human-readable error string on invalid input; never throws.
- **Logging**: Every invocation is logged with tool name, input expression, result, and latency.

### Tool 2: Web Search (`web_search`)
- **Input**: A natural-language search query string.
- **Behaviour**: Queries the Tavily API and returns the top 3 results with titles, snippets, and URLs.
- **Use cases**: Looking up concepts not in the syllabi, current events for class discussions, supplementary study material.
- **Error handling**: Returns an error string if the API call fails.
- **Logging**: Input query, number of results returned, and latency.

### Tool 3: Knowledge Base Search (`knowledge_base_search`)
- **Input**: A natural-language question or keyword query.
- **Behaviour**: Performs a similarity search (top 3) against the HNSWLib vector store containing course syllabi. Returns matching passages with source-file attribution.
- **Output format**:
  ```
  Result 1 (Source: fin_201.txt):
  <passage text>

  Result 2 (Source: econ_110.txt):
  <passage text>
  ```
- **Use cases**: Grading breakdowns, exam dates, office hours, textbook info, assignment policies.
- **Error handling**: Returns an error string if the vector store is unavailable.
- **Logging**: Input query, number of results, sources returned, and latency.

### Tool 4: Conversation Memory (implicit)
- Maintains per-session message history (k=10 exchanges).
- Enables multi-turn conversations so the agent can reference earlier messages.
- Memory is keyed by `sessionId` — each browser tab gets its own conversation thread.

## Acceptance Criteria

| # | Criterion |
|---|-----------|
| 1 | The agent correctly selects the calculator tool when the user asks a math question. |
| 2 | The agent correctly selects web search for questions about current events or topics not in the syllabi. |
| 3 | The agent correctly selects the knowledge base for questions about courses, schedules, or grading. |
| 4 | RAG results include source-file attribution visible in the chat UI (e.g., "According to your FIN 201 syllabus…"). |
| 5 | The chat UI streams tokens in real time (no waiting for full completion). |
| 6 | Tool usage badges (Calculator, Web Search, Course Syllabi) appear on relevant assistant messages. |
| 7 | Conversation memory persists within a session — the agent can reference earlier messages. |
| 8 | All tool invocations are logged to `logs/agent.log` with structured JSON. |
| 9 | The project runs successfully with `npm install && npm run ingest && npm start`. |
| 10 | The README provides clear, complete setup instructions. |

## Non-Functional Requirements

- **Streaming**: All agent responses are streamed via SSE for low perceived latency.
- **Logging**: Structured JSON logs via Winston; every tool call logged with name, input, output, and latency.
- **Persistence**: HNSWLib vector store persists to disk; survives server restarts.
- **Security**: No API keys in source code; all secrets via environment variables.
- **Error resilience**: Tool errors are caught and returned as strings; the agent never crashes from a tool failure.

## Out of Scope

- User authentication / multi-user access control.
- Deployment to cloud providers (this is a local-dev project).
- Fine-tuning or custom model training.
- File upload for dynamic document ingestion via the UI.
- Database-backed chat history persistence (memory is in-process only).
- Automated test suite (manual testing via the UI is acceptable).
- PDF ingestion (syllabi must be converted to `.txt` before ingestion).
