export interface LibraryTreeFolder {
  id: string;
  parent_id: string | null;
  name: string;
}

export interface LibraryTreeDocument {
  id: string;
  folder_id: string | null;
}

export interface LibraryTreeNode<F, D> {
  folder: F;
  children: LibraryTreeNode<F, D>[];
  documents: D[];
}

export function buildLibraryTree<F extends LibraryTreeFolder, D extends LibraryTreeDocument>(
  folders: readonly F[],
  documents: readonly D[],
  hideEmpty = false,
) {
  const folderIds = new Set(folders.map((folder) => folder.id));
  const children = new Map<string | null, F[]>();
  const files = new Map<string | null, D[]>();
  for (const folder of folders) {
    const parent = folderIds.has(folder.parent_id ?? "") ? folder.parent_id : null;
    children.set(parent, [...(children.get(parent) ?? []), folder]);
  }
  for (const document of documents) {
    const parent = folderIds.has(document.folder_id ?? "") ? document.folder_id : null;
    files.set(parent, [...(files.get(parent) ?? []), document]);
  }
  const visited = new Set<string>();
  function visit(folder: F): LibraryTreeNode<F, D> | null {
    if (visited.has(folder.id)) return null;
    visited.add(folder.id);
    const descendants = (children.get(folder.id) ?? [])
      .map(visit)
      .filter((node): node is LibraryTreeNode<F, D> => node !== null);
    const documents = files.get(folder.id) ?? [];
    if (hideEmpty && !descendants.length && !documents.length) return null;
    return { folder, children: descendants, documents };
  }
  const roots: LibraryTreeNode<F, D>[] = [];
  for (const folder of [...(children.get(null) ?? []), ...folders]) {
    const node = visit(folder);
    if (node) roots.push(node);
  }
  return { folders: roots, documents: files.get(null) ?? [] };
}

export function getLibraryFolderPath<F extends LibraryTreeFolder>(folders: readonly F[], id: string | null): F[] {
  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const path: F[] = [];
  const visited = new Set<string>();
  let cursor = id ? byId.get(id) : undefined;
  while (cursor && !visited.has(cursor.id)) {
    visited.add(cursor.id);
    path.unshift(cursor);
    cursor = cursor.parent_id ? byId.get(cursor.parent_id) : undefined;
  }
  return path;
}
