import { describe, expect, it } from 'vitest';
import {
  SECONDS_PER_MONTH,
  accumulatedSalary,
  formatMoney,
  formatNumber,
  formatTimer,
  perSecondPerPerson,
  totalAccumulated,
  totalPerMinute,
  totalPerSecond,
  type Segment,
} from '../calculations';

/** Суммы сверяются с таблицей из раздела «Проверочные примеры» ТЗ. */
describe('модель рабочего времени', () => {
  it('даёт 176 часов и 633 600 секунд в месяц', () => {
    expect(SECONDS_PER_MONTH).toBe(633_600);
  });
});

describe('скорости заработка', () => {
  it('один человек при 100 000 ₽ получает ~0,15783 ₽/сек', () => {
    expect(perSecondPerPerson(100_000)).toBeCloseTo(0.157_83, 5);
  });

  it('10 человек при 100 000 ₽ получают ~1,5783 ₽/сек', () => {
    expect(totalPerSecond(100_000, 10)).toBeCloseTo(1.578_3, 4);
  });

  it('группа из 1 человека за минуту зарабатывает 9,47 ₽', () => {
    expect(formatNumber(totalPerMinute(100_000, 1))).toBe('9,47');
  });

  it('группа из 10 человек за минуту зарабатывает 94,70 ₽', () => {
    expect(formatNumber(totalPerMinute(100_000, 10))).toBe('94,70');
  });

  it('группа из 100 человек за минуту зарабатывает 946,97 ₽', () => {
    expect(formatNumber(totalPerMinute(100_000, 100))).toBe('946,97');
  });

  it('группа из 1 000 человек за минуту зарабатывает 9 469,70 ₽', () => {
    const formatted = formatNumber(totalPerMinute(100_000, 1_000));
    expect(formatted).toMatch(/9[\u00a0\u202f]?469,70/);
  });

  it('250 000 ₽ и 5 человек — примерно 118,37 ₽ за минуту', () => {
    expect(formatNumber(totalPerMinute(250_000, 5))).toBe('118,37');
  });
});

describe('накопленная сумма', () => {
  it('10 человек ровно в 10 раз больше одного человека за то же время', () => {
    const one = accumulatedSalary(100_000, 1, 600);
    const ten = accumulatedSalary(100_000, 10, 600);
    expect(ten).toBe(one * 10);
  });

  it('за 10 минут группа из 10 человек зарабатывает ~946,97 ₽', () => {
    const formatted = formatMoney(accumulatedSalary(100_000, 10, 600));
    expect(formatted).toMatch(/946,97 ₽/);
  });

  it('100 человек за 10 минут зарабатывают ровно в 100 раз больше одного', () => {
    const one = accumulatedSalary(100_000, 1, 600);
    const hundred = accumulatedSalary(100_000, 100, 600);
    expect(hundred).toBe(one * 100);
  });

  it('нулевое время не даёт заработка', () => {
    expect(accumulatedSalary(100_000, 10, 0)).toBe(0);
  });

  it('промежуточные значения не округляются', () => {
    // 1 секунда × 1 человек при 100 000 ₽: точное значение
    expect(accumulatedSalary(100_000, 1, 1)).toBeCloseTo(0.157_83, 5);
  });
});

describe('сумма по интервалам с разными параметрами', () => {
  const segment = (salary: number, peopleCount: number, duration: number): Segment => ({
    salary,
    peopleCount,
    duration,
  });

  it('складывает заработок отдельных интервалов', () => {
    const first = segment(100_000, 1, 600);
    const second = segment(100_000, 10, 600);

    expect(totalAccumulated([first, second])).toBe(
      accumulatedSalary(100_000, 1, 600) + accumulatedSalary(100_000, 10, 600),
    );
  });

  it('закрытые интервалы не пересчитываются при смене параметров', () => {
    const closed = [segment(100_000, 1, 600)];
    const before = totalAccumulated(closed);

    // Новый интервал с другими настройками не трогает сумму за первый час
    const after = totalAccumulated([...closed, segment(250_000, 50, 60)]);
    expect(after).toBeGreaterThan(before);
    expect(totalAccumulated(closed)).toBe(before);
  });

  it('пустой список и отрицательная длительность дают 0', () => {
    expect(totalAccumulated([])).toBe(0);
    expect(totalAccumulated([segment(100_000, 1, -50)])).toBe(0);
  });

  it('эквивалентно сквозному расчёту при неизменных параметрах', () => {
    const split = totalAccumulated([
      segment(100_000, 10, 400),
      segment(100_000, 10, 200),
    ]);
    expect(split).toBe(accumulatedSalary(100_000, 10, 600));
  });
});

describe('форматирование по российским правилам', () => {
  it('ставит пробелы между тысячами и запятую в дробной части', () => {
    const formatted = formatMoney(1_234_567.891);
    expect(formatted).toMatch(/1[\u00a0\u202f]?234[\u00a0\u202f]?567,89 ₽/);
  });

  it('всегда показывает два знака после запятой', () => {
    expect(formatMoney(100)).toBe('100,00 ₽');
    expect(formatMoney(0)).toBe('0,00 ₽');
  });

  it('форматирует целые суммы без дробной части', () => {
    const formatted = formatNumber(100_000, 0);
    expect(formatted).toMatch(/100[\u00a0\u202f]?000/);
    expect(formatNumber(10_000_000, 0)).toMatch(/10[\u00a0\u202f]?000[\u00a0\u202f]?000/);
  });

  it('корректно форматирует дробные суммы меньше рубля', () => {
    expect(formatMoney(0.157_83)).toBe('0,16 ₽');
  });
});

describe('формат таймера ЧЧ:ММ:СС', () => {
  it('обнуляет разряды', () => {
    expect(formatTimer(0)).toBe('00:00:00');
  });

  it('округляет вниз до полной секунды', () => {
    expect(formatTimer(9.9)).toBe('00:00:09');
  });

  it('считает минуты и часы', () => {
    expect(formatTimer(65)).toBe('00:01:05');
    expect(formatTimer(3_600 + 660)).toBe('01:11:00');
  });

  it('не ограничивает сутки двумя цифрами', () => {
    expect(formatTimer(360_000)).toBe('100:00:00');
  });
});
