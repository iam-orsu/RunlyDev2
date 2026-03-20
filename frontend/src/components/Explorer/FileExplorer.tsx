'use client';

import { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import {
  ChevronRight, ChevronDown, Folder, FolderOpen,
  FilePlus, FolderPlus,
} from 'lucide-react';
import { FileNode, generateFileId } from '@/types';
import ContextMenu, { ContextMenuItem } from './ContextMenu';

interface FileExplorerProps {
  files: FileNode[];
  activeFileId: string | null;
  onFileSelect: (file: FileNode) => void;
  onFilesChange: (files: FileNode[]) => void;
}

// ─── File icon by extension ───────────────────────────────────
function getFileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    py: '🐍', js: '⬢', ts: '⬢', c: '🔧', cpp: '⚙️', h: '📄',
    java: '☕', go: '🐹', rs: '🦀', php: '🐘', rb: '💎',
    json: '📦', md: '📝', txt: '📄', css: '🎨', html: '🌐',
  };
  return map[ext || ''] || '📄';
}

// ─── Tree manipulation helpers ────────────────────────────────
function addNodeToTree(nodes: FileNode[], parentId: string | null, newNode: FileNode): FileNode[] {
  if (parentId === null) return [...nodes, newNode];
  return nodes.map(n => {
    if (n.id === parentId && n.type === 'folder') {
      return { ...n, children: [...(n.children || []), newNode] };
    }
    if (n.children) {
      return { ...n, children: addNodeToTree(n.children, parentId, newNode) };
    }
    return n;
  });
}

function removeNodeFromTree(nodes: FileNode[], targetId: string): FileNode[] {
  return nodes
    .filter(n => n.id !== targetId)
    .map(n => n.children ? { ...n, children: removeNodeFromTree(n.children, targetId) } : n);
}

function renameNodeInTree(nodes: FileNode[], targetId: string, newName: string): FileNode[] {
  return nodes.map(n => {
    if (n.id === targetId) return { ...n, name: newName };
    if (n.children) return { ...n, children: renameNodeInTree(n.children, targetId, newName) };
    return n;
  });
}

function findFirstFile(nodes: FileNode[]): FileNode | null {
  for (const n of nodes) {
    if (n.type === 'file') return n;
    if (n.children) {
      const found = findFirstFile(n.children);
      if (found) return found;
    }
  }
  return null;
}

