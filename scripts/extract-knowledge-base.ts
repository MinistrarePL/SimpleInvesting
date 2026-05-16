#!/usr/bin/env node
/**
 * Ekstrakcja tekstu z PDF w knowledge_base/ → chunki JSONL + manifest + sync do Supabase.
 *
 * Uruchomienie: npm run extract:knowledge
 *
 * Wynik:
 * - knowledge_base/.generated/chunks.jsonl + manifest.json (gitignore),
 * - przy ustawionych PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY: tabela knowledge_chunks (patrz supabase-migration-knowledge.sql).
 */
import fs from 'fs';
import path from 'path';
import type { KnowledgeChunk } from '../src/lib/knowledge/types';
import { getProjectRoot } from '../src/lib/projectRoot';
import {
  chunkPagesIntoKnowledge,
  titleFromPdfBasename,
} from './lib/chunkKnowledgeFromPages';
import { extractPdfPages } from './lib/extractPdfPages';
import { syncKnowledgeChunksToSupabase } from './lib/syncKnowledgeToSupabase';

const KB_DIRNAME = 'knowledge_base';
const GENERATED = '.generated';

async function main(): Promise<void> {
  const root = getProjectRoot();
  const kbDir = path.join(root, KB_DIRNAME);
  const outDir = path.join(kbDir, GENERATED);

  if (!fs.existsSync(kbDir)) {
    console.error(`Brak katalogu ${KB_DIRNAME}/ w root projektu.`);
    process.exit(1);
  }

  const entries = fs.readdirSync(kbDir, { withFileTypes: true });
  const pdfFiles = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.pdf'))
    .map((e) => e.name)
    .sort();

  if (pdfFiles.length === 0) {
    console.error(`Brak plików .pdf w ${KB_DIRNAME}/`);
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });

  const allChunks: KnowledgeChunk[] = [];
  const sources: {
    file: string;
    pages: number;
    chunks: number;
  }[] = [];

  for (const name of pdfFiles) {
    const filePath = path.join(kbDir, name);
    const buffer = fs.readFileSync(filePath);
    process.stdout.write(`→ ${name} … `);
    const pages = await extractPdfPages(buffer);
    const title = titleFromPdfBasename(name);
    const chunks = chunkPagesIntoKnowledge({
      pages,
      sourceFile: name,
      sourceTitle: title,
    });
    allChunks.push(...chunks);
    sources.push({ file: name, pages: pages.length, chunks: chunks.length });
    console.log(`${pages.length} stron → ${chunks.length} chunków`);
  }

  const chunksPath = path.join(outDir, 'chunks.jsonl');
  const writeStream = fs.createWriteStream(chunksPath, { encoding: 'utf8' });
  for (const c of allChunks) {
    writeStream.write(`${JSON.stringify(c)}\n`);
  }
  await new Promise<void>((resolve, reject) => {
    writeStream.end((err: Error | null | undefined) =>
      err ? reject(err) : resolve(),
    );
  });

  const manifest = {
    generated_at: new Date().toISOString(),
    chunk_count: allChunks.length,
    pdf_count: pdfFiles.length,
    chunk_settings: {
      max_chars: 2400,
      overlap_chars: 450,
      min_window_chars: 100,
    },
    sources,
  };
  fs.writeFileSync(
    path.join(outDir, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );

  console.log(
    `\nZapisano ${allChunks.length} chunków → ${path.relative(root, chunksPath)}`,
  );

  await syncKnowledgeChunksToSupabase(allChunks, pdfFiles);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
