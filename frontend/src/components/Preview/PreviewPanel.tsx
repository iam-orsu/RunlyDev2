'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { RefreshCw, ExternalLink, Eye } from 'lucide-react';
import { FileNode, LanguageId } from '@/types';
import { buildLibraryInjections, FOUC_FIX, needsFoucFix } from '@/lib/marketplace';

// ─── Console interceptor injected BEFORE any user code ────────
const CONSOLE_INTERCEPTOR = `<script>
  (function() {
    var __origLog = console.log;
    var __origError = console.error;
    var __origWarn = console.warn;

    console.log = function() {
      var args = Array.prototype.slice.call(arguments);
      window.parent.postMessage({
        type: 'console', level: 'log',
        message: args.map(String).join(' ')
      }, '*');
      __origLog.apply(console, arguments);
    };
    console.error = function() {
      var args = Array.prototype.slice.call(arguments);
      window.parent.postMessage({
        type: 'console', level: 'error',
        message: args.map(String).join(' ')
      }, '*');
      __origError.apply(console, arguments);
    };
    console.warn = function() {
      var args = Array.prototype.slice.call(arguments);
      window.parent.postMessage({
        type: 'console', level: 'warn',
        message: args.map(String).join(' ')
      }, '*');
      __origWarn.apply(console, arguments);
    };
    window.onerror = function(msg, src, line, col, err) {
      window.parent.postMessage({
        type: 'console', level: 'error',
        message: err ? err.toString() : String(msg)
      }, '*');
    };
    window.onunhandledrejection = function(e) {
      window.parent.postMessage({
        type: 'console', level: 'error',
        message: e.reason ? e.reason.toString() : 'Unhandled promise rejection'
      }, '*');
    };
  })();
</script>`;

// ─── Document builders per web mode ───────────────────────────

function buildHtmlDocument(files: FileNode[], selectedLibraries: string[]): string {
  const htmlFile = files.find(f => f.name === 'index.html');
  const cssFiles = files.filter(f => f.name.endsWith('.css'));
  const jsFiles = files.filter(f => f.name.endsWith('.js') && f.name !== 'index.html');

  let html = htmlFile?.content || '<!DOCTYPE html><html><head></head><body></body></html>';

  // Strip external <link rel="stylesheet"> and <script src="..."> tags — they'll 404 in the iframe
  // since files aren't served via real URLs. We inject their content inline instead.
  html = html.replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, '');
  html = html.replace(/<script[^>]*src=["'][^"']+["'][^>]*>\s*<\/script>/gi, '');

  // Inject CSS inline
  const styleTag = cssFiles
    .map(f => `<style>/* ${f.name} */\n${f.content || ''}</style>`)
    .join('\n');

  // Inject JS inline
  const scriptTag = jsFiles
    .map(f => `<script>/* ${f.name} */\n${f.content || ''}\n</script>`)
    .join('\n');

  // Insert marketplace libraries + console interceptor + styles into <head>
  const libBlock = buildLibraryInjections(selectedLibraries);
  const foucFix = needsFoucFix(selectedLibraries) ? FOUC_FIX : '';
  if (html.includes('<head>')) {
    html = html.replace('<head>', `<head>\n${libBlock}\n${foucFix}\n${CONSOLE_INTERCEPTOR}\n${styleTag}`);
  } else {
    html = libBlock + foucFix + CONSOLE_INTERCEPTOR + styleTag + html;
  }

  // Insert scripts before </body>
  if (html.includes('</body>')) {
    html = html.replace('</body>', `${scriptTag}\n</body>`);
  } else {
    html = html + scriptTag;
  }

  return html;
}

function buildReactDocument(code: string, selectedLibraries: string[]): string {
  const libBlock = buildLibraryInjections(selectedLibraries);
  const foucFix = needsFoucFix(selectedLibraries) ? FOUC_FIX : '';
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  ${libBlock}
  ${foucFix}
  ${CONSOLE_INTERCEPTOR}
  <style>
    body { margin: 0; font-family: sans-serif; background: white; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-presets="react">
    ${code}

    // Auto-render if App component exists
    if (typeof App !== 'undefined') {
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(App));
    }
  </script>
</body>
</html>`;
}

function buildVueDocument(code: string, selectedLibraries: string[]): string {
  const libBlock = buildLibraryInjections(selectedLibraries);
  const foucFix = needsFoucFix(selectedLibraries) ? FOUC_FIX : '';
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
  ${libBlock}
  ${foucFix}
  ${CONSOLE_INTERCEPTOR}
  <style>
    body { margin: 0; font-family: sans-serif; background: white; }
  </style>
</head>
<body>
  <div id="app"></div>
  <script>
    ${code}

    // Auto-mount if App exists
    if (typeof App !== 'undefined') {
      Vue.createApp(App).mount('#app');
    }
  </script>
</body>
</html>`;
}

