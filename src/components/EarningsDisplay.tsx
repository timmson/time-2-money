import { formatMoney, formatNumber, formatRate, formatTimer, totalPerMinute, totalPerSecond } from '../utils/calculations';
import type { Params } from '../hooks/useEarningsTimer';
import type { TimerState } from '../hooks/useEarningsTimer';

interface EarningsDisplayProps {
  params: Params;
  total: number;
  elapsedSeconds: number;
  state: TimerState;
}

export function EarningsDisplay({ params, total, elapsedSeconds, state }: EarningsDisplayProps) {
  const perSecond = totalPerSecond(params.salary, params.peopleCount);
  const perMinute = totalPerMinute(params.salary, params.peopleCount);

  return (
    <section className="earnings" aria-live="off">
      <header className="earnings__head">
        <h2 className="earnings__title">
          {state === 'paused' ? 'Сессия на паузе' : 'Вы зарабатываете прямо сейчас'}
        </h2>
        <dl className="meta">
          <div className="meta__item">
            <dt>Человек</dt>
            <dd>{formatNumber(params.peopleCount, 0)}</dd>
          </div>
          <div className="meta__item">
            <dt>Зарплата одного</dt>
            <dd>{formatNumber(params.salary, 0)} ₽</dd>
          </div>
          <div className="meta__item">
            <dt>Общая в месяц</dt>
            <dd>{formatNumber(params.salary * params.peopleCount, 0)} ₽</dd>
          </div>
        </dl>
      </header>

      <p className="amount" aria-label={`Всего заработано ${formatMoney(total)}`}>
        <span className="amount__sign">+</span>
        <span className="amount__value">{formatNumber(total, 2)}</span>
        <span className="amount__currency">₽</span>
      </p>
      <p className="amount__caption">Всего заработано</p>

      <p className="timer" aria-label={`Прошло ${formatTimer(elapsedSeconds)}`}>
        {formatTimer(elapsedSeconds)}
      </p>

      <dl className="rates">
        <div className="rates__item">
          <dt>В секунду</dt>
          <dd>{formatRate(perSecond)}</dd>
        </div>
        <div className="rates__item">
          <dt>В минуту</dt>
          <dd>{formatRate(perMinute)}</dd>
        </div>
      </dl>
    </section>
  );
}
