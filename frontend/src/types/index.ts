// ─── Language IDs — must match backend exactly ────────────────
export const LANGUAGE_IDS = [
  'python', 'node', 'c', 'cpp', 'java', 'go', 'rust', 'php', 'ruby',
] as const;

export type LanguageId = typeof LANGUAGE_IDS[number];

// ─── Language display config ──────────────────────────────────
export interface LanguageOption {
  id: LanguageId;
  name: string;
  monacoId: string;
  icon: string;
  defaultCode: string;
}

export const LANGUAGES: LanguageOption[] = [
  {
    id: 'python',
    name: 'Python 3.12',
    monacoId: 'python',
    icon: '🐍',
    defaultCode: 'print("Hello From Instacks")',
  },
  {
    id: 'node',
    name: 'Node.js 20',
    monacoId: 'javascript',
    icon: '⬢',
    defaultCode: 'console.log("Hello From Instacks");',
  },
  {
    id: 'c',
    name: 'C (GCC 11)',
    monacoId: 'c',
    icon: '🔧',
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
    defaultCode: `fn main() {
    println!("Hello From Instacks");
}`,
  },
  {
    id: 'php',
    name: 'PHP 8.1',
    monacoId: 'php',
    icon: '🐘',
    defaultCode: `<?php
echo "Hello From Instacks\\n";`,
  },
  {
    id: 'ruby',
    name: 'Ruby 3.0',
    monacoId: 'ruby',
    icon: '💎',
    defaultCode: 'puts "Hello From Instacks"',
  },
];

// ─── Submission types ─────────────────────────────────────────
export type SubmissionStatus =
  | 'queued'
  | 'running'
  | 'success'
  | 'error'
  | 'timeout'
  | 'compile_error'
  | 'oom';

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
