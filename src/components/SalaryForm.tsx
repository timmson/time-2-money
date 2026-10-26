import { useCallback, useId, useMemo, useState } from 'react';
import { formatNumber, totalPerMinute } from '../utils/calculations';

export const DEFAULT_SALARY = 100_000;
export const DEFAULT_PEOPLE = 1;
export const MIN_SALARY = 1_000;
export const MAX_SALARY = 100_000_000;
export const MIN_PEOPLE = 1;
export const MAX_PEOPLE = 100_000;

export interface Draft {
  salary: number;
  peopleCount: number;
}

interface SalaryFormProps {
  draft: Draft;
  onChange: (draft: Draft) => void;
  onStart: () => void;
  /** Показывается, когда форма открыта поверх идущей сессии. */
  sessionActive?: boolean;
  onSubmit?: (draft: Draft, mode: 'continue' | 'restart') => void;
  onCancel?: () => void;
}

const digitsOnly = (value: string) => value.replace(/\D+/g, '').slice(0, 9);

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function SalaryForm({ draft, onChange, onStart, sessionActive, onSubmit, onCancel }: SalaryFormProps) {
  const salaryId = useId();
  const peopleId = useId();
  const [salaryText, setSalaryText] = useState(() => String(draft.salary));
  const [peopleText, setPeopleText] = useState(() => String(draft.peopleCount));

  // Черновик держится отдельно от подтверждённого значения: сумма считается только
  // по валидному вводу, поэтому временный «0» или пустое поле не обнуляет расчёт.
  const commitSalary = useCallback(
    (raw: string) => {
      const digits = digitsOnly(raw);
      setSalaryText(digits);
      const parsed = Number(digits || '0');
      if (parsed >= MIN_SALARY && parsed <= MAX_SALARY) onChange({ ...draft, salary: parsed });
    },
    [draft, onChange],
  );

  const commitPeople = useCallback(
    (raw: string) => {
      const digits = digitsOnly(raw);
      setPeopleText(digits);
      const parsed = Number(digits || '0');
      if (parsed >= MIN_PEOPLE && parsed <= MAX_PEOPLE) onChange({ ...draft, peopleCount: parsed });
    },
    [draft, onChange],
  );

  const stepPeople = useCallback(
    (step: number) => {
      const next = clamp(draft.peopleCount + step, MIN_PEOPLE, MAX_PEOPLE);
      setPeopleText(String(next));
      onChange({ ...draft, peopleCount: next });
    },
    [draft, onChange],
  );

  /** При потере фокуса приводим значение к допустимому диапазону, а не оставляем мусор. */
  const blurSalary = () => {
    const normalized = clamp(Number(digitsOnly(salaryText) || '0'), MIN_SALARY, MAX_SALARY);
    setSalaryText(String(normalized));
    onChange({ ...draft, salary: normalized });
  };

  const blurPeople = () => {
    const normalized = clamp(Number(digitsOnly(peopleText) || '0'), MIN_PEOPLE, MAX_PEOPLE);
    setPeopleText(String(normalized));
    onChange({ ...draft, peopleCount: normalized });
  };

  const salaryInput = Number(digitsOnly(salaryText) || '0');
  const salaryError =
    salaryText === '' || !Number.isFinite(salaryInput) || salaryInput < MIN_SALARY || salaryInput > MAX_SALARY;

  const peopleInput = Number(digitsOnly(peopleText) || '0');
  const peopleError =
    peopleText === '' || peopleInput < MIN_PEOPLE || peopleInput > MAX_PEOPLE;

  const preview = useMemo(
    () => ({
      monthly: draft.salary * draft.peopleCount,
      perMinute: totalPerMinute(draft.salary, draft.peopleCount),
    }),
    [draft],
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (salaryError || peopleError) return;
    if (sessionActive && onSubmit) onSubmit(draft, 'continue');
    else onStart();
  };

  return (
    <form className="card form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label className="field__label" htmlFor={salaryId}>
          Зарплата одного человека в месяц
        </label>
        <div className="field__control field__control--suffix">
          <input
            id={salaryId}
            className="field__input"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            aria-invalid={salaryError}
            aria-describedby={salaryError ? `${salaryId}-error` : undefined}
            value={salaryText === '' ? '' : formatNumber(salaryInput, 0)}
            onChange={(event) => commitSalary(event.target.value)}
            onBlur={blurSalary}
            placeholder="100 000"
          />
          <span className="field__suffix" aria-hidden="true">
            ₽
          </span>
        </div>
        {salaryError && (
          <p className="field__error" id={`${salaryId}-error`}>
            Сумма в рублях — от {formatNumber(MIN_SALARY, 0)} до {formatNumber(MAX_SALARY, 0)}.
          </p>
        )}
      </div>

      <div className="field">
        <label className="field__label" htmlFor={peopleId}>
          Количество человек
        </label>
        <div className="field__control field__control--stepper">
          <button
            type="button"
            className="stepper"
            onClick={() => stepPeople(-1)}
            disabled={draft.peopleCount <= MIN_PEOPLE}
            aria-label="Уменьшить количество человек"
          >
            −
          </button>
          <input
            id={peopleId}
            className="field__input field__input--center"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            aria-invalid={peopleError}
            aria-describedby={peopleError ? `${peopleId}-error` : undefined}
            value={peopleText === '' ? '' : formatNumber(peopleInput, 0)}
            onChange={(event) => commitPeople(event.target.value)}
            onBlur={blurPeople}
          />
          <button
            type="button"
            className="stepper"
            onClick={() => stepPeople(1)}
            disabled={draft.peopleCount >= MAX_PEOPLE}
            aria-label="Увеличить количество человек"
          >
            +
          </button>
          <span className="field__suffix">человек</span>
        </div>
        {peopleError && (
          <p className="field__error" id={`${peopleId}-error`}>
            Количество человек — целое число от {MIN_PEOPLE} до {formatNumber(MAX_PEOPLE, 0)}.
          </p>
        )}
      </div>

      <dl className="preview">
        <div className="preview__row">
          <dt>Общая зарплата в месяц</dt>
          <dd>{formatNumber(preview.monthly, 0)} ₽</dd>
        </div>
        <div className="preview__row">
          <dt>Заработок группы за минуту</dt>
          <dd>{formatNumber(preview.perMinute, 2)} ₽</dd>
        </div>
        <div className="preview__row">
          <dt>Участников расчёта</dt>
          <dd>{formatNumber(draft.peopleCount, 0)}</dd>
        </div>
      </dl>

      <div className="form__actions">
        <button type="submit" className="btn btn--primary btn--lg" disabled={salaryError || peopleError}>
          {sessionActive ? 'Продолжить с новыми параметрами' : 'Начать зарабатывать'}
        </button>
        {sessionActive && onSubmit && (
          <button type="button" className="btn btn--ghost" onClick={() => onSubmit(draft, 'restart')}>
            Начать заново
          </button>
        )}
        {sessionActive && onCancel && (
          <button type="button" className="btn btn--link" onClick={onCancel}>
            Отмена
          </button>
        )}
      </div>

      <p className="form__hint">
        Расчёт: 22 рабочих дня по 8 часов — 176 часов, или 633 600 секунд, в месяц.
      </p>
    </form>
  );
}
