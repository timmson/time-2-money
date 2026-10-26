import { useCallback, useState } from 'react';
import { SalaryForm, DEFAULT_PEOPLE, DEFAULT_SALARY, type Draft } from './components/SalaryForm';
import { EarningsDisplay } from './components/EarningsDisplay';
import { MoneyAnimation } from './components/MoneyAnimation';
import { Controls } from './components/Controls';
import { useEarningsTimer } from './hooks/useEarningsTimer';
import { useReducedMotion } from './hooks/useReducedMotion';
import { totalPerSecond } from './utils/calculations';

type Screen = 'start' | 'timer';

export default function App() {
  const [screen, setScreen] = useState<Screen>('start');
  const [draft, setDraft] = useState<Draft>({ salary: DEFAULT_SALARY, peopleCount: DEFAULT_PEOPLE });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const reducedMotion = useReducedMotion();

  const timer = useEarningsTimer({ salary: DEFAULT_SALARY, peopleCount: DEFAULT_PEOPLE });

  const handleStart = useCallback(() => {
    timer.applyParams({ salary: draft.salary, peopleCount: draft.peopleCount }, 'restart');
    timer.start();
    setScreen('timer');
  }, [draft, timer]);

  const handleApplyParams = useCallback(
    (next: Draft, mode: 'continue' | 'restart') => {
      timer.applyParams({ salary: next.salary, peopleCount: next.peopleCount }, mode);
      setDraft(next);
      setSettingsOpen(false);
    },
    [timer],
  );

  const handleOpenSettings = useCallback(() => {
    setDraft({ salary: timer.params.salary, peopleCount: timer.params.peopleCount });
    setSettingsOpen(true);
  }, [timer.params]);

  const handleExit = useCallback(() => {
    timer.reset();
    setSettingsOpen(false);
    setScreen('start');
  }, [timer]);

  const running = timer.state === 'running';

  return (
    <div className="app">
      {screen === 'timer' && (
        <MoneyAnimation
          perSecond={totalPerSecond(timer.params.salary, timer.params.peopleCount)}
          peopleCount={timer.params.peopleCount}
          active={running}
          reducedMotion={reducedMotion}
        />
      )}

      {screen === 'start' ? (
        <main className="screen screen--start">
          <header className="hero">
            <p className="hero__eyebrow">визуальный эксперимент</p>
            <h1 className="hero__title">
              Время — <span className="hero__accent">деньги</span>
            </h1>
            <p className="hero__subtitle">
              Сколько денег зарабатывают люди, пока ты смотришь на этот экран?
            </p>
          </header>

          <SalaryForm draft={draft} onChange={setDraft} onStart={handleStart} />

          <p className="hero__note">Посчитаем, сколько денег зарабатывает вся группа, пока ты здесь.</p>
        </main>
      ) : (
        <main className="screen screen--timer">
          <EarningsDisplay
            params={timer.params}
            total={timer.total}
            elapsedSeconds={timer.elapsedSeconds}
            state={timer.state}
          />

          <Controls
            running={running}
            started={timer.state !== 'idle'}
            onPause={timer.pause}
            onResume={timer.start}
            onRestart={timer.reset}
            onChangeSettings={handleOpenSettings}
            onExit={handleExit}
          />
        </main>
      )}

      {settingsOpen && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
          <button type="button" className="modal__backdrop" onClick={() => setSettingsOpen(false)}>
            <span className="sr-only">Закрыть</span>
          </button>

          <div className="modal__panel card">
            <h2 className="modal__title" id="settings-title">
              Изменить параметры
            </h2>
            <p className="modal__hint">
              Уже заработанная сумма не пересчитается. Выберите, применить новые значения к будущему
              времени или начать с нуля.
            </p>

            <SalaryForm
              draft={draft}
              onChange={setDraft}
              onStart={handleStart}
              sessionActive
              onSubmit={handleApplyParams}
              onCancel={() => setSettingsOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
