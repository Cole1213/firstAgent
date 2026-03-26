import { HNSWLib } from '@langchain/community/vectorstores/hnswlib';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from '@langchain/core/documents';
import { getEmbeddings, getVectorStorePath } from './vectorStore.js';
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
 * Ingest all .txt files from the documents/ directory into the HNSWLib vector store.
 * Splits documents into chunks, embeds them, and saves the index to disk.
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

    const text = fs.readFileSync(filePath, 'utf-8');
    const rawDoc = new Document({ pageContent: text, metadata: { source: file } });

    const chunks = await splitter.splitDocuments([rawDoc]);

    for (const chunk of chunks) {
      chunk.metadata = { ...chunk.metadata, source: file };
    }

    allDocs.push(...chunks);
    logger.info(`  → Split into ${chunks.length} chunk(s)`);
  }

  logger.info(`Total chunks to ingest: ${allDocs.length}`);

  const embeddings = getEmbeddings();
  const vectorStore = await HNSWLib.fromDocuments(allDocs, embeddings);

  const storePath = getVectorStorePath();
  await vectorStore.save(storePath);

  logger.info(`Successfully ingested ${allDocs.length} chunks and saved to ${storePath}.`);
}

ingestDocuments().catch((error) => {
  logger.error('Ingestion failed', { error: error.message });
  process.exit(1);
});
