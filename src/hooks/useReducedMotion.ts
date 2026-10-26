import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/** prefers-reduced-motion читаем реактивно: пользователь может сменить настройку ОС. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => window.matchMedia(QUERY).matches);

  useEffect(() => {
    const media = window.matchMedia(QUERY);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
