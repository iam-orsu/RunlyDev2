// ─── Language IDs ─────────────────────────────────────────────
export const LANGUAGE_IDS = [
  'python', 'node', 'c', 'cpp', 'java', 'go', 'rust', 'php', 'ruby',
  'html', 'react', 'vue', 'angular',
] as const;

export type LanguageId = typeof LANGUAGE_IDS[number];

export const WEB_LANGUAGE_IDS: LanguageId[] = ['html', 'react', 'vue', 'angular'];

// ─── Language display config ──────────────────────────────────
export interface LanguageOption {
  id: LanguageId;
  name: string;
  monacoId: string;
  icon: string;
  extension: string;
  defaultFilename: string;
  defaultCode: string;
  isWebMode?: boolean;
  defaultFiles?: { name: string; content: string }[];
}

export const LANGUAGES: LanguageOption[] = [
  {
    id: 'python',
    name: 'Python 3.12',
    monacoId: 'python',
    icon: '🐍',
    extension: '.py',
    defaultFilename: 'main.py',
    defaultCode: 'print("Hello From Instacks")',
  },
  {
    id: 'node',
    name: 'Node.js 20',
    monacoId: 'javascript',
    icon: '⬢',
    extension: '.js',
    defaultFilename: 'main.js',
    defaultCode: 'console.log("Hello From Instacks");',
  },
  {
    id: 'c',
    name: 'C (GCC 11)',
    monacoId: 'c',
    icon: '🔧',
    extension: '.c',
    defaultFilename: 'main.c',
    defaultCode: `#include <stdio.h>

int main() {
    printf("Hello From Instacks\\n");
    return 0;
}`,
  },
  {
    id: 'cpp',
    name: 'C++ (G++ 11)',
    monacoId: 'cpp',
    icon: '⚙️',
    extension: '.cpp',
    defaultFilename: 'main.cpp',
    defaultCode: `#include <iostream>

int main() {
    std::cout << "Hello From Instacks" << std::endl;
    return 0;
}`,
  },
  {
    id: 'java',
    name: 'Java 21',
    monacoId: 'java',
    icon: '☕',
    extension: '.java',
    defaultFilename: 'Main.java',
    defaultCode: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello From Instacks");
    }
}`,
  },
  {
    id: 'go',
    name: 'Go 1.22',
    monacoId: 'go',
    icon: '🐹',
    extension: '.go',
    defaultFilename: 'main.go',
    defaultCode: `package main

import "fmt"

func main() {
    fmt.Println("Hello From Instacks")
}`,
  },
  {
    id: 'rust',
    name: 'Rust 1.77',
    monacoId: 'rust',
    icon: '🦀',
    extension: '.rs',
    defaultFilename: 'main.rs',
    defaultCode: `fn main() {
    println!("Hello From Instacks");
}`,
  },
  {
    id: 'php',
    name: 'PHP 8.1',
    monacoId: 'php',
    icon: '🐘',
    extension: '.php',
    defaultFilename: 'main.php',
    defaultCode: `<?php
echo "Hello From Instacks\\n";`,
  },
  {
    id: 'ruby',
    name: 'Ruby 3.0',
    monacoId: 'ruby',
    icon: '💎',
    extension: '.rb',
    defaultFilename: 'main.rb',
    defaultCode: 'puts "Hello From Instacks"',
  },
  {
    id: 'html',
    name: 'HTML/CSS/JS',
    monacoId: 'html',
    icon: '🌐',
    extension: '.html',
    defaultFilename: 'index.html',
    isWebMode: true,
    defaultCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Runly.dev</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h1>Hello, World!</h1>
  <p>Edit the files on the left to get started.</p>
  <script src="script.js"></script>
</body>
</html>`,
    defaultFiles: [
      {
        name: 'styles.css',
        content: `body {\n  font-family: sans-serif;\n  max-width: 800px;\n  margin: 40px auto;\n  padding: 0 20px;\n  background: #f5f5f5;\n}\nh1 { color: #333; }`,
      },
      {
        name: 'script.js',
        content: `console.log('Hello from script.js!');`,
      },
    ],
  },
  {
    id: 'react',
    name: 'React 18',
    monacoId: 'javascript',
    icon: '⚛️',
    extension: '.jsx',
    defaultFilename: 'App.jsx',
    isWebMode: true,
    defaultCode: `function App() {
  const [count, setCount] = React.useState(0);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Hello from React!</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}`,
  },
  {
    id: 'vue',
    name: 'Vue 3',
    monacoId: 'javascript',
    icon: '💚',
    extension: '.vue',
    defaultFilename: 'App.vue',
    isWebMode: true,
    defaultCode: `const App = {
  data() {
    return { count: 0, message: 'Hello from Vue!' }
  },
  template: \`
    <div style="padding: 20px; font-family: sans-serif;">
      <h1>{{ message }}</h1>
      <p>Count: {{ count }}</p>
      <button @click="count++">Click me</button>
    </div>
  \`
}`,
  },
  {
    id: 'angular',
    name: 'AngularJS 1.x',
    monacoId: 'typescript',
    icon: '🅰️',
    extension: '.ts',
    defaultFilename: 'app.component.ts',
    isWebMode: true,
    defaultCode: `$scope.message = 'Hello from Angular!';
$scope.count = 0;
$scope.increment = function() { $scope.count++; };`,
  },
];

