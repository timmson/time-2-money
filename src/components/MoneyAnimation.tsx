import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { MoneyPiece } from './MoneyPiece';
import { calcFlowLevel, pickDenomination, type MoneyKind } from '../utils/money';

interface Piece {
  id: number;
  kind: MoneyKind;
  denomination: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  spin: number;
  opacity: number;
  zIndex: number;
}

interface MoneyAnimationProps {
  /** Общий доход группы, ₽/сек — единственный источник истины для интенсивности. */
  perSecond: number;
  peopleCount: number;
  active: boolean;
  reducedMotion: boolean;
}

const FALL_KEYFRAMES = `
@keyframes t2m-fall {
  from { transform: translate3d(0, -22vh, 0) rotate(0deg); }
  to   { transform: translate3d(var(--t2m-drift), 122vh, 0) rotate(var(--t2m-spin)); }
}
@keyframes t2m-fade {
  0%   { opacity: 0; }
  8%   { opacity: 1; }
  82%  { opacity: 1; }
  100% { opacity: 0; }
}
`;

let pieceId = 0;

function createPiece(sizeFactor: number, speedFactor: number): Piece {
  const { kind, denomination } = pickDenomination();
  const base = kind === 'coin' ? 30 : 86;
  const variance = kind === 'coin' ? 0.55 : 0.5;
  const size = base * (1 + (Math.random() - 0.35) * variance) * sizeFactor;

  return {
    id: pieceId++,
    kind,
    denomination,
    left: Math.random() * 100,
    size: Math.round(size),
    duration: (7.5 + Math.random() * 6) / speedFactor,
    delay: Math.random() * 0.35,
    drift: Math.round((Math.random() - 0.5) * 260),
    spin: Math.round((Math.random() - 0.5) * 1080),
    opacity: 0.4 + Math.random() * 0.55,
    zIndex: 1 + Math.round(Math.random() * 5),
  };
}

/**
 * Денежный поток. Количество DOM-элементов жёстко ограничено внутри calcFlowLevel,
 * каждый объект удаляется по завершении CSS-анимации, поэтому утечки нет.
 * rAF используется только как часы для спавна — движение даёт CSS.
 */
export const MoneyAnimation = memo(function MoneyAnimation({
  perSecond,
  peopleCount,
  active,
  reducedMotion,
}: MoneyAnimationProps) {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const flow = calcFlowLevel(perSecond, peopleCount);

  // Держим актуальные значения в ref, чтобы не пересоздавать цикл rAF на каждый рендер.
  const flowRef = useRef(flow);
  flowRef.current = flow;
  const spawnDebt = useRef(0);
  const lastTick = useRef(0);
  const frame = useRef<number | null>(null);

  const removePiece = useCallback((id: number) => {
    setPieces((prev) => prev.filter((piece) => piece.id !== id));
  }, []);

  useEffect(() => {
    if (!active || reducedMotion) {
      lastTick.current = 0;
      return;
    }

    const step = (now: number) => {
      if (lastTick.current === 0) lastTick.current = now;
      // Ограничиваем дельту: после возврата из фоновой вкладки не спавним «залпом».
      const dt = Math.min(0.25, (now - lastTick.current) / 1000);
      lastTick.current = now;

      const current = flowRef.current;
      spawnDebt.current += dt * current.spawnPerSecond;

      setPieces((prev) => {
        let next = prev;
        while (spawnDebt.current >= 1) {
          spawnDebt.current -= 1;
          if (next.length >= current.maxObjects) {
            spawnDebt.current = 0;
            break;
          }
          const piece = createPiece(current.sizeFactor, current.speedFactor);
          next = next.length >= current.maxObjects ? next.slice(1).concat(piece) : next.concat(piece);
        }
        return next === prev ? prev : next;
      });

      frame.current = requestAnimationFrame(step);
    };

    frame.current = requestAnimationFrame(step);

    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
      lastTick.current = 0;
      spawnDebt.current = 0;
    };
  }, [active, reducedMotion]);

  // На паузе поток замирает, но уже созданные объекты остаются на экране.
  const paused = !active;

  return (
    <div
      className={`money-layer${paused ? ' money-layer--paused' : ''}`}
      aria-hidden="true"
    >
      <style>{FALL_KEYFRAMES}</style>
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="money-piece"
          onAnimationEnd={removePiece.bind(null, piece.id)}
          style={
            {
              left: `${piece.left}%`,
              opacity: piece.opacity,
              zIndex: piece.zIndex,
              animationDuration: `${piece.duration}s, ${piece.duration}s`,
              animationDelay: `${piece.delay}s, ${piece.delay}s`,
              '--t2m-drift': `${piece.drift}px`,
              '--t2m-spin': `${piece.spin}deg`,
            } as React.CSSProperties
          }
        >
          <MoneyPiece kind={piece.kind} denomination={piece.denomination} size={piece.size} />
        </span>
      ))}
    </div>
  );
});
