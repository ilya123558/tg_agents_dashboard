'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Lead } from '@/entities/Lead';
import type { Seller } from '@/entities/Seller';

interface StatsPanelProps {
  leads: Lead[];
  sellers?: Seller[];
}

const STATUS_COLORS: Record<string, string> = {
  'новый':      'text-blue-400',
  'отправлено': 'text-yellow-400',
  'ответил':    'text-green-400',
  'не ответил': 'text-red-400',
};

function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const from = prev.current;
    const to = value;
    prev.current = to;
    if (from === to) return;

    const dur = 480;
    const t0 = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{display}</>;
}

export function StatsPanel({ leads, sellers }: StatsPanelProps) {
  const total = leads.length;
  const byStatus = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.status] = (acc[l.status] ?? 0) + 1;
    return acc;
  }, {});

  const groups = new Set(leads.map((l) => l.group)).size;

  const stats = [
    { label: 'Всего лидов', value: total, color: 'text-white' },
    { label: 'Новых',       value: byStatus['новый']       ?? 0, color: STATUS_COLORS['новый'] },
    { label: 'Отправлено',  value: byStatus['отправлено']  ?? 0, color: STATUS_COLORS['отправлено'] },
    { label: 'Ответили',    value: byStatus['ответил']     ?? 0, color: STATUS_COLORS['ответил'] },
    { label: 'Не ответили', value: byStatus['не ответил']  ?? 0, color: STATUS_COLORS['не ответил'] },
    { label: 'Групп',       value: groups,                       color: 'text-purple-400' },
    ...(sellers !== undefined ? [{ label: 'Продавцов', value: sellers.length, color: 'text-orange-400' }] : []),
  ];

  const cols = sellers !== undefined
    ? 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-7'
    : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6';

  return (
    <div className={`grid ${cols} gap-3`}>
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 14, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3, delay: i * 0.055, ease: [0.23, 1, 0.32, 1] }}
          whileHover={{ y: -2, scale: 1.02 }}
          className="bg-[#1a1a1a] border border-white/5 rounded-xl p-4 cursor-default
                     hover:border-white/10 hover:bg-[#1e1e1e] transition-colors duration-200"
        >
          <div className={`text-2xl font-bold ${s.color}`}>
            <CountUp value={s.value} />
          </div>
          <div className="text-xs text-gray-500 mt-1">{s.label}</div>
        </motion.div>
      ))}
    </div>
  );
}
