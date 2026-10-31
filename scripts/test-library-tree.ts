import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildLibraryTree, getLibraryFolderPath } from '../lib/library-tree';

const folders = [
  { id: 'root', parent_id: null, name: 'Safety' },
  { id: 'child', parent_id: 'root', name: 'Policies' },
  { id: 'deep', parent_id: 'child', name: '2026' },
  { id: 'empty', parent_id: null, name: 'Empty' },
];
const documents = [
  { id: 'root-file', folder_id: null },
  { id: 'nested-file', folder_id: 'deep' },
  { id: 'child-file', folder_id: 'child' },
];

test('keeps root files, nested folders and direct files at their own level without mutation', () => {
  const before = JSON.stringify({ folders, documents });
  const tree = buildLibraryTree(folders, documents);
  assert.deepEqual(tree.documents.map((doc) => doc.id), ['root-file']);
  assert.deepEqual(tree.folders.map((node) => node.folder.id), ['root', 'empty']);
  const child = tree.folders[0].children[0];
  assert.deepEqual(child.documents.map((doc) => doc.id), ['child-file']);
  assert.deepEqual(child.children[0].documents.map((doc) => doc.id), ['nested-file']);
  assert.equal(JSON.stringify({ folders, documents }), before);
});

test('filtered results preserve ancestor folders and prune unrelated empty branches', () => {
  const tree = buildLibraryTree(folders, [documents[1]], true);
  assert.equal(tree.folders.length, 1);
  assert.equal(tree.folders[0].children[0].children[0].documents[0].id, 'nested-file');
  assert.deepEqual(buildLibraryTree(folders, [], true), { folders: [], documents: [] });
});

test('breadcrumbs follow parents from root to selected folder', () => {
  assert.deepEqual(getLibraryFolderPath(folders, 'deep').map((folder) => folder.id), ['root', 'child', 'deep']);
  assert.deepEqual(getLibraryFolderPath(folders, null), []);
  assert.deepEqual(getLibraryFolderPath(folders, 'missing'), []);
});

test('orphan folders and files remain accessible without changing stored relationships', () => {
  const orphan = { id: 'orphan', parent_id: 'missing', name: 'Recovered' };
  const file = { id: 'file', folder_id: 'missing' };
  const tree = buildLibraryTree([orphan], [file]);
  assert.equal(tree.folders[0].folder, orphan);
  assert.equal(tree.documents[0], file);
  assert.equal(orphan.parent_id, 'missing');
  assert.equal(file.folder_id, 'missing');
});

test('cycles and self-parenting cannot loop or hide existing records', () => {
  const cyclic = [
    { id: 'a', parent_id: 'b', name: 'A' },
    { id: 'b', parent_id: 'a', name: 'B' },
    { id: 'self', parent_id: 'self', name: 'Self' },
  ];
  const tree = buildLibraryTree(cyclic, [{ id: 'cycle-file', folder_id: 'b' }]);
  assert.equal(tree.folders.length, 2);
  assert.equal(tree.folders[0].children[0].documents[0].id, 'cycle-file');
  assert.equal(tree.folders[0].children[0].children.length, 0);
  assert.equal(getLibraryFolderPath(cyclic, 'a').length, 2);
  assert.equal(getLibraryFolderPath(cyclic, 'self').length, 1);
});
