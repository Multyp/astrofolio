import { getCollection } from 'astro:content';

// Use Vite/Astro base URL so generated paths respect `astro.config.mjs` `base`
const BASE = import.meta.env.BASE_URL ?? '/';
export interface DocPage {
  slug: string;
  title: string;
  displayTitle: string;
  path: string;
  depth: number;
  parent?: string;
}

export interface FolderNode {
  name: string;
  displayName: string;
  path: string;
  children: FolderNode[];
  files: DocPage[];
}

export async function getAllDocs(): Promise<DocPage[]> {
  const docs = await getCollection('docs');
  
  return docs.map(doc => {
    const parts = doc.slug.split('/');
    const fileName = parts[parts.length - 1];
    const title = doc.data.title || formatTitleForUrl(fileName);
    const displayTitle = doc.data.title || fileName.replace(/-/g, ' ');
    
    return {
      slug: doc.slug,
      title,
      displayTitle,
      path: `${BASE}docs/${doc.slug}`,
      depth: parts.length - 1,
      parent: parts.length > 1 ? parts.slice(0, -1).join('/') : undefined,
    };
  }).sort((a, b) => a.path.localeCompare(b.path));
}

export function buildFolderTree(docs: DocPage[]): FolderNode {
  const root: FolderNode = {
    name: 'root',
    displayName: 'root',
    path: '',
    children: [],
    files: [],
  };

  const folderMap = new Map<string, FolderNode>();
  folderMap.set('', root);

  // First pass: create all folders
  docs.forEach(doc => {
    const parts = doc.slug.split('/');
    let currentPath = '';

    parts.slice(0, -1).forEach((part, i) => {
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (!folderMap.has(currentPath)) {
        const folder: FolderNode = {
          name: formatTitleForUrl(part),
          displayName: part.replace(/-/g, ' '),
          path: currentPath,
          children: [],
          files: [],
        };
        folderMap.set(currentPath, folder);

        const parent = folderMap.get(parentPath)!;
        parent.children.push(folder);
      }
    });
  });

  // Second pass: add files to their folders
  docs.forEach(doc => {
    const parts = doc.slug.split('/');
    const folderPath = parts.slice(0, -1).join('/');
    const folder = folderMap.get(folderPath)!;
    folder.files.push(doc);
  });

  return root;
}

function formatTitleForUrl(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

// Process Obsidian-style [[links]] in markdown content
export function processObsidianLinks(content: string, allDocs: DocPage[]): string {
  // Create a map for quick lookup
  const slugMap = new Map<string, DocPage>();
  allDocs.forEach(doc => {
    // Store by filename without extension
    const fileName = doc.slug.split('/').pop() || '';
    slugMap.set(fileName.toLowerCase(), doc);
    // Also store the full slug
    slugMap.set(doc.slug.toLowerCase(), doc);
  });

  // Replace [[Link Text]] or [[link|Display Text]]
  return content.replace(/\[\[([^\]]+)\]\]/g, (match, linkContent) => {
    const parts = linkContent.split('|');
    const linkTarget = parts[0].trim();
    const displayText = parts[1] ? parts[1].trim() : linkTarget;
    
    // Try to find the doc by various methods
    const normalizedTarget = linkTarget.toLowerCase().replace(/\s+/g, '-');
    let targetDoc = slugMap.get(normalizedTarget);
    
    // Try without dashes
    if (!targetDoc) {
      targetDoc = slugMap.get(linkTarget.toLowerCase());
    }
    
    // Search through all docs for a match
    if (!targetDoc) {
      targetDoc = allDocs.find(doc => {
        const docName = doc.slug.split('/').pop()?.toLowerCase() || '';
        return docName === normalizedTarget || 
               docName.replace(/-/g, ' ') === linkTarget.toLowerCase() ||
               doc.displayTitle.toLowerCase() === linkTarget.toLowerCase();
      });
    }
    
    if (targetDoc) {
      return `<a href="${targetDoc.path}" class="obsidian-link">${displayText}</a>`;
    }
    
    // If no match found, return as plain text with a class for styling
    return `<span class="broken-link">${displayText}</span>`;
  });
}
