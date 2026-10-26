type ControlsProps = {
  running: boolean;
  started: boolean;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onChangeSettings: () => void;
  onExit: () => void;
};

export function Controls({
  running,
  started,
  onPause,
  onResume,
  onRestart,
  onChangeSettings,
  onExit,
}: ControlsProps) {
  return (
    <div className="controls" role="group" aria-label="Управление сессией">
      {running ? (
        <button type="button" className="btn btn--primary btn--lg" onClick={onPause}>
          Пауза
        </button>
      ) : (
        <button type="button" className="btn btn--primary btn--lg" onClick={onResume}>
          Продолжить
        </button>
      )}

      <button type="button" className="btn" onClick={onRestart} disabled={!started}>
        Начать заново
      </button>

      <button type="button" className="btn btn--ghost" onClick={onChangeSettings}>
        Изменить параметры
      </button>

      <button type="button" className="btn btn--link" onClick={onExit}>
        На стартовый экран
      </button>
    </div>
  );
}
