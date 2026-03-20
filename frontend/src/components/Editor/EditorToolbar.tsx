'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Loader2, ChevronDown, AlertTriangle } from 'lucide-react';
import { LanguageOption, LANGUAGES, LanguageId } from '@/types';

interface EditorToolbarProps {
  language: LanguageOption;
  onLanguageChange: (id: LanguageId) => void;
  onRun: () => void;
  isRunning: boolean;
  activeFileName: string;
}

export default function EditorToolbar({ language, onLanguageChange, onRun, isRunning, activeFileName }: EditorToolbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [pendingLanguage, setPendingLanguage] = useState<LanguageId | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLanguageClick = (id: LanguageId) => {
    if (id === language.id) {
      setDropdownOpen(false);
      return;
    }
    setPendingLanguage(id);
    setShowSwitchModal(true);
    setDropdownOpen(false);
  };

  const confirmSwitch = () => {
    if (pendingLanguage) {
      onLanguageChange(pendingLanguage);
    }
    setShowSwitchModal(false);
    setPendingLanguage(null);
  };

  const cancelSwitch = () => {
    setShowSwitchModal(false);
    setPendingLanguage(null);
  };

  const pendingLang = pendingLanguage ? LANGUAGES.find(l => l.id === pendingLanguage) : null;

  return (
    <>
      <div className="flex items-center justify-between px-3 py-1.5 bg-runly-panel border-b border-runly-border">
        {/* Left: Language selector + active file */}
        <div className="flex items-center gap-3">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-runly-bg border border-runly-border
                         hover:border-runly-accent/50 transition-colors text-xs font-medium"
            >
              <span className="text-sm">{language.icon}</span>
              <span>{language.name}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-runly-muted transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-[#1c2128] border border-runly-border
                              rounded-lg shadow-xl shadow-black/40 z-50 overflow-hidden">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => handleLanguageClick(lang.id)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors
                               hover:bg-runly-accent/10
                               ${lang.id === language.id ? 'bg-runly-accent/15 text-runly-accent' : 'text-runly-text'}`}
                  >
                    <span className="text-sm w-5 text-center">{lang.icon}</span>
                    <span>{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Active file tab */}
          <span className="text-xs text-runly-muted">
            {activeFileName}
          </span>
        </div>

        {/* Right: Run */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-runly-muted hidden sm:block">Ctrl+Enter</span>
          <button onClick={onRun} disabled={isRunning} className="btn-primary text-xs py-1.5 px-3">
            {isRunning ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Running...</>
            ) : (
              <><Play className="w-3.5 h-3.5" /> Run</>
            )}
          </button>
        </div>
      </div>

      {/* Language Switch Modal */}
      {showSwitchModal && pendingLang && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1c2128] border border-runly-border rounded-xl p-6 w-[400px] shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-runly-warning/15 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-runly-warning" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-runly-text">
                  Switch to {pendingLang.name}?
                </h3>
                <p className="text-xs text-runly-muted mt-0.5">
                  This will delete all current files
                </p>
              </div>
            </div>

            <p className="text-sm text-runly-muted mb-6">
              All current files and folders will be deleted and replaced with a fresh {pendingLang.name} workspace.
              This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={cancelSwitch}
                className="px-4 py-2 text-sm rounded-lg border border-runly-border text-runly-text
                           hover:bg-runly-bg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmSwitch}
                className="px-4 py-2 text-sm rounded-lg bg-runly-error text-white font-medium
                           hover:bg-red-600 transition-colors"
              >
                Switch Language
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
