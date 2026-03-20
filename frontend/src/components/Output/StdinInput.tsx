'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface StdinInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function StdinInput({ value, onChange }: StdinInputProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-t border-runly-border">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-runly-muted
                   hover:text-runly-text hover:bg-runly-bg/50 transition-colors"
      >
        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        <span>stdin (optional)</span>
        {value && <span className="w-2 h-2 rounded-full bg-runly-accent" />}
      </button>

      {isOpen && (
        <div className="px-4 pb-3">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Provide input for your program..."
            rows={3}
            className="w-full bg-runly-bg border border-runly-border rounded-lg px-3 py-2
                       text-sm font-mono text-runly-text placeholder-runly-border
                       resize-none focus:outline-none focus:border-runly-accent/50
                       transition-colors"
          />
        </div>
      )}
    </div>
  );
}
