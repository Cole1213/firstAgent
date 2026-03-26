import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsDir = path.join(__dirname, '..', 'logs');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `[${timestamp}] ${level}: ${message}${metaStr}`;
        })
      )
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'agent.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ]
});

/**
 * Log a tool invocation with its name, input arguments, result summary, and latency.
 * @param {string} toolName - The name of the tool invoked.
 * @param {string} input - The input passed to the tool.
 * @param {string} result - A summary of the tool's result.
 * @param {number} [latencyMs] - Optional latency in milliseconds.
 */
export function logToolCall(toolName, input, result, latencyMs) {
  logger.info('Tool call executed', {
    event: 'tool_call',
    tool: toolName,
    input,
    result: typeof result === 'string' ? result.slice(0, 500) : String(result),
    ...(latencyMs !== undefined && { latencyMs })
  });
}

/**
 * Log an intermediate reasoning step from the agent.
 * @param {object} step - The agent's intermediate step object.
 */
export function logAgentStep(step) {
  logger.info('Agent step', {
    event: 'agent_step',
    action: step.action?.tool || 'unknown',
    input: step.action?.toolInput || '',
    observation: typeof step.observation === 'string'
      ? step.observation.slice(0, 300)
      : String(step.observation)
  });
}

export default logger;
