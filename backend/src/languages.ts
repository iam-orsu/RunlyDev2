// ─────────────────────────────────────────────────────────────────
// THE SINGLE SOURCE OF TRUTH FOR LANGUAGE CONFIGURATION
// These IDs are used everywhere: frontend, backend, worker, DB.
// NEVER use 'javascript' — use 'node'
// NEVER use 'c++'      — use 'cpp'
// NEVER use 'golang'   — use 'go'
// ─────────────────────────────────────────────────────────────────

export const LANGUAGE_IDS = [
  'python', 'node', 'c', 'cpp', 'java', 'go', 'rust', 'php', 'ruby',
] as const;

export type LanguageId = typeof LANGUAGE_IDS[number];

export interface LanguageConfig {
  id: LanguageId;
  name: string;
  extension: string;
  monacoId: string;
  compiled: boolean;
  memoryLimit: number; // bytes
  pidsLimit: number;
  defaultCode: string;
}

const MB = 1024 * 1024;

export const LANGUAGES: Record<LanguageId, LanguageConfig> = {
  python: {
    id: 'python',
    name: 'Python 3.12',
    extension: '.py',
    monacoId: 'python',
    compiled: false,
    memoryLimit: 256 * MB,
    pidsLimit: 64,
    defaultCode: `# Write your Python code here\nprint("Hello, World!")`,
  },

  node: {
    id: 'node',
    name: 'Node.js 20',
    extension: '.js',
    monacoId: 'javascript',
    compiled: false,
    memoryLimit: 256 * MB,
    pidsLimit: 64,
    defaultCode: `// Write your JavaScript code here\nconsole.log("Hello, World!");`,
  },

  c: {
    id: 'c',
    name: 'C (GCC 11)',
    extension: '.c',
    monacoId: 'c',
    compiled: true,
    memoryLimit: 256 * MB,
    pidsLimit: 64,
    defaultCode: `#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`,
  },

  cpp: {
    id: 'cpp',
    name: 'C++ (G++ 11)',
    extension: '.cpp',
    monacoId: 'cpp',
    compiled: true,
    memoryLimit: 256 * MB,
    pidsLimit: 64,
    defaultCode: `#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}`,
  },

  java: {
    id: 'java',
    name: 'Java 21',
    extension: '.java',
    monacoId: 'java',
    compiled: true,
    memoryLimit: 512 * MB,
    pidsLimit: 256,
    defaultCode: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
  },

  go: {
    id: 'go',
    name: 'Go 1.22',
    extension: '.go',
    monacoId: 'go',
    compiled: true,
    memoryLimit: 256 * MB,
    pidsLimit: 256,
    defaultCode: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}`,
  },

  rust: {
    id: 'rust',
    name: 'Rust 1.77',
    extension: '.rs',
    monacoId: 'rust',
    compiled: true,
    memoryLimit: 256 * MB,
    pidsLimit: 64,
    defaultCode: `fn main() {\n    println!("Hello, World!");\n}`,
  },

  php: {
    id: 'php',
    name: 'PHP 8.1',
    extension: '.php',
    monacoId: 'php',
    compiled: false,
    memoryLimit: 256 * MB,
    pidsLimit: 64,
    defaultCode: `<?php\necho "Hello, World!\\n";\n?>`,
  },

  ruby: {
    id: 'ruby',
    name: 'Ruby 3.0',
    extension: '.rb',
    monacoId: 'ruby',
    compiled: false,
    memoryLimit: 256 * MB,
    pidsLimit: 64,
    defaultCode: `# Write your Ruby code here\nputs "Hello, World!"`,
  },
};

/** Get a language config by ID, returns undefined if not found */
export function getLanguage(id: string): LanguageConfig | undefined {
  return LANGUAGES[id as LanguageId];
}

/** Check if a string is a valid LanguageId */
export function isValidLanguage(id: string): id is LanguageId {
  return LANGUAGE_IDS.includes(id as LanguageId);
}

/** Get filename for a language (e.g. 'Main.java' for java, 'main.py' for python) */
export function getFilename(id: LanguageId): string {
  if (id === 'java') return 'Main.java';
  const lang = LANGUAGES[id];
  return `main${lang.extension}`;
}
