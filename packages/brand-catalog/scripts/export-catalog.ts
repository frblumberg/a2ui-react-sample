/**
 * Schreibt den Marken-Katalog als JSON (z. B. für die Katalog-Registry
 * oder als Kontext für den System-Prompt eines LLM-Agenten).
 *   npm run catalog:export
 */
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {brandCatalogSchema as brandCatalog} from '../src/schema';

const target = fileURLToPath(new URL('../catalog.json', import.meta.url));
writeFileSync(target, JSON.stringify(brandCatalog.toJson(), null, 2));
console.log(`Katalog ${brandCatalog.id} → ${target}`);
