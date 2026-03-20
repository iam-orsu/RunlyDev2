'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { Code2, Github } from 'lucide-react';
import {
  LanguageId, LanguageOption, LANGUAGES, FileNode, Submission,
  isTerminalStatus, getLanguageById, extractInputPrompts, generateFileId,
} from '@/types';
import { submitCode, getSubmission } from '@/lib/api';
import FileExplorer from '@/components/Explorer/FileExplorer';
import EditorToolbar from '@/components/Editor/EditorToolbar';
import ConsolePanel from '@/components/Console/ConsolePanel';

const CodeEditor = dynamic(() => import('@/components/Editor/CodeEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-runly-bg">
      <div className="text-runly-muted animate-pulse-glow">Loading editor...</div>
    </div>
  ),
});

const MAX_POLL_ATTEMPTS = 30;
const POLL_INTERVAL_MS = 1000;

// ─── Helper: create default workspace for a language ──────────
function createDefaultWorkspace(lang: LanguageOption): FileNode[] {
  return [{
    id: generateFileId(),
    name: lang.defaultFilename,
    type: 'file',
    content: lang.defaultCode,
    parentId: null,
  }];
}

// ─── Helper: find a node by id in the tree ────────────────────
function findNodeById(nodes: FileNode[], id: string): FileNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const found = findNodeById(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

// ─── Helper: update content of a node in the tree ─────────────
function updateNodeContent(nodes: FileNode[], id: string, content: string): FileNode[] {
  return nodes.map(n => {
    if (n.id === id) return { ...n, content };
    if (n.children) return { ...n, children: updateNodeContent(n.children, id, content) };
    return n;
  });
}

// ─── Helper: collect all files from tree (flattened) ──────────
function collectAllFiles(nodes: FileNode[], prefix = ''): { name: string; content: string }[] {
  const result: { name: string; content: string }[] = [];
  for (const n of nodes) {
    const fullPath = prefix ? `${prefix}/${n.name}` : n.name;
    if (n.type === 'file') {
      result.push({ name: fullPath, content: n.content || '' });
    }
    if (n.type === 'folder' && n.children) {
      result.push(...collectAllFiles(n.children, fullPath));
    }
  }
  return result;
}

export default function HomePage() {
  const [language, setLanguage] = useState<LanguageOption>(LANGUAGES[0]);
  const [files, setFiles] = useState<FileNode[]>(() => createDefaultWorkspace(LANGUAGES[0]));
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCollectingInputs, setIsCollectingInputs] = useState(false);
  const [inputPrompts, setInputPrompts] = useState<string[]>([]);
  const [collectedInputs, setCollectedInputs] = useState<string[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Set initial active file
  useEffect(() => {
    if (!activeFileId && files.length > 0) {
      const firstFile = files.find(f => f.type === 'file');
      if (firstFile) setActiveFileId(firstFile.id);
    }
  }, [files, activeFileId]);

  // Cleanup polling
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // Get active file
  const activeFile = activeFileId ? findNodeById(files, activeFileId) : null;
  const activeCode = activeFile?.content || '';

  // Handle file selection
  const handleFileSelect = useCallback((file: FileNode) => {
    if (file.type === 'file') setActiveFileId(file.id);
  }, []);

  // Handle code changes in editor → save to file tree
  const handleCodeChange = useCallback((value: string) => {
    if (activeFileId) {
      setFiles((prev: FileNode[]) => updateNodeContent(prev, activeFileId, value));
    }
  }, [activeFileId]);

  // Handle language change
  const handleLanguageChange = useCallback((id: LanguageId) => {
    const lang = getLanguageById(id);
    setLanguage(lang);
    const workspace = createDefaultWorkspace(lang);
    setFiles(workspace);
    setActiveFileId(workspace[0].id);
    setSubmission(null);
    setError(null);
  }, []);

  // Execute code
  const executeSubmission = useCallback(async (stdin: string) => {
    if (isRunning) return;
    if (!activeFile) return;

    setIsRunning(true);
    setError(null);
    setSubmission(null);
    setIsCollectingInputs(false);

    try {
      const allFiles = collectAllFiles(files);
      const result = await submitCode({
        language: language.id,
        source_code: activeFile.content || '',
        stdin,
        files: allFiles,
        entry_file: activeFile.name,
      });

      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts++;
        try {
          const sub = await getSubmission(result.id);
          setSubmission(sub);
          if (isTerminalStatus(sub.status) || attempts >= MAX_POLL_ATTEMPTS) {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            setIsRunning(false);
            if (attempts >= MAX_POLL_ATTEMPTS && !isTerminalStatus(sub.status)) {
              setError('Execution timed out — no response after 30 seconds');
            }
          }
        } catch (pollError) {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          setIsRunning(false);
          setError(pollError instanceof Error ? pollError.message : 'Failed to fetch result');
        }
      }, POLL_INTERVAL_MS);
    } catch (submitError) {
      setIsRunning(false);
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit code');
    }
  }, [isRunning, activeFile, files, language.id]);

  // Handle Run click — check for inputs first
  const handleRun = useCallback(() => {
    if (isRunning) return;
    const code = activeFile?.content || '';
    const prompts = extractInputPrompts(code, language.id);

    if (prompts.length > 0) {
      setIsCollectingInputs(true);
      setInputPrompts(prompts);
      setCollectedInputs([]);
      setSubmission(null);
      setError(null);
    } else {
      setCollectedInputs([]);
      setInputPrompts([]);
      executeSubmission('');
    }
  }, [isRunning, activeFile, language.id, executeSubmission]);

  // Handle inputs collected from console
  const handleInputsCollected = useCallback((inputs: string[]) => {
    setIsCollectingInputs(false);
    setCollectedInputs(inputs);
    executeSubmission(inputs.join('\n'));
  }, [executeSubmission]);

  return (
    <div className="h-screen flex flex-col bg-runly-bg">
      {/* ─── Header ──────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-runly-border bg-runly-panel/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-runly-accent/15">
            <Code2 className="w-4 h-4 text-runly-accent" />
          </div>
          <h1 className="text-sm font-semibold text-runly-text tracking-tight">
            Runly<span className="text-runly-accent">.dev</span>
          </h1>
          <span className="text-[10px] text-runly-muted hidden sm:block ml-1">
            Run code in 9 languages instantly
          </span>
        </div>

        <a href="https://github.com/iam-orsu/RunlyDev2" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-runly-muted
                     hover:text-runly-text hover:bg-runly-bg transition-colors">
          <Github className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">GitHub</span>
        </a>
      </header>

      {/* ─── Main 3-column layout ───────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        <Allotment>
          {/* Column 1: File Explorer */}
          <Allotment.Pane minSize={150} preferredSize={200} maxSize={350}>
            <FileExplorer
              files={files}
              activeFileId={activeFileId}
              onFileSelect={handleFileSelect}
              onFilesChange={setFiles}
            />
          </Allotment.Pane>

          {/* Column 2: Editor */}
          <Allotment.Pane minSize={300} preferredSize="60%">
            <div className="h-full flex flex-col bg-runly-bg">
              <EditorToolbar
                language={language}
                onLanguageChange={handleLanguageChange}
                onRun={handleRun}
                isRunning={isRunning || isCollectingInputs}
                activeFileName={activeFile?.name || ''}
              />
              <div className="flex-1">
                <CodeEditor
                  language={language}
                  value={activeCode}
                  onChange={handleCodeChange}
                  onRun={handleRun}
                />
              </div>
            </div>
          </Allotment.Pane>

          {/* Column 3: Console */}
          <Allotment.Pane minSize={250} preferredSize={320}>
            <ConsolePanel
              submission={submission}
              isRunning={isRunning}
              error={error}
              prompts={inputPrompts}
              collectedInputs={collectedInputs}
              onInputsCollected={handleInputsCollected}
              isCollectingInputs={isCollectingInputs}
            />
          </Allotment.Pane>
        </Allotment>
      </div>
    </div>
  );
}
