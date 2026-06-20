import type { CatDef } from './classify';
import { avatarGradient } from './classify';

export const CLOTHING_CATS: CatDef[] = [
  { icon: '🧥', name: 'Верхняя одежда', re: /куртк|пальто|пуховик|пуфер|бомбер|плащ|дубленк/i },
  { icon: '👗', name: 'Платья',         re: /платье|платья|сарафан/i },
  { icon: '👖', name: 'Брюки',          re: /брюки|джинс|штаны|леггинс/i },
  { icon: '👟', name: 'Обувь',          re: /кроссовк|обувь|ботинк|кед|туфл|сапог|слипон|найк|adidas|jordan|yeezy|nike/i },
  { icon: '👜', name: 'Сумки',          re: /сумк|рюкзак|клатч|портмоне|кошелек/i },
  { icon: '🧣', name: 'Аксессуары',     re: /ремень|очки|шапк|шарф|перчатк|аксессуар/i },
  { icon: '🧒', name: 'Детская одежда', re: /детск|ребенк|дет\.|малыш|школьн/i },
  { icon: '🏃', name: 'Спортивная',     re: /спортивн|форм|тренировочн|леггинс|лосины/i },
  { icon: '🩲', name: 'Нижнее бельё',   re: /бельё|белье|нижн|трусы|бюстгальтер/i },
  { icon: '📦', name: 'Другое',         re: /./ },
];

export function classifyClothing(text: string, comment: string): string {
  const src = `${text} ${comment}`;
  for (const { name, re } of CLOTHING_CATS) {
    if (name !== 'Другое' && re.test(src)) return name;
  }
  return 'Другое';
}

export function resolveClothingCategory(category: string, text: string, comment: string): string {
  if (category && CLOTHING_CATS.some(c => c.name === category)) return category;
  return classifyClothing(text, comment);
}

export function getClothingCatDef(name: string): CatDef {
  return CLOTHING_CATS.find((c) => c.name === name) ?? CLOTHING_CATS[CLOTHING_CATS.length - 1];
}

export { avatarGradient };
