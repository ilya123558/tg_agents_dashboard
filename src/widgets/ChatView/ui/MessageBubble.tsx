'use client';

import { motion } from 'framer-motion';
import type { ChatMessage } from '@/shared/lib/chatMessages';
import { formatTime } from '@/shared/lib/conversations';

interface MessageBubbleProps {
  message: ChatMessage;
  index: number;
}

export function MessageBubble({ message, index }: MessageBubbleProps) {
  const isOut = message.direction === 'out';
  const isFailed = message.status === 'failed';
  const isPending = message.status === 'pending' || message.status === 'sending';

  const bubbleClass = isOut
    ? isFailed
      ? 'bg-red-500/15 text-white rounded-br-md border border-red-500/30'
      : 'bg-blue-500/15 text-white rounded-br-md border border-blue-500/20'
    : 'bg-white/[0.05] text-gray-200 rounded-bl-md border border-white/[0.04]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, delay: Math.min(index, 6) * 0.03, ease: [0.23, 1, 0.32, 1] }}
      className={`flex ${isOut ? 'justify-end' : 'justify-start'} px-3 md:px-4`}
    >
      <div className={`max-w-[78%] relative rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm break-words ${bubbleClass}`}>
        <div className="whitespace-pre-wrap">{message.text}</div>
        {isFailed && message.error && (
          <div className="mt-1.5 pt-1.5 border-t border-red-500/20 text-[10px] text-red-300/80">
            ⚠ {message.error.slice(0, 120)}
          </div>
        )}
        <div className={`text-[10px] mt-1 flex items-center gap-1 tabular-nums
                        ${isOut
                          ? isFailed ? 'text-red-300/70 justify-end' : 'text-blue-300/60 justify-end'
                          : 'text-gray-600'}`}>
          <span>{formatTime(message.createdAt)}</span>
          {isOut && isFailed && (
            <svg className="w-3 h-3 -mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86a2 2 0 001.74-3L13.74 4a2 2 0 00-3.48 0L3.34 16a2 2 0 001.74 3z" />
            </svg>
          )}
          {isOut && isPending && (
            <svg className="w-3 h-3 -mr-0.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          {isOut && message.status === 'sent' && (
            <svg className="w-3 h-3 -mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
    </motion.div>
  );
}