export default function FileExplorer({ files, activeFileId, onFileSelect, onFilesChange }: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{
    x: number; y: number; node: FileNode | null;
  } | null>(null);

  // Inline creation/rename state
  const [inlineInput, setInlineInput] = useState<{
    type: 'new-file' | 'new-folder' | 'rename';
    parentId: string | null;
    nodeId?: string;         // only for rename
    value: string;
  } | null>(null);

  // Delete confirm modal
  const [deleteTarget, setDeleteTarget] = useState<FileNode | null>(null);

  const inlineRef = useRef<HTMLInputElement>(null);
  const shouldFocusRef = useRef(false);

  // Focus inline input ONLY when it first appears (not on every value change)
  useLayoutEffect(() => {
    if (shouldFocusRef.current && inlineRef.current) {
      inlineRef.current.focus();
      inlineRef.current.select();
      shouldFocusRef.current = false;
    }
  });

  // ─── Toggle folder ──────────────────────────────────────────
  const toggleFolder = useCallback((id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // ─── Context menu ───────────────────────────────────────────
  const openContextMenu = useCallback((e: React.MouseEvent, node: FileNode | null) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // ─── New file (inline) ──────────────────────────────────────
  const startNewFile = useCallback((parentId: string | null) => {
    if (parentId) setExpandedFolders(prev => new Set(prev).add(parentId));
    shouldFocusRef.current = true;
    setInlineInput({ type: 'new-file', parentId, value: '' });
  }, []);

  // ─── New folder (inline) ────────────────────────────────────
  const startNewFolder = useCallback((parentId: string | null) => {
    if (parentId) setExpandedFolders(prev => new Set(prev).add(parentId));
    shouldFocusRef.current = true;
    setInlineInput({ type: 'new-folder', parentId, value: '' });
  }, []);

  // ─── Rename (inline) ───────────────────────────────────────
  const startRename = useCallback((node: FileNode) => {
    shouldFocusRef.current = true;
    setInlineInput({ type: 'rename', parentId: node.parentId ?? null, nodeId: node.id, value: node.name });
  }, []);

  // ─── Commit inline input ───────────────────────────────────
  const commitInline = useCallback(() => {
    if (!inlineInput) return;
    const name = inlineInput.value.trim();
    if (!name) {
      setInlineInput(null);
      return;
    }

    if (inlineInput.type === 'rename' && inlineInput.nodeId) {
      onFilesChange(renameNodeInTree(files, inlineInput.nodeId, name));
    } else if (inlineInput.type === 'new-file') {
      const newFile: FileNode = {
        id: generateFileId(),
        name,
        type: 'file',
        content: '',
        parentId: inlineInput.parentId,
      };
      const updated = addNodeToTree(files, inlineInput.parentId, newFile);
      onFilesChange(updated);
      // Auto-open new file
      onFileSelect(newFile);
    } else if (inlineInput.type === 'new-folder') {
      const newFolder: FileNode = {
        id: generateFileId(),
        name,
        type: 'folder',
        children: [],
        parentId: inlineInput.parentId,
      };
      const updated = addNodeToTree(files, inlineInput.parentId, newFolder);
      onFilesChange(updated);
      setExpandedFolders(prev => new Set(prev).add(newFolder.id));
    }
    setInlineInput(null);
  }, [inlineInput, files, onFilesChange, onFileSelect]);

  const cancelInline = useCallback(() => {
    setInlineInput(null);
  }, []);

  // ─── Delete ─────────────────────────────────────────────────
  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    const updated = removeNodeFromTree(files, deleteTarget.id);
    onFilesChange(updated);

    // If deleted the active file, switch to first available
    if (deleteTarget.id === activeFileId) {
      const first = findFirstFile(updated);
      if (first) onFileSelect(first);
    }
    setDeleteTarget(null);
  }, [deleteTarget, files, activeFileId, onFilesChange, onFileSelect]);

  // ─── Build context menu items ───────────────────────────────
  const getMenuItems = useCallback((): ContextMenuItem[] => {
    if (!contextMenu) return [];
    const { node } = contextMenu;

    // Right-click on empty area → new file / folder at root
    if (!node) {
      return [
        { label: 'New File', icon: '📄', onClick: () => startNewFile(null) },
        { label: 'New Folder', icon: '📁', onClick: () => startNewFolder(null) },
      ];
    }

    // Right-click on folder
    if (node.type === 'folder') {
      return [
        { label: 'New File', icon: '📄', onClick: () => startNewFile(node.id) },
        { label: 'New Folder', icon: '📁', onClick: () => startNewFolder(node.id) },
        { label: 'Rename', icon: '✏️', onClick: () => startRename(node) },
        { label: 'Delete', icon: '🗑️', danger: true, onClick: () => setDeleteTarget(node) },
      ];
    }

    // Right-click on file
    return [
      { label: 'Rename', icon: '✏️', onClick: () => startRename(node) },
      { label: 'Delete', icon: '🗑️', danger: true, onClick: () => setDeleteTarget(node) },
    ];
  }, [contextMenu, startNewFile, startNewFolder, startRename]);

  // ─── Inline input element ──────────────────────────────────
  const renderInlineInput = (depth: number) => (
    <div className="flex items-center gap-1 px-2 py-0.5" style={{ paddingLeft: `${depth * 16 + 28}px` }}>
      <span className="text-xs shrink-0">
        {inlineInput?.type === 'new-folder' ? '📁' : '📄'}
      </span>
      <input
        ref={inlineRef}
        value={inlineInput?.value || ''}
        onChange={(e) => setInlineInput(prev => prev ? { ...prev, value: e.target.value } : null)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commitInline();
          if (e.key === 'Escape') cancelInline();
        }}
        onBlur={commitInline}
        className="flex-1 bg-[#1e1e1e] border border-runly-accent text-[#cccccc] text-[13px] px-1.5 py-0
                   rounded outline-none font-sans min-w-0"
        placeholder={inlineInput?.type === 'new-folder' ? 'folder name' : 'filename'}
      />
    </div>
  );

  // ─── Render a tree node ─────────────────────────────────────
  const renderNode = (node: FileNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.id);
    const isActive = node.id === activeFileId;
    const isRenaming = inlineInput?.type === 'rename' && inlineInput.nodeId === node.id;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-1 px-2 py-[3px] cursor-pointer text-[13px] select-none group
            ${isActive ? 'bg-[#37373d] text-white' : 'text-[#cccccc] hover:bg-[#2a2d2e]'}`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (isRenaming) return;
            if (node.type === 'folder') toggleFolder(node.id);
            else onFileSelect(node);
          }}
          onContextMenu={(e) => openContextMenu(e, node)}
        >
          {/* Expand/collapse arrow */}
          {node.type === 'folder' ? (
            isExpanded
              ? <ChevronDown className="w-4 h-4 text-[#999] shrink-0" />
              : <ChevronRight className="w-4 h-4 text-[#999] shrink-0" />
          ) : (
            <span className="w-4 shrink-0" />
          )}

          {/* Icon */}
          {node.type === 'folder' ? (
            isExpanded
              ? <FolderOpen className="w-4 h-4 text-[#dcb67a] shrink-0" />
              : <Folder className="w-4 h-4 text-[#dcb67a] shrink-0" />
          ) : (
            <span className="text-xs shrink-0 leading-none">{getFileIcon(node.name)}</span>
          )}

          {/* Name / inline rename */}
          {isRenaming ? (
            <input
              ref={inlineRef}
              value={inlineInput.value}
              onChange={(e) => setInlineInput(prev => prev ? { ...prev, value: e.target.value } : null)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitInline();
                if (e.key === 'Escape') cancelInline();
              }}
              onBlur={commitInline}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 bg-[#1e1e1e] border border-runly-accent text-[#cccccc] text-[13px] px-1.5 py-0
                         rounded outline-none font-sans min-w-0"
            />
          ) : (
            <span className="truncate ml-0.5">{node.name}</span>
          )}
        </div>

        {/* Children (if expanded folder) */}
        {node.type === 'folder' && isExpanded && (
          <>
            {node.children?.map(child => renderNode(child, depth + 1))}
            {/* Inline input for new file/folder inside this folder */}
            {inlineInput && inlineInput.type !== 'rename' && inlineInput.parentId === node.id && (
              renderInlineInput(depth + 1)
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div
      className="h-full flex flex-col bg-[#181818] select-none"
      onContextMenu={(e) => {
        // Only handle if right-click is on the background (not a node)
        if (e.target === e.currentTarget || (e.target as HTMLElement).closest('[data-explorer-bg]')) {
          openContextMenu(e, null);
        }
      }}
    >
      {/* ─── Header with action buttons ────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-runly-border">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#888]">
          Explorer
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => startNewFile(null)}
            className="p-0.5 rounded hover:bg-[#2a2d2e] transition-colors"
            title="New File"
          >
            <FilePlus className="w-4 h-4 text-[#888] hover:text-[#ccc]" />
          </button>
          <button
            onClick={() => startNewFolder(null)}
            className="p-0.5 rounded hover:bg-[#2a2d2e] transition-colors"
            title="New Folder"
          >
            <FolderPlus className="w-4 h-4 text-[#888] hover:text-[#ccc]" />
          </button>
        </div>
      </div>

      {/* ─── File tree ─────────────────────────────────────── */}
      <div className="flex-1 overflow-auto py-1" data-explorer-bg
        onContextMenu={(e) => {
          // If right-click on the scrollable area but not on a node
          if (e.target === e.currentTarget) {
            openContextMenu(e, null);
          }
        }}
      >
        {files.length === 0 && !inlineInput ? (
          <div className="px-3 py-6 text-center"
            onContextMenu={(e) => openContextMenu(e, null)}
          >
            <p className="text-[11px] text-[#555]">No files yet</p>
            <p className="text-[10px] text-[#444] mt-1">Right-click or use + buttons above</p>
          </div>
        ) : (
          <>
            {files.map(node => renderNode(node))}
            {/* Root-level inline input */}
            {inlineInput && inlineInput.type !== 'rename' && inlineInput.parentId === null && (
              renderInlineInput(0)
            )}
          </>
        )}
      </div>

      {/* ─── Context Menu ──────────────────────────────────── */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getMenuItems()}
          onClose={closeContextMenu}
        />
      )}

      {/* ─── Delete Confirmation Modal ─────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#1e1e1e] border border-[#454545] rounded-lg p-5 w-[340px] shadow-2xl">
            <h3 className="text-sm font-medium text-[#cccccc] mb-2">
              Delete {deleteTarget.type === 'folder' ? 'folder' : 'file'}?
            </h3>
            <p className="text-[13px] text-[#999] mb-4">
              Delete <span className="text-white font-medium">{deleteTarget.name}</span>?
              This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1.5 text-[13px] rounded border border-[#454545] text-[#ccc]
                           hover:bg-[#2a2d2e] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-3 py-1.5 text-[13px] rounded bg-red-600 text-white font-medium
                           hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
