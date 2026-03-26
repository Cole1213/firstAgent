# Changelog

## [Unreleased]
### Added
- Initial project scaffold — folder structure, config files, documentation
- `.cursorrules` with code style and architecture guidelines
- `.gitignore`, `.env.example`, and `package.json` with scripts
- `src/logger.js` — Winston structured logger with `logToolCall` and `logAgentStep`
- `src/tools/calculator.js` — Math evaluation tool using mathjs
- `src/tools/webSearch.js` — Tavily-powered web search tool
- `src/tools/ragTool.js` — HNSWLib knowledge base search with source attribution
- `src/vectorStore.js` — HNSWLib vector store initialisation (persistent, local)
- `src/ingestDocuments.js` — Document ingestion script with chunking

### Changed
- Replaced ChromaDB with HNSWLib — no separate server required, runs entirely in Node.js
- 5 knowledge documents: AI overview, LangChain guide, ReAct pattern, vector databases, Node.js best practices
- `src/memory.js` — Per-session conversation memory (k=10 exchanges)
- `src/agent.js` — ReAct agent using `createAgent` from LangChain with GPT-4o
- `server.js` — Express server with health check, POST /api/chat, and GET /api/chat/stream (SSE)
- `public/index.html` — Dark-themed chat UI with streaming, tool badges, and source attribution
- `README.md` — Complete setup and usage documentation
- `aiDocs/context.md`, `aiDocs/prd.md` — Project context and requirements documentation
- `ai/roadmap.md` — Phased project roadmap with checkboxes
