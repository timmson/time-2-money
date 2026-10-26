import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { totalAccumulated, type Segment } from '../utils/calculations';

export type TimerState = 'idle' | 'running' | 'paused';

export interface Params {
  salary: number;
  peopleCount: number;
}

/**
 * Время берётся из performance.now(): сумма вычисляется по разнице меток,
 * а не прибавляется шагами setInterval. Поэтому частота перерисовок не влияет
 * на скорость начисления, а пауза не накапливает лишнего времени.
 */
export function useEarningsTimer(initial: Params) {
  const [state, setState] = useState<TimerState>('idle');
  const [params, setParams] = useState<Params>(initial);
  const [closedSegments, setClosedSegments] = useState<Segment[]>([]);
  const [segmentElapsed, setSegmentElapsed] = useState(0);

  const resumedAt = useRef<number | null>(null);
  const frame = useRef<number | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const stopLoop = useCallback(() => {
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
    resumedAt.current = null;
  }, []);

  useEffect(() => {
    if (state !== 'running') return;

    const tick = () => {
      const now = performance.now();
      const from = resumedAt.current;
      if (from !== null) {
        // Дельта ограничена сверху: после разморозки вкладки не должно быть скачка суммы.
        const delta = Math.min(1, (now - from) / 1000);
        setSegmentElapsed((prev) => prev + delta);
      }
      resumedAt.current = now;
      frame.current = requestAnimationFrame(tick);
    };

    resumedAt.current = performance.now();
    frame.current = requestAnimationFrame(tick);
    return stopLoop;
  }, [state, stopLoop]);

  // Возврат из фоновой вкладки: сдвигаем метку, чтобы не засчитать время простоя вкладки.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && stateRef.current === 'running') {
        resumedAt.current = performance.now();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  const elapsedSeconds = useMemo(
    () => closedSegments.reduce((sum, seg) => sum + seg.duration, 0) + segmentElapsed,
    [closedSegments, segmentElapsed],
  );

  const total = useMemo(
    () => totalAccumulated([...closedSegments, { ...params, duration: segmentElapsed }]),
    [closedSegments, params, segmentElapsed],
  );

  const start = useCallback(() => setState('running'), []);

  const pause = useCallback(() => setState('paused'), []);

  const reset = useCallback(() => {
    stopLoop();
    setClosedSegments([]);
    setSegmentElapsed(0);
    setState('idle');
  }, [stopLoop]);

  /**
   * Смена параметров во время сессии.
   * 'continue' — текущий интервал закрывается с прежними настройками, новые применяются только к будущему времени.
   * 'restart' — таймер и сумма обнуляются.
   */
  const applyParams = useCallback(
    (next: Params, mode: 'continue' | 'restart') => {
      if (mode === 'restart') {
        stopLoop();
        setParams(next);
        setClosedSegments([]);
        setSegmentElapsed(0);
        setState('idle');
        return;
      }

      setClosedSegments((prev) => (segmentElapsed > 0 ? [...prev, { ...params, duration: segmentElapsed }] : prev));
      setParams(next);
      setSegmentElapsed(0);
      if (stateRef.current === 'running') resumedAt.current = performance.now();
    },
    [params, segmentElapsed, stopLoop],
  );

  return { state, params, total, elapsedSeconds, start, pause, reset, applyParams };
}
