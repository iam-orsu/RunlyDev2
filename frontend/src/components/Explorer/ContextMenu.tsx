'use client';

import { useEffect, useRef } from 'react';

export interface ContextMenuItem {
  label: string;
  icon?: string;
  danger?: boolean;
  onClick: () => void;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export default function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    function handleScroll() {
      onClose();
    }

    // Use setTimeout to avoid the context menu closing immediately from the same right-click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick, true);
      document.addEventListener('keydown', handleEsc);
      document.addEventListener('scroll', handleScroll, true);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick, true);
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  // Keep menu within viewport
  const adjustedX = Math.min(x, (typeof window !== 'undefined' ? window.innerWidth : 1000) - 180);
  const adjustedY = Math.min(y, (typeof window !== 'undefined' ? window.innerHeight : 800) - (items.length * 32 + 8));

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', top: adjustedY, left: adjustedX, zIndex: 9999 }}
      className="min-w-[160px] bg-[#1e1e1e] border border-[#454545] rounded shadow-xl shadow-black/60 py-1 overflow-hidden"
    >
      {items.map((item, i) => (
        <button
          key={i}
          onClick={(e) => {
            e.stopPropagation();
            item.onClick();
            onClose();
          }}
          className={`w-full text-left px-3 py-1.5 text-[13px] flex items-center gap-2.5 transition-colors
            ${item.danger
              ? 'text-red-400 hover:bg-[#2a2d2e]'
              : 'text-[#cccccc] hover:bg-[#2a2d2e]'
            }`}
        >
          {item.icon && <span className="text-xs w-4 text-center opacity-80">{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </div>
  );
}
