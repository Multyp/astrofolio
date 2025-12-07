import { getCollection } from 'astro:content';
import path from 'path';

export interface DocPage {
  slug: string;
  title: string;
  path: string;
  depth: number;
  parent?: string;
}

export interface FolderNode {
  name: string;
  path: string;
  children: FolderNode[];
  files: DocPage[];
}

export async function getAllDocs(): Promise<DocPage[]> {
  const docs = await getCollection('docs');
  
interface DocCollection {
    slug: string;
    data: {
        title?: string;
    };
}

interface DocParts {
    parts: string[];
    title: string;
}

return docs.map((doc: DocCollection): DocPage => {
        const parts: string[] = doc.slug.split('/');
        const title: string = doc.data.title || formatTitle(parts[parts.length - 1]);
        
        return {
                slug: doc.slug,
                title,
                path: `/docs/${doc.slug}`,
                depth: parts.length - 1,
                parent: parts.length > 1 ? parts.slice(0, -1).join('/') : undefined,
        };
}).sort((a: DocPage, b: DocPage) => a.path.localeCompare(b.path));
}

export function buildFolderTree(docs: DocPage[]): FolderNode {
  const root: FolderNode = {
    name: 'root',
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
          name: formatTitle(part),
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

function formatTitle(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}
