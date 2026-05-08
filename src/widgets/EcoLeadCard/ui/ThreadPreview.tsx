'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ThreadMessage {
  id: number;
  author: string;
  text: string;
  isTarget: boolean;
  isSystem: boolean;
}

function parseContext(context: string): ThreadMessage[] {
  const lines = context.split('\n').filter((l) => l.trim());
  const messages: ThreadMessage[] = [];
  let current: Partial<ThreadMessage> | null = null;
  let id = 0;

  for (const line of lines) {
    const trimmed = line.trimStart();
    const match = trimmed.match(/^(>>>)?\s*\[([^\]]+)\]:\s*(.*)$/);
    if (match) {
      if (current && current.text) {
        messages.push({ ...current, id: id++ } as ThreadMessage);
      }
      const [, isTargetStr, author, text] = match;
      const isTarget = !!isTargetStr;
      current = {
        author,
        text,
        isTarget,
        isSystem: author === '?',
      };
    } else if (current) {
      current.text += '\n' + trimmed;
    }
  }
  if (current && current.text) {
    messages.push({ ...current, id: id++ } as ThreadMessage);
  }
  return messages;
}

const AUTHOR_COLORS = [
  'text-violet-400',
  'text-cyan-400',
  'text-amber-400',
  'text-pink-400',
  'text-emerald-400',
  'text-blue-400',
  'text-orange-400',
  'text-teal-400',
];

function getAuthorColor(author: string): string {
  let hash = 0;
  for (let i = 0; i < author.length; i++) hash = (hash * 31 + author.charCodeAt(i)) >>> 0;
  return AUTHOR_COLORS[hash % AUTHOR_COLORS.length];
}

function MessageBubble({ msg, index }: { msg: ThreadMessage; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: msg.isTarget ? 8 : -8, y: 6 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{
        delay: index * 0.06,
        duration: 0.35,
        ease: [0.23, 1, 0.32, 1],
      }}
      className={`relative pl-3 py-1.5 ${
        msg.isTarget
          ? 'bg-emerald-950/20 rounded-lg border border-emerald-800/20 -mx-1 px-4'
          : ''
      }`}
    >
      {/* Timeline dot */}
      <div
        className={`absolute left-0 top-2 w-[5px] h-[5px] rounded-full ${
          msg.isTarget
            ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]'
            : msg.isSystem
            ? 'bg-gray-700'
            : 'bg-gray-600'
        }`}
      />

      {/* Target glow indicator */}
      {msg.isTarget && (
        <motion.div
          layoutId={`target-${msg.id}`}
          className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full bg-gradient-to-b from-emerald-400/80 via-emerald-500/40 to-transparent"
        />
      )}

      <div className="flex items-baseline gap-1.5">
        <span className={`text-[10px] font-mono font-semibold ${getAuthorColor(msg.author)}`}>
          {msg.isSystem ? '…' : msg.author.length > 12 ? msg.author.slice(0, 10) + '..' : msg.author}
        </span>
        {msg.isTarget && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.06 + 0.15, type: 'spring', stiffness: 500, damping: 20 }}
            className="text-[9px] px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-medium"
          >
            целевое
          </motion.span>
        )}
      </div>
      <p className={`text-[11px] leading-relaxed mt-0.5 ${msg.isTarget ? 'text-gray-200' : 'text-gray-500'}`}>
        {msg.text}
      </p>
    </motion.div>
  );
}

export function ThreadPreview({ context }: { context: string | null }) {
  const [open, setOpen] = useState(false);
  const messages = useMemo(() => (context ? parseContext(context) : []), [context]);

  if (!context || messages.length === 0) return null;

  const targetIndex = messages.findIndex((m) => m.isTarget);
  const previewMessages = messages.slice(Math.max(0, targetIndex - 1), targetIndex + 2);
  const hasMore = messages.length > previewMessages.length;

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-[2px] top-2 bottom-2 w-px bg-gradient-to-b from-gray-700/40 via-gray-700/20 to-transparent rounded-full" />

      <div className="space-y-0.5">
        <AnimatePresence mode="popLayout">
          {(open ? messages : previewMessages).map((msg, i) => (
            <MessageBubble key={msg.id} msg={msg} index={i} />
          ))}
        </AnimatePresence>
      </div>

      {hasMore && (
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          whileTap={{ scale: 0.96 }}
          className="mt-2 ml-3 flex items-center gap-1.5 text-[11px] text-gray-600 hover:text-emerald-400 transition-colors group"
        >
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="inline-block"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.span>
          <span className="group-hover:underline underline-offset-2">
            {open ? 'Свернуть контекст' : `+${messages.length - previewMessages.length} сообщ.`}
          </span>
        </motion.button>
      )}
    </div>
  );
}
