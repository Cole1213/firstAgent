import { DynamicTool } from '@langchain/core/tools';
import { getVectorStore } from '../vectorStore.js';
import { logToolCall } from '../logger.js';

/**
 * Knowledge base search tool that queries the HNSWLib vector store.
 * Performs similarity search and returns results with source attribution.
 * @returns {DynamicTool} The RAG tool instance.
 */
export function createRagTool() {
  return new DynamicTool({
    name: 'knowledge_base_search',
    description:
      'Searches the internal knowledge base of ingested documents. Use this when answering questions about topics that may be covered in the stored documents. Input should be a question or search query. Returns relevant passages with their source document.',
    func: async (input) => {
      const startTime = Date.now();
      try {
        const vectorStore = await getVectorStore();
        const results = await vectorStore.similaritySearch(input, 3);
        const latencyMs = Date.now() - startTime;

        if (results.length === 0) {
          const msg = 'No relevant documents found in the knowledge base.';
          logToolCall('knowledge_base_search', input, msg, latencyMs);
          return msg;
        }

        const formatted = results
          .map((doc, i) => {
            const source = doc.metadata?.source || 'unknown';
            return `Result ${i + 1} (Source: ${source}):\n${doc.pageContent}`;
          })
          .join('\n\n');

        const sources = results.map((d) => d.metadata?.source || 'unknown').join(', ');
        logToolCall('knowledge_base_search', input, `${results.length} results from: ${sources}`, latencyMs);
        return formatted;
      } catch (error) {
        const latencyMs = Date.now() - startTime;
        const errorMsg = `Knowledge base search error: ${error.message}`;
        logToolCall('knowledge_base_search', input, errorMsg, latencyMs);
        return errorMsg;
      }
    }
  });
}
