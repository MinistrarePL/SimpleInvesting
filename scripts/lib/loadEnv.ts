/**
 * Ładuje zmienne z pliku .env w katalogu głównym projektu (dla skryptów CLI).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export function loadEnv(): Record<string, string> {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const envPath = path.join(root, '.env');
  const env: Record<string, string> = {};
  if (!fs.existsSync(envPath)) {
    console.warn('Brak pliku .env w katalogu projektu:', envPath);
    return env;
  }
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    env[key] = value;
  }
  return env;
}

export function getRootDir(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
}
