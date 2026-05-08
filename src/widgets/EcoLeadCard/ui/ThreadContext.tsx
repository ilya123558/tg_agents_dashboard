'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ThreadMessage {
  id: number;
  author: string;
  text: string;
  isTarget: boolean;
  isSystem: boolean;
  timestamp?: string;
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

const AUTHOR_AVATAR_BG = [
  'bg-violet-500/20 text-violet-400 border-violet-500/30',
  'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'bg-teal-500/20 text-teal-400 border-teal-500/30',
];

function getAuthorStyle(author: string): string {
  let hash = 0;
  for (let i = 0; i < author.length; i++) hash = (hash * 31 + author.charCodeAt(i)) >>> 0;
  return AUTHOR_AVATAR_BG[hash % AUTHOR_AVATAR_BG.length];
}

function getAuthorInitials(author: string): string {
  if (author === '?') return '?';
  const parts = author.split('_').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return author.slice(0, 2).toUpperCase();
}

function MessageItem({ msg, index }: { msg: ThreadMessage; index: number }) {
  const authorStyle = getAuthorStyle(msg.author);
  const isCompact = msg.text.length < 40;

  return (
    <motion.div
      initial={{ opacity: 0, x: msg.isTarget ? 12 : -12, y: 10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{
        delay: index * 0.08,
        duration: 0.4,
        ease: [0.23, 1, 0.32, 1],
      }}
      className={`relative group ${msg.isTarget ? 'z-10' : ''}`}
    >
      {/* Connection line */}
      <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-gray-700/30 via-gray-700/20 to-transparent" />

      <div className={`flex gap-3 ${isCompact ? 'items-center' : 'items-start'}`}>
        {/* Avatar */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: index * 0.08 + 0.1, type: 'spring', stiffness: 400, damping: 18 }}
          className={`relative shrink-0 w-9 h-9 rounded-full border flex items-center justify-center text-[10px] font-bold ${authorStyle} ${
            msg.isTarget ? 'ring-2 ring-emerald-500/30 ring-offset-2 ring-offset-[#0c1a10]' : ''
          }`}
        >
          {getAuthorInitials(msg.author)}
          {msg.isTarget && (
            <motion.div
              className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0c1a10]"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </motion.div>

        {/* Content */}
        <div className={`flex-1 min-w-0 ${msg.isTarget ? 'bg-emerald-950/25 rounded-xl border border-emerald-800/20 p-3 -ml-1' : 'py-1'}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold ${msg.isSystem ? 'text-gray-600' : 'text-gray-300'}`}>
              {msg.isSystem ? 'Неизвестный' : msg.author}
            </span>
            {msg.isTarget && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.08 + 0.2, type: 'spring', stiffness: 500, damping: 20 }}
                className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-medium"
              >
                Целевое сообщение
              </motion.span>
            )}
          </div>
          <p className={`text-sm leading-relaxed ${msg.isTarget ? 'text-gray-100' : 'text-gray-400'}`}>
            {msg.text}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function ThreadContext({ context }: { context: string | null }) {
  const [expanded, setExpanded] = useState(true);
  const messages = useMemo(() => (context ? parseContext(context) : []), [context]);

  if (!context || messages.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.28, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="bg-[#0c1a10] border border-emerald-900/20 rounded-2xl p-5"
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 w-full mb-4 group"
      >
        <div className="flex items-center gap-2 flex-1">
          <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-[11px] text-emerald-700/80 uppercase tracking-widest font-medium">
            Контекст треда
          </span>
          <span className="text-[11px] text-gray-600">{messages.length} сообщ.</span>
        </div>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          className="text-gray-600 group-hover:text-emerald-400 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="thread"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <MessageItem key={msg.id} msg={msg} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
