import { DynamicTool } from '@langchain/core/tools';
import { create, all } from 'mathjs';
import { logToolCall } from '../logger.js';

const math = create(all, {});

/**
 * Calculator tool that evaluates mathematical expressions using mathjs.
 * Returns a DynamicTool compatible with LangChain agents.
 * @returns {DynamicTool} The calculator tool instance.
 */
export function createCalculatorTool() {
  return new DynamicTool({
    name: 'calculator',
    description:
      'Evaluates mathematical expressions. Input should be a valid math expression string like \'2 + 2\' or \'sqrt(144)\'. Use this for any arithmetic or math calculations.',
    func: async (input) => {
      const startTime = Date.now();
      try {
        const result = math.evaluate(input);
        const resultStr = String(result);
        const latencyMs = Date.now() - startTime;
        logToolCall('calculator', input, resultStr, latencyMs);
        return resultStr;
      } catch (error) {
        const errorMsg = `Calculation error: ${error.message}`;
        const latencyMs = Date.now() - startTime;
        logToolCall('calculator', input, errorMsg, latencyMs);
        return errorMsg;
      }
    }
  });
}
