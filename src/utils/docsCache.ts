import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Respect configured base path from Vite/Astro
const BASE = import.meta.env.BASE_URL ?? '/';

export interface DocsCacheEntry {
  fileName: string;
  fullPath: string;
  slug: string;
}

function normalizeForCache(str: string): string {
  return str.toLowerCase().replace(/[,\s]+/g, '-');
}

export function generateDocsCache(): Map<string, string> {
  const docsDir = path.join(__dirname, '../../src/content/docs');
  const cache = new Map<string, string>();
  
  if (!fs.existsSync(docsDir)) {
    console.log('[docsCache] Docs directory not found:', docsDir);
    return cache;
  }
  
  function walkDir(dir: string, baseDir: string = docsDir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walkDir(fullPath, baseDir);
      } else if (file.endsWith('.md') || file.endsWith('.mdx')) {
        // Get relative path from docs dir
        const relativePath = path.relative(baseDir, fullPath);
        
        // Normalize the slug to match Astro's URL structure
        const slug = relativePath
          .replace(/\\/g, '/')
          .replace(/\.(md|mdx)$/, '')
          .split('/')
          .map(part => normalizeForCache(part))
          .join('/');
        
        const url = `${BASE}docs/${slug}`;
        
        // Get the filename without extension
        const fileName = path.basename(file, path.extname(file));
        
        // Store multiple lookup keys
        const lookupKeys = [
          // Just the filename (normalized)
          normalizeForCache(fileName),
          // The full slug
          slug,
          // Filename with spaces preserved (then normalized)
          fileName.toLowerCase(),
          // Original filename casing (normalized)
          fileName.replace(/\s+/g, '-').toLowerCase(),
        ];
        
        // Add all variations to cache
        lookupKeys.forEach(key => {
          if (!cache.has(key)) {
            cache.set(key, url);
            console.log(`[docsCache] Mapping: "${key}" -> ${url}`);
          }
        });
      }
    });
  }
  
  walkDir(docsDir);
  console.log(`[docsCache] Total entries: ${cache.size}`);
  console.log(`[docsCache] Sample keys:`, Array.from(cache.keys()).slice(0, 10));
  return cache;
}

// Generate and export the cache
export const docsCache = generateDocsCache();