// ─── File Explorer types ──────────────────────────────────────
export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
  parentId?: string | null;
}

// ─── Submission types ─────────────────────────────────────────
export type SubmissionStatus =
  | 'queued'
  | 'running'
  | 'success'
  | 'error'
  | 'timeout'
  | 'compile_error'
  | 'oom';

export interface FileEntry {
  name: string;
  content: string;
}

export interface Submission {
  id: string;
  language: LanguageId;
  status: SubmissionStatus;
  created_at: string;
  completed_at: string | null;
  stdout: string;
  stderr: string;
  compile_output: string;
  exit_code: number | null;
  signal: string | null;
  execution_time_ms: number | null;
  memory_used_kb: number | null;
}

export interface SubmitRequest {
  language: LanguageId;
  source_code: string;
  stdin: string;
  files?: FileEntry[];
  entry_file?: string;
}

// ─── Console types ────────────────────────────────────────────
export interface ConsoleLine {
  type: 'output' | 'error' | 'input' | 'system';
  text: string;
}

// ─── Helpers ──────────────────────────────────────────────────
export const TERMINAL_STATUSES: SubmissionStatus[] = [
  'success', 'error', 'timeout', 'compile_error', 'oom',
];

export function isTerminalStatus(status: SubmissionStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function getLanguageById(id: LanguageId): LanguageOption {
  return LANGUAGES.find((l) => l.id === id)!;
}

export function isWebLanguage(id: LanguageId): boolean {
  return WEB_LANGUAGE_IDS.includes(id);
}

// ─── Input prompt extraction per language ─────────────────────

/**
 * Helper: given the previous line of code, try to extract a prompt string
 * using the provided regex. Returns the captured group or null.
 */
function extractPromptFromPrevLine(prevLine: string, regex: RegExp): string | null {
  const m = regex.exec(prevLine);
  return m ? m[1] : null;
}

/**
 * Extract prompt strings from input/read calls in the source code.
 *
 * Strategy:
 *  - Split code into lines
 *  - For each line that contains a read/input call, look at the
 *    PREVIOUS line for a print/output statement and extract the
 *    string literal from it.
 *  - Python is special: prompt text is inline inside input("...").
 *  - PHP readline("...") and Node question("...") also carry inline prompts.
 *  - Fallback: "Enter input:"
 */
export function extractInputPrompts(code: string, languageId: LanguageId): string[] {
  const prompts: string[] = [];

  // Strip block comments but keep line structure so line indices stay valid
  const stripped = code
    .replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, ' '))
    .replace(/\/\/.*$/gm, '');

  const lines = stripped.split('\n');

  const FALLBACK = 'Enter input:';

  switch (languageId) {
    // ── Python ──────────────────────────────────────────────
    case 'python': {
      const pyWithPrompt = /\binput\s*\(\s*["'`]([^"'`]*)["'`]\s*\)/g;
      const pyNoPrompt = /\binput\s*\(\s*\)/g;
      let match;
      const allInputs: { index: number; prompt: string }[] = [];
      while ((match = pyWithPrompt.exec(stripped)) !== null) {
        allInputs.push({ index: match.index, prompt: match[1] });
      }
      while ((match = pyNoPrompt.exec(stripped)) !== null) {
        if (!allInputs.some(m => m.index === match!.index)) {
          allInputs.push({ index: match.index, prompt: FALLBACK });
        }
      }
      allInputs.sort((a, b) => a.index - b.index);
      allInputs.forEach(m => prompts.push(m.prompt));
      break;
    }

    // ── Node.js ─────────────────────────────────────────────
    case 'node': {
      const questionInline = /question\s*\(\s*["'`]([^"'`]*)["'`]/;
      const stdoutWrite = /process\.stdout\.write\s*\(\s*["'`]([^"'`]*)["'`]\s*\)/;
      const consoleLog = /console\.log\s*\(\s*["'`]([^"'`]*)["'`]\s*\)/;
      const readCallRe = /\b(?:question|readline|createInterface)\s*\(/;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!readCallRe.test(line)) continue;

        // question("prompt", cb) — inline prompt
        const inlineMatch = questionInline.exec(line);
        if (inlineMatch) {
          prompts.push(inlineMatch[1]);
          continue;
        }

        // Look at previous line for process.stdout.write or console.log
        if (i > 0) {
          const prev = lines[i - 1];
          const prompt =
            extractPromptFromPrevLine(prev, stdoutWrite) ??
            extractPromptFromPrevLine(prev, consoleLog);
          if (prompt !== null) {
            prompts.push(prompt);
            continue;
          }
        }

        prompts.push(FALLBACK);
      }
      break;
    }

    // ── Rust ────────────────────────────────────────────────
    case 'rust': {
      const readLineRe = /\.read_line\s*\(/;
      const printlnRe = /(?:println!|print!)\s*\(\s*["'`]([^"'`]*)["'`]\s*\)/;

      for (let i = 0; i < lines.length; i++) {
        if (!readLineRe.test(lines[i])) continue;

        if (i > 0) {
          const prompt = extractPromptFromPrevLine(lines[i - 1], printlnRe);
          if (prompt !== null) {
            prompts.push(prompt);
            continue;
          }
        }
        prompts.push(FALLBACK);
      }
      break;
    }

    // ── C ───────────────────────────────────────────────────
    case 'c': {
      const readCallRe = /\b(?:scanf|fgets|gets)\s*\(/;
      const printfRe = /printf\s*\(\s*["'`]([^"'`]*)["'`]/;

      for (let i = 0; i < lines.length; i++) {
        if (!readCallRe.test(lines[i])) continue;

        if (i > 0) {
          const prompt = extractPromptFromPrevLine(lines[i - 1], printfRe);
          if (prompt !== null) {
            // Strip trailing format specifiers like \n from the prompt
            const cleaned = prompt.replace(/\\n$/g, '');
            prompts.push(cleaned || FALLBACK);
            continue;
          }
        }
        prompts.push(FALLBACK);
      }
      break;
    }

    // ── C++ ─────────────────────────────────────────────────
    case 'cpp': {
      const readCallRe = /\bcin\s*>>|\bgetline\s*\(/;
      const coutRe = /cout\s*<<\s*["'`]([^"'`]*)["'`]/;
      // Also support printf in C++ code
      const printfRe = /printf\s*\(\s*["'`]([^"'`]*)["'`]/;

      for (let i = 0; i < lines.length; i++) {
        if (!readCallRe.test(lines[i])) continue;

        if (i > 0) {
          const prev = lines[i - 1];
          const prompt =
            extractPromptFromPrevLine(prev, coutRe) ??
            extractPromptFromPrevLine(prev, printfRe);
          if (prompt !== null) {
            const cleaned = prompt.replace(/\\n$/g, '');
            prompts.push(cleaned || FALLBACK);
            continue;
          }
        }
        prompts.push(FALLBACK);
      }
      break;
    }

    // ── Java ────────────────────────────────────────────────
    case 'java': {
      const readCallRe = /\.next(?:Line|Int|Double|Float|Long|Short|Byte|Boolean)?\s*\(/;
      const printRe = /System\.out\.print(?:ln)?\s*\(\s*["'`]([^"'`]*)["'`]\s*\)/;

      for (let i = 0; i < lines.length; i++) {
        if (!readCallRe.test(lines[i])) continue;

        if (i > 0) {
          const prompt = extractPromptFromPrevLine(lines[i - 1], printRe);
          if (prompt !== null) {
            prompts.push(prompt);
            continue;
          }
        }
        prompts.push(FALLBACK);
      }
      break;
    }

    // ── Go ──────────────────────────────────────────────────
    case 'go': {
      const readCallRe = /fmt\.Scan(?:ln|f)?\s*\(|\.ReadString\s*\(/;
      const printRe = /fmt\.Print(?:ln|f)?\s*\(\s*["'`]([^"'`]*)["'`]/;

      for (let i = 0; i < lines.length; i++) {
        if (!readCallRe.test(lines[i])) continue;

        if (i > 0) {
          const prompt = extractPromptFromPrevLine(lines[i - 1], printRe);
          if (prompt !== null) {
            prompts.push(prompt);
            continue;
          }
        }
        prompts.push(FALLBACK);
      }
      break;
    }

    // ── PHP ─────────────────────────────────────────────────
    case 'php': {
      // PHP readline("prompt") carries inline prompt
      const readlineInline = /\breadline\s*\(\s*["'`]([^"'`]*)["'`]\s*\)/;
      const fgetsRe = /\bfgets\s*\(\s*STDIN/;
      const echoRe = /echo\s+["'`]([^"'`]*)["'`]/;
      const readCallRe = /\breadline\s*\(|\bfgets\s*\(\s*STDIN/;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!readCallRe.test(line)) continue;

        // readline("prompt") — inline prompt
        const inlineMatch = readlineInline.exec(line);
        if (inlineMatch) {
          prompts.push(inlineMatch[1]);
          continue;
        }

        // fgets(STDIN) — look at previous line for echo
        if (fgetsRe.test(line) && i > 0) {
          const prompt = extractPromptFromPrevLine(lines[i - 1], echoRe);
          if (prompt !== null) {
            prompts.push(prompt);
            continue;
          }
        }

        prompts.push(FALLBACK);
      }
      break;
    }

    // ── Ruby ────────────────────────────────────────────────
    case 'ruby': {
      const getsRe = /\bgets\b/;
      const printRe = /(?:print|puts)\s+["'`]([^"'`]*)["'`]/;

      for (let i = 0; i < lines.length; i++) {
        if (!getsRe.test(lines[i])) continue;

        if (i > 0) {
          const prompt = extractPromptFromPrevLine(lines[i - 1], printRe);
          if (prompt !== null) {
            prompts.push(prompt);
            continue;
          }
        }
        prompts.push(FALLBACK);
      }
      break;
    }
  }

  return prompts;
}

export function generateFileId(): string {
  return Math.random().toString(36).substring(2, 10);
}

