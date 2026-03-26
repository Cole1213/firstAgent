import { Chroma } from '@langchain/community/vectorstores/chroma';
import { OpenAIEmbeddings } from '@langchain/openai';
import dotenv from 'dotenv';

dotenv.config();

let vectorStoreInstance = null;

/**
 * Initialise or retrieve the persistent ChromaDB vector store.
 * Uses OpenAI text-embedding-3-small for embeddings.
 * @returns {Promise<Chroma>} The ChromaDB vector store instance.
 */
export async function getVectorStore() {
  if (vectorStoreInstance) {
    return vectorStoreInstance;
  }

  const embeddings = new OpenAIEmbeddings({
    modelName: 'text-embedding-3-small',
    openAIApiKey: process.env.OPENAI_API_KEY
  });

  vectorStoreInstance = new Chroma(embeddings, {
    collectionName: process.env.COLLECTION_NAME || 'agent_documents',
    url: 'http://localhost:8000',
    collectionMetadata: {
      'hnsw:space': 'cosine'
    }
  });

  return vectorStoreInstance;
}

/**
 * Check whether the vector store is reachable and has documents.
 * @returns {Promise<boolean>} True if the vector store has at least one document.
 */
export async function isVectorStoreReady() {
  try {
    const store = await getVectorStore();
    const results = await store.similaritySearch('test', 1);
    return results.length > 0;
  } catch {
    return false;
  }
}
