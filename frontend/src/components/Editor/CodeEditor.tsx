'use client';

import { useRef, useCallback } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { LanguageOption } from '@/types';

interface CodeEditorProps {
  language: LanguageOption;
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
}

export default function CodeEditor({ language, value, onChange, onRun }: CodeEditorProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const handleMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;

    // Ctrl+Enter → Run
    editor.addAction({
      id: 'runly-run-code',
      label: 'Run Code',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => onRun(),
    });

    // Set custom theme
    monaco.editor.defineTheme('runly-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '8b949e', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'ff7b72' },
        { token: 'string', foreground: 'a5d6ff' },
        { token: 'number', foreground: '79c0ff' },
        { token: 'type', foreground: 'ffa657' },
      ],
      colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#e6edf3',
        'editor.lineHighlightBackground': '#161b2240',
        'editor.selectionBackground': '#264f7840',
        'editorLineNumber.foreground': '#484f58',
        'editorLineNumber.activeForeground': '#e6edf3',
        'editorCursor.foreground': '#58a6ff',
        'editor.inactiveSelectionBackground': '#264f7820',
      },
    });
    monaco.editor.setTheme('runly-dark');

    editor.focus();
  }, [onRun]);

  return (
    <div className="h-full w-full">
      <Editor
        language={language.monacoId}
        value={value}
        onChange={(v) => onChange(v || '')}
        onMount={handleMount}
        theme="runly-dark"
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontLigatures: true,
          minimap: { enabled: false },
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          lineNumbers: 'on',
          renderLineHighlight: 'line',
          scrollBeyondLastLine: false,
          padding: { top: 16, bottom: 16 },
          automaticLayout: true,
          tabSize: 4,
          wordWrap: 'on',
          bracketPairColorization: { enabled: true },
          guides: { bracketPairs: true },
        }}
        loading={
          <div className="flex items-center justify-center h-full bg-runly-bg">
            <div className="text-runly-muted animate-pulse-glow">Loading editor...</div>
          </div>
        }
      />
    </div>
  );
}
