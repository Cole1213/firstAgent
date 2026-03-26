import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import logger from './src/logger.js';
import { runAgent, streamAgent } from './src/agent.js';
import { isVectorStoreReady } from './src/vectorStore.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Health check endpoint.
 * Returns server status and whether the vector store is ready.
 */
app.get('/api/health', async (_req, res) => {
  try {
    const vectorStoreReady = await isVectorStoreReady();
    res.json({ status: 'ok', vectorStoreReady });
  } catch {
    res.json({ status: 'ok', vectorStoreReady: false });
  }
});

/**
 * Non-streaming chat endpoint.
 * Expects { message, sessionId } in the request body.
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId = 'default' } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'A "message" string is required.' });
    }

    const result = await runAgent(message, sessionId);

    res.json({
      response: result.output,
      toolsUsed: result.toolsUsed,
      steps: result.steps
    });
  } catch (error) {
    logger.error('POST /api/chat error', { error: error.message });
    res.status(500).json({ error: 'An internal error occurred. Please try again.' });
  }
});

/**
 * SSE streaming chat endpoint.
 * Streams tokens and step updates as Server-Sent Events.
 */
app.get('/api/chat/stream', async (req, res) => {
  const { message, sessionId = 'default' } = req.query;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'A "message" query parameter is required.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const toolsUsed = [];

  try {
    const result = await streamAgent(
      message,
      sessionId,
      (token) => {
        res.write(`data: ${JSON.stringify({ type: 'token', content: token })}\n\n`);
      },
      (step) => {
        if (step.action?.tool && !toolsUsed.includes(step.action.tool)) {
          toolsUsed.push(step.action.tool);
        }
        res.write(`data: ${JSON.stringify({ type: 'step', step })}\n\n`);
      }
    );

    res.write(`data: ${JSON.stringify({ type: 'done', toolsUsed: result.toolsUsed || toolsUsed })}\n\n`);
  } catch (error) {
    logger.error('GET /api/chat/stream error', { error: error.message });
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'An internal error occurred. Please try again.' })}\n\n`);
  } finally {
    res.end();
  }
});

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);

  isVectorStoreReady().then((ready) => {
    if (ready) {
      logger.info('Vector store is ready with ingested documents.');
    } else {
      logger.warn(
        'Vector store has no documents or is not yet created. ' +
        'Run "npm run ingest" to embed documents into the vector store.'
      );
    }
  });
});
