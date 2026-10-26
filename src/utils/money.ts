export type MoneyKind = 'coin' | 'note';

export interface MoneySpec {
  kind: MoneyKind;
  denomination: number;
}

/** Номиналы и их относительная частота появления. */
const COINS: Array<[number, number]> = [
  [1, 26],
  [2, 20],
  [5, 14],
  [10, 8],
];

const NOTES: Array<[number, number]> = [
  [50, 10],
  [100, 8],
  [500, 6],
  [1000, 4],
  [5000, 2],
];

const POOL: Array<MoneySpec & { weight: number }> = [
  ...COINS.map(([denomination, weight]) => ({ kind: 'coin' as const, denomination, weight })),
  ...NOTES.map(([denomination, weight]) => ({ kind: 'note' as const, denomination, weight })),
];

const TOTAL_WEIGHT = POOL.reduce((sum, item) => sum + item.weight, 0);

export function pickDenomination(rand: () => number = Math.random): MoneySpec {
  let roll = rand() * TOTAL_WEIGHT;
  for (const item of POOL) {
    roll -= item.weight;
    if (roll <= 0) return { kind: item.kind, denomination: item.denomination };
  }
  const last = POOL[POOL.length - 1];
  return { kind: last.kind, denomination: last.denomination };
}

/**
 * Интенсивность денежного потока.
 *
 * Пороги заданы по общему доходу группы в секунду, а не по «сырой» зарплате:
 * так 100 000 ₽ × 10 человек и 1 000 000 ₽ × 1 человек дают одинаковый поток.
 * Зависимость непрерывная (lerp внутри уровня), поэтому при изменении параметров
 * интенсивность меняется плавно, без скачков.
 */
export interface FlowLevel {
  /** Максимум одновременно отображаемых объектов. */
  maxObjects: number;
  /** Максимум новых объектов в секунду. */
  spawnPerSecond: number;
  /** Множитель скорости падения. */
  speedFactor: number;
  /** Множитель разброса размеров. */
  sizeFactor: number;
}

interface FlowBand {
  /** Нижний порог дохода группы, ₽/сек. */
  from: number;
  /** Верхний порог дохода группы, ₽/сек. */
  to: number;
  level: FlowLevel;
}

const FLOW_BANDS: FlowBand[] = [
  { from: 0, to: 0.2, level: { maxObjects: 10, spawnPerSecond: 1.6, speedFactor: 0.85, sizeFactor: 0.9 } },
  { from: 0.2, to: 2, level: { maxObjects: 22, spawnPerSecond: 4, speedFactor: 1, sizeFactor: 1 } },
  { from: 2, to: 20, level: { maxObjects: 36, spawnPerSecond: 8, speedFactor: 1.15, sizeFactor: 1.12 } },
  { from: 20, to: 200, level: { maxObjects: 50, spawnPerSecond: 13, speedFactor: 1.3, sizeFactor: 1.25 } },
  { from: 200, to: Infinity, level: { maxObjects: 60, spawnPerSecond: 18, speedFactor: 1.45, sizeFactor: 1.4 } },
];

/** Абсолютный потолок, требуемый для производительности при >1000 человек. */
export const HARD_MAX_OBJECTS = 60;
export const HARD_MAX_SPAWN_PER_SECOND = 18;

const lerp = (from: number, to: number, t: number): number => from + (to - from) * t;

export function calcFlowLevel(perSecondValue: number, peopleCount: number): FlowLevel {
  const index = FLOW_BANDS.findIndex((band) => perSecondValue < band.to);
  const band = FLOW_BANDS[index === -1 ? FLOW_BANDS.length - 1 : index];
  const next = FLOW_BANDS[Math.min(index + 1, FLOW_BANDS.length - 1)] ?? band;

  const span = band.to - band.from;
  const raw = Number.isFinite(band.to) && span > 0 ? (perSecondValue - band.from) / span : 1;
  // Клампим: некорректный (отрицательный) доход не должен уводить интерполяцию за пределы уровня.
  const t = Math.min(1, Math.max(0, raw));

  const level: FlowLevel = {
    maxObjects: Math.round(lerp(band.level.maxObjects, next.level.maxObjects, t)),
    spawnPerSecond: lerp(band.level.spawnPerSecond, next.level.spawnPerSecond, t),
    speedFactor: lerp(band.level.speedFactor, next.level.speedFactor, t),
    sizeFactor: lerp(band.level.sizeFactor, next.level.sizeFactor, t),
  };

  // При очень большой толпе разнообразие масштаба растёт, а количество — упирается в потолок.
  const crowdBonus = Math.min(0.3, Math.max(0, Math.log10(Math.max(1, peopleCount)) - 2) * 0.15);

  return {
    maxObjects: Math.min(HARD_MAX_OBJECTS, level.maxObjects),
    spawnPerSecond: Math.min(HARD_MAX_SPAWN_PER_SECOND, level.spawnPerSecond),
    speedFactor: level.speedFactor,
    sizeFactor: level.sizeFactor + crowdBonus,
  };
}
