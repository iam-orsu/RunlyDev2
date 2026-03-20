'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Loader2, ChevronDown } from 'lucide-react';
import { LanguageOption, LANGUAGES, LanguageId } from '@/types';

interface EditorToolbarProps {
  language: LanguageOption;
  onLanguageChange: (id: LanguageId) => void;
  onRun: () => void;
  isRunning: boolean;
}

export default function EditorToolbar({ language, onLanguageChange, onRun, isRunning }: EditorToolbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-runly-panel border-b border-runly-border">
      {/* Language selector */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-runly-bg border border-runly-border
                     hover:border-runly-accent/50 transition-colors text-sm font-medium"
        >
          <span className="text-base">{language.icon}</span>
          <span>{language.name}</span>
          <ChevronDown className={`w-4 h-4 text-runly-muted transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute top-full left-0 mt-1 w-52 bg-runly-panel border border-runly-border
                          rounded-lg shadow-xl shadow-black/40 z-50 overflow-hidden">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                onClick={() => {
                  onLanguageChange(lang.id);
                  setDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors
                           hover:bg-runly-accent/10
                           ${lang.id === language.id ? 'bg-runly-accent/15 text-runly-accent' : 'text-runly-text'}`}
              >
                <span className="text-base w-6 text-center">{lang.icon}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Run button */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-runly-muted hidden sm:block">
          Ctrl + Enter
        </span>
        <button
          onClick={onRun}
          disabled={isRunning}
          className="btn-primary text-sm"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Run
            </>
          )}
        </button>
      </div>
    </div>
  );
}
