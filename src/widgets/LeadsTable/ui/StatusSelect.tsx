'use client';

import { useState, useRef, useEffect } from 'react';
import type { LeadStatus } from '@/entities/Lead';

const OPTIONS: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'новый',      label: 'Новый',      color: 'text-blue-400' },
  { value: 'отправлено', label: 'Отправлено', color: 'text-yellow-400' },
  { value: 'ответил',    label: 'Ответил',    color: 'text-green-400' },
  { value: 'не ответил', label: 'Не ответил', color: 'text-red-400' },
];

interface StatusSelectProps {
  value: LeadStatus;
  onChange: (value: LeadStatus) => void;
}

export function StatusSelect({ value, onChange }: StatusSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 bg-[#111] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs hover:border-white/20 transition-colors focus:outline-none"
      >
        <span className={current.color}>{current.label}</span>
        <svg className={`w-3 h-3 text-gray-600 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 bottom-full mb-1 z-50 bg-[#1e1e1e] border border-white/10 rounded-xl shadow-xl overflow-hidden min-w-[130px]">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors flex items-center gap-2 ${
                opt.value === value ? 'bg-white/5' : ''
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${
                opt.value === 'новый' ? 'bg-blue-400' :
                opt.value === 'отправлено' ? 'bg-yellow-400' :
                opt.value === 'ответил' ? 'bg-green-400' : 'bg-red-400'
              }`} />
              <span className={opt.color}>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
