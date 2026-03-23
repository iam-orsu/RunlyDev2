import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal as TerminalIcon } from 'lucide-react';
import { LanguageId } from '@/types';
import '@xterm/xterm/css/xterm.css';

interface FileEntry {
  name: string;
  content: string;
}

interface XTerminalProps {
  language: LanguageId;
  files: FileEntry[];
  sessionId: string;
  onExit?: () => void;
}

export default function XTerminal({ language, files, sessionId, onExit }: XTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'Connecting...' | 'Connected' | 'Disconnected'>('Connecting...');
  
  // Keep refs for cleanup
  const wsRef = useRef<WebSocket | null>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // 1. Initialize Terminal
    const term = new Terminal({
      theme: {
        background: '#000000',
        foreground: '#c9d1d9',
        cursor: '#ffffff',
        black: '#000000',
        green: '#3fb950',
        red: '#ff7b72',
        yellow: '#ffa657',
        blue: '#58a6ff'
      },
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 14,
      cursorBlink: true,
      scrollback: 5000,
    });
    
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    
    // Initial fit needs a microtask delay often
    setTimeout(() => fitAddon.fit(), 0);

    termRef.current = term;
    fitRef.current = fitAddon;

    // 2. Setup WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/execute`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('Connected');
      ws.send(JSON.stringify({ type: 'start', language, files }));
    };

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }));
      }
    });

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'output' && msg.data) {
          term.write(msg.data);
        } else if (msg.type === 'exit') {
          let text = '';
          if (msg.timedOut) {
            text = '\r\n\x1b[33m⏱ Execution timed out (30s)\x1b[0m\r\n';
          } else {
            const icon = msg.exitCode === 0 ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
            text = `\r\n${icon} \x1b[90mProcess exited with code ${msg.exitCode ?? 'N/A'}\x1b[0m\r\n`;
          }
          term.write(text);
          setStatus('Disconnected');
          onExit?.();
        }
      } catch (e) {
        // ignore
      }
    };

    ws.onclose = () => {
      setStatus('Disconnected');
      onExit?.();
    };

    ws.onerror = () => {
      term.write('\r\n\x1b[31mError connecting to execution engine.\x1b[0m\r\n');
      setStatus('Disconnected');
    };

    // 3. Handle Resizing
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        try {
          fitAddon.fit();
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'resize',
              cols: term.cols,
              rows: term.rows
            }));
          }
        } catch (e) {}
      }, 50);
    });
    
    resizeObserver.observe(terminalRef.current);

    // 4. Cleanup
    return () => {
      resizeObserver.disconnect();
      clearTimeout(resizeTimeout);
      if (ws.readyState === WebSocket.OPEN) {
        // We can send Ctrl+C to forcefully terminate if the unmount was a stop click
        ws.send(JSON.stringify({ type: 'input', data: '\x03' }));
        setTimeout(() => ws.close(), 100);
      } else {
        ws.close();
      }
      term.dispose();
    };
  }, [sessionId, language]); // Re-run when sessionId changes (new run)

  return (
    <div className="h-full flex flex-col bg-[#000000]">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0a0a0a] border-b border-runly-border shrink-0">
        <TerminalIcon className="w-3.5 h-3.5 text-[#3fb950]" />
        <span className="text-xs font-medium text-runly-muted">Interactive Console</span>
        <span className="text-[10px] ml-auto text-runly-muted italic">{status}</span>
      </div>

      {/* Terminal Container */}
      <div className="flex-1 overflow-hidden relative">
        <div 
          ref={terminalRef} 
          className="absolute inset-x-2 inset-y-2"
        />
      </div>
    </div>
  );
}
