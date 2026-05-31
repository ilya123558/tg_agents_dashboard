'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QUICK_REPLIES } from '@/shared/lib/conversations';

interface ComposerProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function Composer({ onSend, disabled = false }: ComposerProps) {
  const [draft, setDraft] = useState('');
  const [showQuick, setShowQuick] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Авто-ресайз textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [draft]);

  function send() {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft('');
    setShowQuick(false);
  }

  function pickQuick(template: string) {
    setDraft((prev) => (prev ? `${prev} ${template}` : template));
    setShowQuick(false);
    textareaRef.current?.focus();
  }

  return (
    <div
      className="relative border-t border-white/[0.06] bg-[#111]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <AnimatePresence>
        {showQuick && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="absolute bottom-full left-3 right-3 mb-2 bg-[#161616] border border-white/[0.08]
                       rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-white/[0.05] flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-gray-600">Быстрые ответы</span>
              <button onClick={() => setShowQuick(false)} className="text-xs text-gray-600 hover:text-gray-400">×</button>
            </div>
            <div className="py-1">
              {QUICK_REPLIES.map((tpl, i) => (
                <motion.button
                  key={tpl}
                  type="button"
                  onClick={() => pickQuick(tpl)}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  whileHover={{ x: 2 }}
                  className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/[0.04] transition-colors"
                >
                  {tpl}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-2.5 md:p-3 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-2xl px-2.5 md:px-3 py-1.5 md:py-2
                        focus-within:border-white/15 transition-colors">
          <button
            type="button"
            onClick={() => setShowQuick((v) => !v)}
            className="shrink-0 p-1 text-gray-600 hover:text-gray-300 transition-colors"
            title="Быстрые ответы"
            disabled={disabled}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>
          <textarea
            ref={textareaRef}
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Сообщение..."
            disabled={disabled}
            className="flex-1 resize-none bg-transparent text-sm text-white placeholder:text-gray-700
                       focus:outline-none disabled:opacity-50 min-h-[24px] max-h-[140px] leading-relaxed py-0.5"
          />
          <motion.button
            type="button"
            onClick={send}
            disabled={!draft.trim() || disabled}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.05 }}
            className="shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-full bg-blue-500 text-white
                       disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-400 transition-colors
                       flex items-center justify-center shadow-lg shadow-blue-500/20"
            title="Отправить"
          >
            <svg className="w-4 h-4 -ml-px" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
            </svg>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
