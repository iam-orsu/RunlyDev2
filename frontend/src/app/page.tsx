'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { Code2, Github } from 'lucide-react';
import { LanguageId, LanguageOption, LANGUAGES, Submission, isTerminalStatus, getLanguageById } from '@/types';
import { submitCode, getSubmission } from '@/lib/api';
import EditorToolbar from '@/components/Editor/EditorToolbar';
import OutputPanel from '@/components/Output/OutputPanel';
import StdinInput from '@/components/Output/StdinInput';

// Dynamic import Monaco to avoid SSR issues
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

export default function HomePage() {
  const [language, setLanguage] = useState<LanguageOption>(LANGUAGES[0]);
  const [code, setCode] = useState<string>(LANGUAGES[0].defaultCode);
  const [stdin, setStdin] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Change language → update Monaco + load boilerplate
  const handleLanguageChange = useCallback((id: LanguageId) => {
    const lang = getLanguageById(id);
    setLanguage(lang);
    setCode(lang.defaultCode);
  }, []);

  // Run code
  const handleRun = useCallback(async () => {
    if (isRunning) return;

    setIsRunning(true);
    setError(null);
    setSubmission(null);

    try {
      // Submit code
      const result = await submitCode({
        language: language.id,
        source_code: code,
        stdin,
      });

      const submissionId = result.id;

      // Poll for result
      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts++;

        try {
          const sub = await getSubmission(submissionId);
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
  }, [isRunning, language.id, code, stdin]);

  return (
    <div className="h-screen flex flex-col bg-runly-bg">
      {/* ─── Header ──────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-runly-border bg-runly-panel/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-runly-accent/15">
            <Code2 className="w-5 h-5 text-runly-accent" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-runly-text tracking-tight">
              Runly<span className="text-runly-accent">.dev</span>
            </h1>
            <p className="text-xs text-runly-muted -mt-0.5 hidden sm:block">
              Run code in 9 languages instantly
            </p>
          </div>
        </div>

        <a
          href="https://github.com/iam-orsu/RunlyDev2"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-runly-muted
                     hover:text-runly-text hover:bg-runly-bg transition-colors"
        >
          <Github className="w-4 h-4" />
          <span className="hidden sm:inline">GitHub</span>
        </a>
      </header>

      {/* ─── Main content: split pane ───────────────────────── */}
      <div className="flex-1 overflow-hidden">
        <Allotment>
          {/* Left: Editor */}
          <Allotment.Pane minSize={300} preferredSize="60%">
            <div className="h-full flex flex-col bg-runly-bg">
              <EditorToolbar
                language={language}
                onLanguageChange={handleLanguageChange}
                onRun={handleRun}
                isRunning={isRunning}
              />
              <div className="flex-1">
                <CodeEditor
                  language={language}
                  value={code}
                  onChange={setCode}
                  onRun={handleRun}
                />
              </div>
            </div>
          </Allotment.Pane>

          {/* Right: Output + Stdin */}
          <Allotment.Pane minSize={280} preferredSize="40%">
            <div className="h-full flex flex-col bg-runly-panel">
              <div className="flex-1 overflow-hidden">
                <OutputPanel
                  submission={submission}
                  isRunning={isRunning}
                  error={error}
                />
              </div>
              <StdinInput value={stdin} onChange={setStdin} />
            </div>
          </Allotment.Pane>
        </Allotment>
      </div>
    </div>
  );
}
