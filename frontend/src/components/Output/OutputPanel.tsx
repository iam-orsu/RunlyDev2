'use client';

import { Submission } from '@/types';
import { Terminal, Clock, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface OutputPanelProps {
  submission: Submission | null;
  isRunning: boolean;
  error: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    success:       { bg: 'bg-runly-success/15', text: 'text-runly-success', label: 'Success' },
    error:         { bg: 'bg-runly-error/15',   text: 'text-runly-error',   label: 'Error' },
    timeout:       { bg: 'bg-runly-warning/15', text: 'text-runly-warning', label: 'Timeout' },
    compile_error: { bg: 'bg-runly-warning/15', text: 'text-runly-warning', label: 'Compile Error' },
    oom:           { bg: 'bg-runly-error/15',   text: 'text-runly-error',   label: 'Out of Memory' },
    queued:        { bg: 'bg-runly-muted/15',   text: 'text-runly-muted',   label: 'Queued' },
    running:       { bg: 'bg-runly-accent/15',  text: 'text-runly-accent',  label: 'Running' },
  };

  const c = config[status] || config.error;

  return (
    <span className={`status-badge ${c.bg} ${c.text}`}>
      {status === 'success' && <CheckCircle2 className="w-3 h-3" />}
      {status === 'error' && <XCircle className="w-3 h-3" />}
      {(status === 'timeout' || status === 'compile_error') && <AlertTriangle className="w-3 h-3" />}
      {status === 'oom' && <XCircle className="w-3 h-3" />}
      {c.label}
    </span>
  );
}

function ExitCodeBadge({ code }: { code: number | null }) {
  if (code === null) return null;
  const isSuccess = code === 0;
  return (
    <span className={`status-badge ${isSuccess ? 'bg-runly-success/15 text-runly-success' : 'bg-runly-error/15 text-runly-error'}`}>
      Exit: {code}
    </span>
  );
}

export default function OutputPanel({ submission, isRunning, error }: OutputPanelProps) {
  // Loading state
  if (isRunning) {
    return (
      <div className="h-full flex flex-col">
        <OutputHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-runly-accent animate-spin mx-auto mb-3" />
            <p className="text-runly-muted animate-pulse-glow">Executing...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state (network/API error)
  if (error) {
    return (
      <div className="h-full flex flex-col">
        <OutputHeader />
        <div className="flex-1 p-4">
          <div className="p-3 rounded-lg bg-runly-error/10 border border-runly-error/20">
            <p className="text-runly-error text-sm font-mono">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!submission) {
    return (
      <div className="h-full flex flex-col">
        <OutputHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Terminal className="w-10 h-10 text-runly-border mx-auto mb-3" />
            <p className="text-runly-muted text-sm">Run your code to see output here</p>
            <p className="text-runly-border text-xs mt-1">Ctrl + Enter</p>
          </div>
        </div>
      </div>
    );
  }

  // Result state
  return (
    <div className="h-full flex flex-col">
      <OutputHeader />

      {/* Status bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-runly-border flex-wrap">
        <StatusBadge status={submission.status} />
        <ExitCodeBadge code={submission.exit_code} />
        {submission.execution_time_ms !== null && (
          <span className="status-badge bg-runly-panel text-runly-muted">
            <Clock className="w-3 h-3" />
            {submission.execution_time_ms}ms
          </span>
        )}
      </div>

      {/* Output content */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {/* Compile errors */}
        {submission.compile_output && (
          <OutputBlock label="Compile Output" color="text-runly-warning" content={submission.compile_output} />
        )}

        {/* stdout */}
        {submission.stdout && (
          <OutputBlock label="stdout" color="text-runly-text" content={submission.stdout} />
        )}

        {/* stderr */}
        {submission.stderr && !submission.compile_output && (
          <OutputBlock label="stderr" color="text-runly-error" content={submission.stderr} />
        )}

        {/* No output */}
        {!submission.stdout && !submission.stderr && !submission.compile_output && (
          <p className="text-runly-muted text-sm italic">Program produced no output</p>
        )}
      </div>
    </div>
  );
}

function OutputHeader() {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-runly-border">
      <Terminal className="w-4 h-4 text-runly-muted" />
      <span className="text-sm font-medium text-runly-muted">Output</span>
    </div>
  );
}

function OutputBlock({ label, color, content }: { label: string; color: string; content: string }) {
  return (
    <div>
      <p className="text-xs text-runly-muted mb-1 uppercase tracking-wider">{label}</p>
      <pre className={`${color} font-mono text-sm whitespace-pre-wrap break-all bg-runly-bg rounded-lg p-3 border border-runly-border`}>
        {content}
      </pre>
    </div>
  );
}
