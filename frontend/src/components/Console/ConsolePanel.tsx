'use client';

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { Terminal, Loader2 } from 'lucide-react';
import { ConsoleLine, Submission } from '@/types';

interface ConsolePanelProps {
  submission: Submission | null;
  isRunning: boolean;
  error: string | null;
  prompts: string[];
  collectedInputs: string[];
  onInputsCollected: (inputs: string[]) => void;
  isCollectingInputs: boolean;
}

export default function ConsolePanel({
  submission,
  isRunning,
  error,
  prompts,
  collectedInputs,
  onInputsCollected,
  isCollectingInputs,
}: ConsolePanelProps) {
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const [currentInputs, setCurrentInputs] = useState<string[]>([]);
  const [currentInputIndex, setCurrentInputIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, currentInputIndex, isRunning]);

  // Focus input when collecting
  useEffect(() => {
    if (isCollectingInputs && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCollectingInputs, currentInputIndex]);

  // Build console output when submission completes — interleave prompts + inputs + stdout
  useEffect(() => {
    if (!submission) return;
    if (submission.status === 'queued' || submission.status === 'running') return;

    const newLines: ConsoleLine[] = [];

    // Show compile errors first
    if (submission.compile_output) {
      submission.compile_output.split('\n').forEach(line => {
        if (line.trim()) newLines.push({ type: 'error', text: line });
      });
    } else {
      // Process stdout — strip prompt text that Python/other langs write to stdout
      let rawStdout = submission.stdout || '';

      if (prompts.length > 0 && collectedInputs.length > 0) {
        // Show each prompt + user input inline (like a real terminal)
        for (let i = 0; i < prompts.length; i++) {
          const promptText = prompts[i] || 'Enter input:';
          const userValue = collectedInputs[i] || '';
          newLines.push({ type: 'input', text: `${promptText}${userValue}` });

          // Strip the prompt text from raw stdout (Python echoes it to stdout)
          // The prompt appears at the current position in stdout without \n
          if (rawStdout.startsWith(promptText)) {
            rawStdout = rawStdout.slice(promptText.length);
          }
          // Also strip the echoed user input if present (some environments echo stdin)
          if (rawStdout.startsWith(userValue)) {
            rawStdout = rawStdout.slice(userValue.length);
          }
          // Strip leading newline that may follow
          if (rawStdout.startsWith('\n')) {
            rawStdout = rawStdout.slice(1);
          }
        }

        // Show remaining stdout as program output
        rawStdout.split('\n').forEach(line => {
          if (line) newLines.push({ type: 'output', text: line });
        });
      } else {
        // No inputs — just show stdout directly
        rawStdout.split('\n').forEach(line => {
          if (line) newLines.push({ type: 'output', text: line });
        });
      }

      // Show stderr
      const stderrLines = submission.stderr ? submission.stderr.split('\n').filter(l => l.trim()) : [];
      stderrLines.forEach(line => {
        newLines.push({ type: 'error', text: line });
      });
    }

    // Status line
    if (submission.execution_time_ms !== null) {
      const icon = submission.status === 'success' ? '✓' : submission.status === 'timeout' ? '⏱' : '✗';
      const statusText = submission.status === 'timeout'
        ? `⏱ Execution timed out (${submission.execution_time_ms}ms)`
        : `${icon} Process exited with code ${submission.exit_code ?? 'N/A'} (${submission.execution_time_ms}ms)`;
      newLines.push({ type: 'system', text: statusText });
    }

    setLines(newLines);
  }, [submission, prompts, collectedInputs]);

  // Reset when starting new input collection
  useEffect(() => {
    if (isCollectingInputs) {
      setLines([]);
      setCurrentInputs([]);
      setCurrentInputIndex(0);
      setInputValue('');
    }
  }, [isCollectingInputs]);

  const handleInputSubmit = useCallback(() => {
    if (!isCollectingInputs) return;

    const newInputs = [...currentInputs, inputValue];
    setCurrentInputs(newInputs);

    // Show the prompt + entered value as a single line
    const promptText = prompts[currentInputIndex] || 'Enter input:';
    setLines(prev => [...prev, { type: 'input', text: `${promptText} ${inputValue}` }]);
    setInputValue('');

    const nextIndex = currentInputIndex + 1;
    setCurrentInputIndex(nextIndex);

    if (nextIndex >= prompts.length) {
      onInputsCollected(newInputs);
    }
  }, [isCollectingInputs, inputValue, currentInputs, currentInputIndex, prompts, onInputsCollected]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInputSubmit();
    }
  }, [handleInputSubmit]);

  // Get line color
  function getLineClass(type: ConsoleLine['type']): string {
    switch (type) {
      case 'output': return 'text-[#00ff00]';
      case 'error': return 'text-runly-error';
      case 'input': return 'text-white';
      case 'system': return 'text-runly-muted';
    }
  }

  // Current prompt text for the active input
  const currentPrompt = isCollectingInputs && currentInputIndex < prompts.length
    ? prompts[currentInputIndex]
    : 'Enter input:';

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0a0a0a] border-b border-runly-border">
        <Terminal className="w-3.5 h-3.5 text-[#00ff00]" />
        <span className="text-xs font-medium text-runly-muted">Console</span>
        {isRunning && <Loader2 className="w-3 h-3 text-runly-accent animate-spin ml-auto" />}
      </div>

      {/* Console body */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-3 font-mono text-sm"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Empty state */}
        {!isRunning && !isCollectingInputs && lines.length === 0 && !error && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Terminal className="w-8 h-8 text-[#1a1a1a] mx-auto mb-2" />
              <p className="text-[#333] text-xs">Run your code to see output</p>
              <p className="text-[#222] text-[10px] mt-1">Ctrl + Enter</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-runly-error">{error}</div>
        )}

        {/* Lines */}
        {lines.map((line, i) => (
          <div key={i} className={`leading-relaxed whitespace-pre-wrap break-all ${getLineClass(line.type)}`}>
            {line.text}
          </div>
        ))}

        {/* Running indicator (after inputs collected) */}
        {isRunning && !isCollectingInputs && (
          <div className="text-runly-muted animate-pulse">Executing...</div>
        )}

        {/* Input prompt — shows actual prompt text from code */}
        {isCollectingInputs && currentInputIndex < prompts.length && (
          <div className="flex items-center gap-0 mt-1">
            <span className="text-white whitespace-pre">{currentPrompt} </span>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-[#00ff00] outline-none font-mono text-sm caret-[#00ff00]"
              autoFocus
            />
            <span className="w-2 h-4 bg-[#00ff00] animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}
