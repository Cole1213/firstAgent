import { DynamicTool } from '@langchain/core/tools';
import { TavilySearch } from '@langchain/tavily';
import { logToolCall } from '../logger.js';

let tavilyInstance = null;

function getTavily() {
  if (!tavilyInstance) {
    tavilyInstance = new TavilySearch({
      maxResults: 3,
      tavilyApiKey: process.env.TAVILY_API_KEY
    });
  }
  return tavilyInstance;
}

/**
 * Web search tool powered by the Tavily API.
 * Returns a DynamicTool that wraps TavilySearch for consistent logging.
 * @returns {DynamicTool} The web search tool instance.
 */
export function createWebSearchTool() {
  return new DynamicTool({
    name: 'web_search',
    description:
      'Searches the web for current information. Use this when the user asks about recent events, news, or information that may not be in the knowledge base. Input should be a search query string.',
    func: async (input) => {
      const startTime = Date.now();
      try {
        const tavily = getTavily();
        const rawResults = await tavily.invoke({ query: input });
        const latencyMs = Date.now() - startTime;

        let resultItems = [];
        if (typeof rawResults === 'string') {
          try {
            const parsed = JSON.parse(rawResults);
            resultItems = Array.isArray(parsed) ? parsed : (parsed.results || []);
          } catch {
            logToolCall('web_search', input, 'raw string result', latencyMs);
            return rawResults;
          }
        } else if (Array.isArray(rawResults)) {
          resultItems = rawResults;
        } else if (rawResults && typeof rawResults === 'object') {
          resultItems = rawResults.results || [];
        }

        let formatted;
        if (resultItems.length > 0) {
          formatted = resultItems
            .map((r, i) => `Result ${i + 1}: ${r.title || 'No title'}\nURL: ${r.url || 'N/A'}\n${r.content || r.snippet || ''}`)
            .join('\n\n');
        } else {
          formatted = 'No results found for this query.';
        }

        logToolCall('web_search', input, `${resultItems.length} results returned`, latencyMs);
        return formatted;
      } catch (error) {
        const latencyMs = Date.now() - startTime;
        const errorMsg = `Web search error: ${error.message}`;
        logToolCall('web_search', input, errorMsg, latencyMs);
        return errorMsg;
      }
    }
  });
}
