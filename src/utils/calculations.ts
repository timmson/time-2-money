// Константы рабочего времени
export const WORKING_DAYS_PER_MONTH = 22;
export const WORKING_HOURS_PER_DAY = 8;
export const HOURS_PER_MONTH = WORKING_DAYS_PER_MONTH * WORKING_HOURS_PER_DAY; // 176
export const SECONDS_PER_MONTH = HOURS_PER_MONTH * 3600; // 633 600

// Доход одного человека за секунду
export function perSecondPerPerson(salary: number): number {
  return salary / SECONDS_PER_MONTH;
}

// Общий доход группы за секунду
export function totalPerSecond(salary: number, peopleCount: number): number {
  return (salary * peopleCount) / SECONDS_PER_MONTH;
}

// Общий доход группы за минуту
export function totalPerMinute(salary: number, peopleCount: number): number {
  return totalPerSecond(salary, peopleCount) * 60;
}

// Общая накопленная сумма
export function accumulatedSalary(salary: number, peopleCount: number, elapsedSeconds: number): number {
  return (salary * peopleCount * elapsedSeconds) / SECONDS_PER_MONTH;
}

/**
 * Интервал работы с фиксированными параметрами.
 * Нужен, чтобы смена зарплаты или числа людей не пересчитывала заработанное задним числом.
 */
export interface Segment {
  salary: number;
  peopleCount: number;
  /** Активное время этого интервала в секундах. */
  duration: number;
}

// Итог по всем закрытым сегментам
export function totalAccumulated(segments: Segment[]): number {
  let total = 0;
  for (const seg of segments) {
    total += (seg.salary * seg.peopleCount * Math.max(0, seg.duration)) / SECONDS_PER_MONTH;
  }
  return total;
}

// Форматирование числа с пробелами между тысячами (РФ)
export function formatNumber(value: number, fractionDigits = 2): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

// Форматирование денежной суммы в рублях
export function formatMoney(value: number, fractionDigits = 2, symbol: string = '₽'): string {
  return `${formatNumber(value, fractionDigits)} ${symbol}`;
}

/**
 * Скорость заработка часто меньше рубля, поэтому два знака режут смысл:
 * 0,158 ₽/сек превращается в «0,16 ₽». Число знаков подстраивается под порядок.
 */
export function formatRate(value: number): string {
  const digits = value >= 100 ? 2 : value >= 1 ? 3 : 5;
  return `${formatNumber(value, digits)} ₽`;
}

// Форматирование таймера ЧЧ:ММ:СС
export function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s]
    .map((v) => String(v).padStart(2, '0'))
    .join(':');
}
