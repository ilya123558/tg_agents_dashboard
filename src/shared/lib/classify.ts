export interface CatDef {
  icon: string;
  name: string;
  re: RegExp;
}

export const CATS: CatDef[] = [
  { icon: '📱', name: 'iPhone',   re: /iphone|айфон/i },
  { icon: '📱', name: 'Samsung',  re: /samsung|самсунг|galaxy/i },
  { icon: '📱', name: 'Xiaomi',   re: /xiaomi|redmi|poco|сяоми|редми/i },
  { icon: '🎧', name: 'Наушники', re: /наушник|airpod|tws|беспровод/i },
  { icon: '⌚', name: 'Часы',     re: /часы|watch/i },
  { icon: '💻', name: 'Ноутбук',  re: /ноутбук|laptop|macbook/i },
  { icon: '📟', name: 'Планшет',  re: /планшет|ipad/i },
  { icon: '📺', name: 'ТВ',       re: /телевизор/i },
  { icon: '🎮', name: 'Игровая',  re: /ps[45]|xbox|playstation/i },
  { icon: '📦', name: 'Другое',   re: /./ },
];

export function classify(text: string, comment: string): string {
  const src = `${text} ${comment}`;
  for (const { name, re } of CATS) {
    if (name !== 'Другое' && re.test(src)) return name;
  }
  return 'Другое';
}

export function getCatDef(name: string): CatDef {
  return CATS.find((c) => c.name === name) ?? CATS[CATS.length - 1];
}

const GRADIENTS = [
  'from-rose-500 to-pink-600',
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-sky-500 to-blue-600',
  'from-fuchsia-500 to-pink-600',
];

export function avatarGradient(s: string): string {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) & 0xfffff;
  return GRADIENTS[h % GRADIENTS.length];
}
