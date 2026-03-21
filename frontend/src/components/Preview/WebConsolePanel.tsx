'use client';

import { useRef, useEffect } from 'react';
import { Terminal, Trash2 } from 'lucide-react';
import { WebConsoleMessage } from './PreviewPanel';

interface WebConsolePanelProps {
  messages: WebConsoleMessage[];
  onClear: () => void;
}

export default function WebConsolePanel({ messages, onClear }: WebConsolePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function getLevelStyles(level: WebConsoleMessage['level']): { className: string; prefix: string } {
    switch (level) {
      case 'log':
        return { className: 'text-white', prefix: '>' };
      case 'warn':
        return { className: 'text-[#ffa657]', prefix: '⚠' };
      case 'error':
        return { className: 'text-[#ff7b72]', prefix: '✕' };
    }
  }

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0a0a0a] border-b border-runly-border">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-[#00ff00]" />
          <span className="text-xs font-medium text-runly-muted">Console</span>
          {messages.length > 0 && (
            <span className="text-[10px] text-runly-muted bg-runly-bg px-1.5 py-0.5 rounded-full">
              {messages.length}
            </span>
          )}
        </div>
        <button
          onClick={onClear}
          className="p-1 rounded hover:bg-[#2a2d2e] transition-colors"
          title="Clear console"
        >
          <Trash2 className="w-3 h-3 text-runly-muted hover:text-runly-text" />
        </button>
      </div>

      {/* Console body */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-3 font-mono text-xs">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-[#333] text-xs">No console output</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const { className, prefix } = getLevelStyles(msg.level);
            return (
              <div key={i} className={`leading-relaxed whitespace-pre-wrap break-all ${className}`}>
                <span className="opacity-60 mr-2 select-none">{prefix}</span>
                {msg.message}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