function buildAngularDocument(code: string, selectedLibraries: string[]): string {
  const libBlock = buildLibraryInjections(selectedLibraries);
  const foucFix = needsFoucFix(selectedLibraries) ? FOUC_FIX : '';
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.8.3/angular.min.js"></script>
  ${libBlock}
  ${foucFix}
  ${CONSOLE_INTERCEPTOR}
  <style>
    body { margin: 0; font-family: sans-serif; background: white; }
  </style>
</head>
<body ng-app="runlyApp">
  <div ng-controller="MainController">
    <h1>{{ message }}</h1>
    <p>Count: {{ count }}</p>
    <button ng-click="increment()">Click me</button>
  </div>
  <script>
    angular.module('runlyApp', [])
      .controller('MainController', ['$scope', function($scope) {
        ${code}
      }]);
  </script>
</body>
</html>`;
}

// ─── Build document based on language ─────────────────────────
export function buildPreviewDocument(
  languageId: LanguageId,
  files: FileNode[],
  activeCode: string,
  selectedLibraries: string[] = [],
): string {
  switch (languageId) {
    case 'html':
      return buildHtmlDocument(files, selectedLibraries);
    case 'react':
      return buildReactDocument(activeCode, selectedLibraries);
    case 'vue':
      return buildVueDocument(activeCode, selectedLibraries);
    case 'angular':
      return buildAngularDocument(activeCode, selectedLibraries);
    default:
      return '';
  }
}

// ─── Console message type ─────────────────────────────────────
export interface WebConsoleMessage {
  level: 'log' | 'error' | 'warn';
  message: string;
}

// ─── PreviewPanel component ───────────────────────────────────
interface PreviewPanelProps {
  files: FileNode[];
  activeCode: string;
  languageId: LanguageId;
  onConsoleMessage: (msg: WebConsoleMessage) => void;
  onRefresh: () => void;
  refreshKey: number;
  selectedLibraries: string[];
}

export default function PreviewPanel({
  files,
  activeCode,
  languageId,
  onConsoleMessage,
  onRefresh,
  refreshKey,
  selectedLibraries,
}: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [srcdoc, setSrcdoc] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  // Debounced preview update — immediate on first render, 500ms after subsequent changes
  useEffect(() => {
    if (isFirstRender.current) {
      // Render immediately on first load — no waiting
      isFirstRender.current = false;
      const doc = buildPreviewDocument(languageId, files, activeCode, selectedLibraries);
      setSrcdoc(doc);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const doc = buildPreviewDocument(languageId, files, activeCode, selectedLibraries);
      setSrcdoc(doc);
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [files, activeCode, languageId, refreshKey, selectedLibraries]);

  // Listen for console messages from iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data && e.data.type === 'console') {
        onConsoleMessage({
          level: e.data.level || 'log',
          message: e.data.message || '',
        });
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onConsoleMessage]);

  // Open in new tab
  const openInNewTab = useCallback(() => {
    const doc = buildPreviewDocument(languageId, files, activeCode, selectedLibraries);
    const blob = new Blob([doc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, [languageId, files, activeCode, selectedLibraries]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0a0a0a] border-b border-runly-border">
        <div className="flex items-center gap-2">
          <Eye className="w-3.5 h-3.5 text-runly-accent" />
          <span className="text-xs font-medium text-runly-muted">Preview</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onRefresh}
            className="p-1 rounded hover:bg-[#2a2d2e] transition-colors"
            title="Refresh preview"
          >
            <RefreshCw className="w-3.5 h-3.5 text-runly-muted hover:text-runly-text" />
          </button>
          <button
            onClick={openInNewTab}
            className="p-1 rounded hover:bg-[#2a2d2e] transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5 text-runly-muted hover:text-runly-text" />
          </button>
        </div>
      </div>

      {/* Iframe */}
      <div className="flex-1 bg-white">
        <iframe
          ref={iframeRef}
          srcDoc={srcdoc}
          sandbox="allow-scripts allow-same-origin"
          className="w-full h-full border-0"
          title="Preview"
        />
      </div>
    </div>
  );
}
