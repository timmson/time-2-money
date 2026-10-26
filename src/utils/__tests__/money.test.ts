import { describe, expect, it } from 'vitest';
import {
  HARD_MAX_OBJECTS,
  HARD_MAX_SPAWN_PER_SECOND,
  calcFlowLevel,
  pickDenomination,
} from '../money';

const COIN_VALUES = [1, 2, 5, 10];
const NOTE_VALUES = [50, 100, 500, 1000, 5000];

describe('pickDenomination', () => {
  it('возвращает только монеты и купюры из ТЗ', () => {
    for (let i = 0; i < 2000; i += 1) {
      const { kind, denomination } = pickDenomination();
      const allowed = kind === 'coin' ? COIN_VALUES : NOTE_VALUES;
      expect(allowed).toContain(denomination);
    }
  });

  it('приёмлемая доля купюр, а не только монеты', () => {
    let notes = 0;
    const total = 4000;
    for (let i = 0; i < total; i += 1) {
      if (pickDenomination().kind === 'note') notes += 1;
    }
    expect(notes / total).toBeGreaterThan(0.2);
    expect(notes / total).toBeLessThan(0.6);
  });

  it('использует переданный генератор случайных чисел', () => {
    // rand() = 0 → самый тяжёлый элемент пула (монета 1 ₽), rand() → 1 → самый редкий (5000 ₽)
    expect(pickDenomination(() => 0)).toEqual({ kind: 'coin', denomination: 1 });
    expect(pickDenomination(() => 0.999_99)).toEqual({ kind: 'note', denomination: 5000 });
  });
});

describe('calcFlowLevel: жёсткие пределы', () => {
  const cases = [
    { perSecond: 0, people: 1 },
    { perSecond: 0.157_83, people: 1 },
    { perSecond: 1.578_3, people: 10 },
    { perSecond: 15.783, people: 100 },
    { perSecond: 157.83, people: 1_000 },
    { perSecond: 15_783, people: 100_000 },
    { perSecond: 1_000_000, people: 10_000_000 },
  ];

  for (const { perSecond, people } of cases) {
    it(`при ${perSecond} ₽/сек и ${people} чел. не превышает лимиты`, () => {
      const level = calcFlowLevel(perSecond, people);
      expect(level.maxObjects).toBeLessThanOrEqual(HARD_MAX_OBJECTS);
      expect(level.spawnPerSecond).toBeLessThanOrEqual(HARD_MAX_SPAWN_PER_SECOND);
      expect(level.maxObjects).toBeGreaterThan(0);
      expect(level.spawnPerSecond).toBeGreaterThan(0);
      expect(level.speedFactor).toBeGreaterThan(0);
      expect(level.sizeFactor).toBeGreaterThan(0);
    });
  }

  it('потолок объектов и частоты появления конечны', () => {
    expect(HARD_MAX_OBJECTS).toBeLessThanOrEqual(80);
    expect(HARD_MAX_SPAWN_PER_SECOND).toBeLessThanOrEqual(25);
  });
});

describe('calcFlowLevel: монотонность и плавность', () => {
  it('больший доход группы даёт не меньшую интенсивность', () => {
    const samples = [0, 0.1, 0.2, 0.5, 1, 2, 5, 20, 60, 200, 600, 20_000];
    const levels = samples.map((value) => calcFlowLevel(value, 10));

    for (let i = 1; i < levels.length; i += 1) {
      expect(levels[i].maxObjects).toBeGreaterThanOrEqual(levels[i - 1].maxObjects);
      expect(levels[i].spawnPerSecond).toBeGreaterThanOrEqual(levels[i - 1].spawnPerSecond);
    }
  });

  it('нет резкого скачка при малом изменении параметров', () => {
    const before = calcFlowLevel(9.999, 10);
    const after = calcFlowLevel(10.001, 10);

    expect(Math.abs(after.spawnPerSecond - before.spawnPerSecond)).toBeLessThan(1);
    expect(Math.abs(after.maxObjects - before.maxObjects)).toBeLessThanOrEqual(2);
  });

  it('интенсивность зависит от общего дохода, а не от «сырой» зарплаты', () => {
    // 100 000 ₽ × 10 человек и 1 000 000 ₽ × 1 человек — одинаковый поток
    const group = calcFlowLevel(1_000_000 / 633_600, 10);
    const single = calcFlowLevel(1_000_000 / 633_600, 1);

    expect(group.maxObjects).toBe(single.maxObjects);
    expect(group.spawnPerSecond).toBeCloseTo(single.spawnPerSecond, 10);
  });

  it('при большом количестве людей масштаб растёт размерами, а не числом объектов', () => {
    const perSecond = 157.83; // ~100 000 ₽ × 1000 человек
    const many = calcFlowLevel(perSecond, 5_000);
    const few = calcFlowLevel(perSecond, 10);

    expect(many.sizeFactor).toBeGreaterThan(few.sizeFactor);
    expect(many.maxObjects).toBeLessThanOrEqual(HARD_MAX_OBJECTS);
  });

  it('отрицательный или нулевой доход не ломает уровень', () => {
    for (const value of [-100, 0]) {
      const level = calcFlowLevel(value, 1);
      expect(level.maxObjects).toBeGreaterThan(0);
      expect(level.spawnPerSecond).toBeGreaterThan(0);
    }
  });
});
