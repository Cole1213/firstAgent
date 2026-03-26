import { Chroma } from '@langchain/community/vectorstores/chroma';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const documentsDir = path.join(__dirname, '..', 'documents');

/**
 * Ingest all .txt files from the documents/ directory into ChromaDB.
 * Splits documents into chunks and upserts them with source metadata.
 */
async function ingestDocuments() {
  logger.info('Starting document ingestion...');

  const files = fs.readdirSync(documentsDir).filter((f) => f.endsWith('.txt'));

  if (files.length === 0) {
    logger.warn('No .txt files found in documents/ directory.');
    return;
  }

  logger.info(`Found ${files.length} document(s) to ingest.`);

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50
  });

  const allDocs = [];

  for (const file of files) {
    const filePath = path.join(documentsDir, file);
    logger.info(`Loading: ${file}`);

    const loader = new TextLoader(filePath);
    const rawDocs = await loader.load();

    const chunks = await splitter.splitDocuments(rawDocs);

    for (const chunk of chunks) {
      chunk.metadata = { ...chunk.metadata, source: file };
    }

    allDocs.push(...chunks);
    logger.info(`  → Split into ${chunks.length} chunk(s)`);
  }

  logger.info(`Total chunks to ingest: ${allDocs.length}`);

  const embeddings = new OpenAIEmbeddings({
    modelName: 'text-embedding-3-small',
    openAIApiKey: process.env.OPENAI_API_KEY
  });

  await Chroma.fromDocuments(allDocs, embeddings, {
    collectionName: process.env.COLLECTION_NAME || 'agent_documents',
    url: 'http://localhost:8000',
    collectionMetadata: {
      'hnsw:space': 'cosine'
    }
  });

  logger.info(`Successfully ingested ${allDocs.length} chunks into ChromaDB.`);
}

ingestDocuments().catch((error) => {
  logger.error('Ingestion failed', { error: error.message });
  process.exit(1);
});
