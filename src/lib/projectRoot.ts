import path from 'path';
import { fileURLToPath } from 'url';

/** Katalog główny repozytorium (tam gdzie `package.json`). */
export function getProjectRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
}
