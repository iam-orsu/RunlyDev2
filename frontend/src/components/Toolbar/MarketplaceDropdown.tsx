'use client';

import { useState, useRef, useEffect } from 'react';
import { Package, AlertTriangle, X } from 'lucide-react';
import {
  getLibrariesByCategory,
  type MarketplaceLibrary,
} from '@/lib/marketplace';

interface MarketplaceDropdownProps {
  selectedLibraries: string[];
  onLibraryChange: (ids: string[]) => void;
}

export default function MarketplaceDropdown({
  selectedLibraries,
  onLibraryChange,
}: MarketplaceDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [open]);

  const toggle = (id: string) => {
    if (selectedLibraries.includes(id)) {
      onLibraryChange(selectedLibraries.filter(l => l !== id));
    } else {
      onLibraryChange([...selectedLibraries, id]);
    }
  };

  const clearAll = () => onLibraryChange([]);

  const hasUnmetDeps = (lib: MarketplaceLibrary): boolean => {
    if (!lib.requires) return false;
    return lib.requires.some(r => !selectedLibraries.includes(r));
  };

  const categories = getLibrariesByCategory();
  const count = selectedLibraries.length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
          count > 0
            ? 'bg-runly-accent/15 text-runly-accent border border-runly-accent/30'
            : 'bg-runly-bg border border-runly-border text-runly-muted hover:border-runly-accent/50'
        }`}
        title="CDN Package Marketplace"
      >
        <Package className="w-3.5 h-3.5" />
        <span>Packages</span>
        {count > 0 && (
          <span className="bg-runly-accent text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
            {count}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute top-full right-0 mt-1.5 w-[320px] max-h-[480px] overflow-y-auto
                        bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl shadow-black/60 z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#30363d] sticky top-0 bg-[#161b22] z-10">
            <div className="flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-runly-accent" />
              <span className="text-xs font-semibold text-runly-text">CDN Packages</span>
            </div>
            <div className="flex items-center gap-1.5">
              {count > 0 && (
                <button
                  onClick={clearAll}
                  className="text-[10px] text-runly-muted hover:text-runly-text px-1.5 py-0.5 rounded
                             hover:bg-[#21262d] transition-colors"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-0.5 rounded hover:bg-[#21262d] transition-colors"
              >
                <X className="w-3.5 h-3.5 text-runly-muted" />
              </button>
            </div>
          </div>

          {/* Categories */}
          <div className="py-1">
            {categories.map(({ category, label, libs }) => (
              <div key={category}>
                {/* Category header */}
                <div className="px-3 py-1.5 text-[10px] font-semibold text-runly-muted uppercase tracking-wider">
                  {label}
                </div>

                {/* Library rows */}
                {libs.map(lib => {
                  const checked = selectedLibraries.includes(lib.id);
                  const unmet = checked && hasUnmetDeps(lib);

                  return (
                    <div key={lib.id}>
                      <button
                        onClick={() => toggle(lib.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors
                                   hover:bg-[#21262d] ${checked ? 'bg-[#1c2333]' : ''}`}
                      >
                        {/* Checkbox */}
                        <div className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                          checked
                            ? 'bg-runly-accent border-runly-accent'
                            : 'border-[#484f58] bg-transparent'
                        }`}>
                          {checked && (
                            <svg className="w-2.5 h-2.5 text-black" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-runly-text truncate">{lib.name}</span>
                            {lib.size && (
                              <span className="text-[9px] text-runly-muted bg-[#21262d] px-1.5 py-0.5 rounded-full flex-shrink-0">
                                {lib.size}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-runly-muted leading-tight">{lib.description}</span>
                        </div>
                      </button>

                      {/* Dependency warning */}
                      {unmet && lib.warning && (
                        <div className="flex items-center gap-1.5 px-3 pb-1.5 ml-6">
                          <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                          <span className="text-[10px] text-amber-400">{lib.warning}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
