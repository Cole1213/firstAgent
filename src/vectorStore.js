import { HNSWLib } from '@langchain/community/vectorstores/hnswlib';
import { OpenAIEmbeddings } from '@langchain/openai';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const VECTOR_STORE_PATH = process.env.VECTOR_STORE_PATH || './vector_store';

let vectorStoreInstance = null;

/**
 * Get the shared embeddings model instance.
 * @returns {OpenAIEmbeddings}
 */
export function getEmbeddings() {
  return new OpenAIEmbeddings({
    modelName: 'text-embedding-3-small',
    openAIApiKey: process.env.OPENAI_API_KEY
  });
}

/**
 * Initialise or retrieve the persistent HNSWLib vector store.
 * Loads from disk if a saved index exists; otherwise returns null.
 * @returns {Promise<HNSWLib|null>} The vector store instance, or null if not yet ingested.
 */
export async function getVectorStore() {
  if (vectorStoreInstance) {
    return vectorStoreInstance;
  }

  if (fs.existsSync(VECTOR_STORE_PATH)) {
    vectorStoreInstance = await HNSWLib.load(VECTOR_STORE_PATH, getEmbeddings());
    return vectorStoreInstance;
  }

  return null;
}

/**
 * Check whether the vector store exists on disk and has documents.
 * @returns {Promise<boolean>} True if the vector store is loadable and has data.
 */
export async function isVectorStoreReady() {
  try {
    const store = await getVectorStore();
    if (!store) return false;
    const results = await store.similaritySearch('test', 1);
    return results.length > 0;
  } catch {
    return false;
  }
}

/**
 * Returns the configured vector store directory path.
 * @returns {string}
 */
export function getVectorStorePath() {
  return VECTOR_STORE_PATH;
}
