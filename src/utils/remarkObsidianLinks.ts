import { visit } from 'unist-util-visit';
import type { Root, Text, Parent, Link } from 'mdast';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Respect configured base path from Vite/Astro
const BASE = process.env.BASE_URL || import.meta.env.BASE_URL || '/astrofolio/';

// Normalize function - removes spaces, commas, and special chars
function normalize(str: string): string {
  return str.toLowerCase().replace(/[,\s]+/g, '-');
}

// Build cache inline to ensure it's always available
function buildDocsCache(): Map<string, string> {
  const docsDir = path.join(__dirname, '../content/docs');
  const cache = new Map<string, string>();
  
  if (!fs.existsSync(docsDir)) {
    console.error('[remarkObsidianLinks] Docs directory not found:', docsDir);
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
        const relativePath = path.relative(baseDir, fullPath);
        
        // Normalize slug to match Astro's format
        const slug = relativePath
          .replace(/\\/g, '/')
          .replace(/\.(md|mdx)$/, '')
          .split('/')
          .map(part => normalize(part))
          .join('/');
        
        const url = `${BASE}docs/${slug}`;
        const fileName = path.basename(file, path.extname(file));
        
        // Store with normalized filename as key
        const normalizedFileName = normalize(fileName);
        cache.set(normalizedFileName, url);
        
        console.log(`[remarkObsidianLinks] Indexed: "${normalizedFileName}" -> ${url}`);
      }
    });
  }
  
  walkDir(docsDir);
  console.log(`[remarkObsidianLinks] Cache built with ${cache.size} entries`);
  return cache;
}

export function remarkObsidianLinks() {
  const cache = buildDocsCache();
  
  return function transformer(tree: Root) {
    console.log('[remarkObsidianLinks] Transformer running, cache size:', cache.size);
    
    visit(tree, 'text', (node: Text, index: number | undefined, parent: Parent | undefined) => {
      if (!node.value || !parent || index === null) return;
      
      const obsidianLinkRegex = /\[\[([^\]]+)\]\]/g;
      const matches = [...node.value.matchAll(obsidianLinkRegex)];
      
      if (matches.length === 0) return;
      
      console.log(`[remarkObsidianLinks] Found ${matches.length} Obsidian links in text`);
      
      const newNodes: (Text | Link | any)[] = [];
      let lastIndex = 0;
      
      matches.forEach(match => {
        const fullMatch = match[0];
        const linkContent = match[1];
        const matchIndex = match.index!;
        
        // Add text before the link
        if (matchIndex > lastIndex) {
          newNodes.push({
            type: 'text',
            value: node.value.slice(lastIndex, matchIndex)
          });
        }
        
        // Parse link content (handle [[Link]] and [[Link|Display Text]])
        const parts = linkContent.split('|');
        const linkTarget = parts[0].trim();
        const displayText = parts[1] ? parts[1].trim() : linkTarget;
        
        // Normalize the link target
        const normalizedTarget = normalize(linkTarget);
        
        console.log(`[remarkObsidianLinks] Processing link: "${linkTarget}" -> normalized: "${normalizedTarget}"`);
        
        // Look up in cache
        const targetPath = cache.get(normalizedTarget);
        
        if (targetPath) {
          console.log(`[remarkObsidianLinks] ✓ Resolved to: ${targetPath}`);
          newNodes.push({
            type: 'link',
            url: targetPath,
            children: [{ type: 'text', value: displayText }],
            data: {
              hProperties: {
                className: ['obsidian-link']
              }
            }
          });
        } else {
          console.log(`[remarkObsidianLinks] ✗ Link not found in cache`);
          console.log(`[remarkObsidianLinks] Available keys:`, Array.from(cache.keys()).slice(0, 10));
          newNodes.push({
            type: 'html',
            value: `<span class="broken-link" title="Link target not found: ${linkTarget}">${displayText}</span>`
          });
        }
        
        lastIndex = matchIndex + fullMatch.length;
      });
      
      // Add remaining text
      if (lastIndex < node.value.length) {
        newNodes.push({
          type: 'text',
          value: node.value.slice(lastIndex)
        });
      }
      
      // Replace the node with new nodes
      if (newNodes.length > 0 && index !== undefined) {
        parent.children.splice(index, 1, ...newNodes);
      }
    });
  };
}
