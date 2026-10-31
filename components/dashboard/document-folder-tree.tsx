"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown, Folder, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buildLibraryTree, type LibraryTreeFolder, type LibraryTreeDocument, type LibraryTreeNode } from "@/lib/library-tree";

interface Props<F extends LibraryTreeFolder, D extends LibraryTreeDocument> {
  folders: readonly F[];
  documents: readonly D[];
  currentFolderId: string | null;
  expandedFolderIds: ReadonlySet<string>;
  filtering: boolean;
  onSelectFolder: (id: string | null) => void;
  onToggleFolder: (id: string) => void;
  renderDocument: (document: D) => ReactNode;
}

export function DocumentFolderTree<F extends LibraryTreeFolder, D extends LibraryTreeDocument>({
  folders, documents, currentFolderId, expandedFolderIds, filtering,
  onSelectFolder, onToggleFolder, renderDocument,
}: Props<F, D>) {
  const tree = buildLibraryTree(folders, documents, filtering);
  const prefix = useId();
  const [closedSearchFolders, setClosedSearchFolders] = useState<Set<string>>(() => new Set());

  function renderFolder(node: LibraryTreeNode<F, D>): ReactNode {
    const { folder, children, documents } = node;
    const expanded = filtering ? !closedSearchFolders.has(folder.id) : expandedFolderIds.has(folder.id);
    const groupId = `${prefix}-${folder.id}`;
    const Icon = expanded ? FolderOpen : Folder;
    return (
      <li key={folder.id}>
        <div className={cn("flex min-w-0 items-center gap-2 rounded-md py-1 pe-2 hover:bg-muted", currentFolderId === folder.id && "bg-muted")}>
          <Button variant="ghost" size="icon" className="size-8 shrink-0" aria-label={`${expanded ? "Collapse" : "Expand"} ${folder.name}`} aria-expanded={expanded} aria-controls={groupId} onClick={() => {
            if (!filtering) return onToggleFolder(folder.id);
            setClosedSearchFolders((previous) => {
              const next = new Set(previous);
              if (next.has(folder.id)) next.delete(folder.id); else next.add(folder.id);
              return next;
            });
          }}>
            <ChevronDown className={cn("transition-transform", !expanded && "-rotate-90 rtl:rotate-90")} />
          </Button>
          <Icon className="size-5 shrink-0 text-primary" aria-hidden="true" />
          <button type="button" className="min-w-0 flex-1 break-words text-start font-medium text-foreground hover:text-primary" aria-current={currentFolderId === folder.id ? "location" : undefined} onClick={() => {
            setClosedSearchFolders((previous) => {
              const next = new Set(previous);
              next.delete(folder.id);
              return next;
            });
            onSelectFolder(folder.id);
          }}>
            {folder.name}
          </button>
          <span className="shrink-0 text-sm text-muted-foreground">{documents.length} files</span>
        </div>
        <ul id={groupId} aria-label={`Contents of ${folder.name}`} hidden={!expanded} className={cn("ms-3 flex-col gap-1 border-s border-border ps-2 sm:ms-5", expanded ? "flex" : "hidden")}>
          {children.map(renderFolder)}
          {documents.map((document) => <li key={document.id}>{renderDocument(document)}</li>)}
          {!children.length && !documents.length && <li className="px-2 py-3 text-muted-foreground">Empty folder</li>}
        </ul>
      </li>
    );
  }

  return (
    <nav aria-label="HSE document library" className="flex min-w-0 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 px-2 py-2">
        <FolderOpen className="size-5 shrink-0 text-primary" aria-hidden="true" />
        <button type="button" className="font-semibold text-primary hover:underline" aria-current={currentFolderId === null ? "location" : undefined} onClick={() => onSelectFolder(null)}>Library</button>
        <span className="text-sm text-muted-foreground">({documents.length} files · {folders.length} folders)</span>
      </div>
      <ul className="flex min-w-0 flex-col gap-1">
        {tree.folders.map(renderFolder)}
        {tree.documents.map((document) => <li key={document.id}>{renderDocument(document)}</li>)}
      </ul>
      {!tree.folders.length && !tree.documents.length && <p role="status" className="px-2 py-6 text-muted-foreground">{filtering ? "No matching files found" : "No files in this company library"}</p>}
    </nav>
  );
}
