import { createAgent } from 'langchain';
import { ChatOpenAI } from '@langchain/openai';
import { createCalculatorTool } from './tools/calculator.js';
import { createWebSearchTool } from './tools/webSearch.js';
import { createRagTool } from './tools/ragTool.js';
import { getSessionMessages, addExchange } from './memory.js';
import logger, { logAgentStep } from './logger.js';
import dotenv from 'dotenv';

dotenv.config();

const SYSTEM_PROMPT = `You are a helpful, knowledgeable research assistant with access to three tools:

1. **calculator** — Use this for any mathematical calculations. Always show the expression you are evaluating and the result.
2. **web_search** — Use this to find current information from the web. Indicate clearly when you are using web search results.
3. **knowledge_base_search** — Use this to search the internal document knowledge base. When using results from the knowledge base, always cite the source document name (e.g., "According to ai_overview.txt, …").

Guidelines:
- When answering math questions, show your calculation steps.
- When citing the knowledge base, always include the source document name.
- When using web search, mention that the information comes from a web search.
- If a question can be answered from the knowledge base, prefer it over web search.
- Be concise, accurate, and helpful.
- If you are unsure, say so rather than guessing.`;

const model = new ChatOpenAI({
  model: 'gpt-4o',
  temperature: 0,
  openAIApiKey: process.env.OPENAI_API_KEY
});

const tools = [
  createCalculatorTool(),
  createWebSearchTool(),
  createRagTool()
];

const agent = createAgent({
  model,
  tools,
  systemPrompt: SYSTEM_PROMPT
});

/**
 * Run the agent with a user input and return the final response.
 * Maintains per-session conversation memory.
 * @param {string} input - The user's message.
 * @param {string} sessionId - The unique session identifier.
 * @returns {Promise<{output: string, toolsUsed: string[]}>} The agent response and tools used.
 */
export async function runAgent(input, sessionId) {
  const history = getSessionMessages(sessionId);
  const messages = [
    ...history,
    { role: 'user', content: input }
  ];

  logger.info('Agent invoked', { sessionId, input: input.slice(0, 200) });

  const result = await agent.invoke({ messages });

  const allMessages = result.messages || [];
  const toolsUsed = [];
  const steps = [];

  for (const msg of allMessages) {
    if (msg.tool_calls && msg.tool_calls.length > 0) {
      for (const tc of msg.tool_calls) {
        toolsUsed.push(tc.name);
        const step = {
          action: { tool: tc.name, toolInput: JSON.stringify(tc.args) },
          observation: ''
        };
        steps.push(step);
        logAgentStep(step);
      }
    }
    if (msg.name && msg.content) {
      const lastStep = steps[steps.length - 1];
      if (lastStep) {
        lastStep.observation = typeof msg.content === 'string'
          ? msg.content.slice(0, 300)
          : String(msg.content);
      }
    }
  }

  const lastMessage = allMessages[allMessages.length - 1];
  const output = lastMessage?.content || 'I was unable to generate a response.';

  addExchange(sessionId, input, output);

  logger.info('Agent response generated', {
    sessionId,
    toolsUsed,
    outputLength: output.length
  });

  return { output, toolsUsed, steps };
}

/**
 * Stream agent output token-by-token and emit step updates.
 * @param {string} input - The user's message.
 * @param {string} sessionId - The unique session identifier.
 * @param {function} onToken - Callback invoked with each text token.
 * @param {function} onStep - Callback invoked with each agent step update.
 * @returns {Promise<{output: string, toolsUsed: string[]}>} The final response.
 */
export async function streamAgent(input, sessionId, onToken, onStep) {
  const history = getSessionMessages(sessionId);
  const messages = [
    ...history,
    { role: 'user', content: input }
  ];

  logger.info('Agent stream invoked', { sessionId, input: input.slice(0, 200) });

  const toolsUsed = [];
  let fullOutput = '';

  const stream = await agent.stream(
    { messages },
    { streamMode: ['updates', 'messages'] }
  );

  for await (const [mode, chunk] of stream) {
    if (mode === 'updates') {
      const [stepName, stepContent] = Object.entries(chunk)[0];

      if (stepName === 'tools' && stepContent?.messages) {
        for (const msg of stepContent.messages) {
          if (msg.name) {
            toolsUsed.push(msg.name);
            const step = {
              action: { tool: msg.name, toolInput: '' },
              observation: typeof msg.content === 'string'
                ? msg.content.slice(0, 300)
                : String(msg.content)
            };
            logAgentStep(step);
            if (onStep) onStep(step);
          }
        }
      }

      if (stepContent?.messages) {
        for (const msg of stepContent.messages) {
          if (msg.tool_calls && msg.tool_calls.length > 0) {
            for (const tc of msg.tool_calls) {
              if (!toolsUsed.includes(tc.name)) {
                toolsUsed.push(tc.name);
              }
              if (onStep) {
                onStep({
                  action: { tool: tc.name, toolInput: JSON.stringify(tc.args) },
                  observation: 'pending'
                });
              }
            }
          }
        }
      }
    }

    if (mode === 'messages') {
      const [token, metadata] = Array.isArray(chunk) ? chunk : [chunk, {}];

      if (token?.contentBlocks && token.contentBlocks.length > 0) {
        for (const block of token.contentBlocks) {
          if (block.type === 'text' && block.text) {
            fullOutput += block.text;
            if (onToken) onToken(block.text);
          }
        }
      } else if (typeof token?.content === 'string' && token.content) {
        fullOutput += token.content;
        if (onToken) onToken(token.content);
      }
    }
  }

  if (!fullOutput) {
    fullOutput = 'I was unable to generate a response.';
  }

  addExchange(sessionId, input, fullOutput);

  logger.info('Agent stream completed', {
    sessionId,
    toolsUsed,
    outputLength: fullOutput.length
  });

  return { output: fullOutput, toolsUsed };
}
