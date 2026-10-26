import type { MoneyKind } from '../utils/money';

/**
 * Собственные стилизованные SVG-изображения российских денег.
 * Это авторская метафорическая графика, а не копия реальных банкнот.
 */

type SvgProps = {
  size: number;
};

function Coin({ denomination, size }: SvgProps & { denomination: number }) {
  const palette = coinPalette(denomination);
  const uid = `coin-${denomination}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={`Монета ${denomination} рублей`}
    >
      <defs>
        <radialGradient id={`${uid}-body`} cx="34%" cy="28%" r="78%">
          <stop offset="0%" stopColor={palette.light} />
          <stop offset="52%" stopColor={palette.base} />
          <stop offset="100%" stopColor={palette.dark} />
        </radialGradient>
        <linearGradient id={`${uid}-rim`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={palette.light} />
          <stop offset="48%" stopColor={palette.dark} />
          <stop offset="100%" stopColor={palette.base} />
        </linearGradient>
      </defs>

      <circle cx="50" cy="50" r="48" fill={`url(#${uid}-rim)`} />
      <circle cx="50" cy="50" r="41" fill={`url(#${uid}-body)`} />
      <circle
        cx="50"
        cy="50"
        r="36"
        fill="none"
        stroke={palette.edge}
        strokeWidth="1.2"
        strokeDasharray="2 3"
        opacity="0.75"
      />
      <path
        d="M50 13a37 37 0 0 1 0 74"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.5"
        opacity="0.22"
      />

      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'Unbounded', system-ui, sans-serif"
        fontSize={denomination >= 10 ? 26 : 30}
        fontWeight="700"
        fill={palette.text}
      >
        {denomination}
      </text>
      <text
        x="50"
        y="76"
        textAnchor="middle"
        fontFamily="system-ui, sans-serif"
        fontSize="11"
        fontWeight="600"
        letterSpacing="1.5"
        fill={palette.text}
        opacity="0.7"
      >
        РУБ
      </text>
    </svg>
  );
}

function Banknote({ denomination, size }: SvgProps & { denomination: number }) {
  const palette = banknotePalette(denomination);
  const uid = `note-${denomination}`;
  const height = Math.round(size * 0.5);

  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 200 100"
      role="img"
      aria-label={`Купюра ${denomination} рублей`}
    >
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={palette.light} />
          <stop offset="55%" stopColor={palette.base} />
          <stop offset="100%" stopColor={palette.dark} />
        </linearGradient>
        <pattern
          id={`${uid}-guilloche`}
          width="14"
          height="14"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0 7c3.5-6 3.5 6 7 0s3.5 6 7 0"
            fill="none"
            stroke={palette.line}
            strokeWidth="0.9"
            opacity="0.4"
          />
        </pattern>
      </defs>

      <rect x="1" y="1" width="198" height="98" rx="7" fill={`url(#${uid}-bg)`} />
      <rect x="1" y="1" width="198" height="98" rx="7" fill={`url(#${uid}-guilloche)`} />
      <rect
        x="8"
        y="8"
        width="184"
        height="84"
        rx="4"
        fill="none"
        stroke={palette.frame}
        strokeWidth="1.6"
      />
      <rect
        x="13"
        y="13"
        width="174"
        height="74"
        rx="3"
        fill="none"
        stroke={palette.frame}
        strokeWidth="0.8"
        opacity="0.6"
      />

      {/* Поле номинала слева */}
      <text
        x="26"
        y="40"
        fontFamily="'Unbounded', system-ui, sans-serif"
        fontSize={denomination >= 1000 ? 20 : 24}
        fontWeight="700"
        fill={palette.ink}
      >
        {denomination.toLocaleString('ru-RU')}
      </text>
      <text
        x="26"
        y="58"
        fontFamily="system-ui, sans-serif"
        fontSize="12"
        fontWeight="600"
        fill={palette.ink}
        opacity="0.75"
      >
        РУБЛЕЙ
      </text>

      {/* Стилизованный орнаментальный медальон */}
      <circle
        cx="140"
        cy="50"
        r="26"
        fill="none"
        stroke={palette.frame}
        strokeWidth="1.4"
        opacity="0.85"
      />
      <circle
        cx="140"
        cy="50"
        r="19"
        fill={palette.accent}
        opacity="0.28"
      />
      <path
        d="M140 33l4.7 11.4 12.3 1-9.2 7.9 2.7 12-10.5-6.2-10.5 6.2 2.7-12-9.2-7.9 12.3-1z"
        fill={palette.ink}
        opacity="0.5"
      />

      {/* Микротекст и защитные штрихи */}
      <rect x="172" y="20" width="14" height="60" rx="2" fill={palette.accent} opacity="0.35" />
      <rect x="20" y="72" width="60" height="3" rx="1.5" fill={palette.ink} opacity="0.35" />
      <rect x="20" y="79" width="42" height="3" rx="1.5" fill={palette.ink} opacity="0.22" />
    </svg>
  );
}

function coinPalette(denomination: number) {
  if (denomination <= 2) {
    return {
      light: '#f3ead6',
      base: '#d9c9a3',
      dark: '#a8946a',
      edge: '#8e7c55',
      text: '#6d5f3f',
    };
  }
  if (denomination <= 5) {
    return {
      light: '#f7e3c8',
      base: '#e0a86a',
      dark: '#a86f38',
      edge: '#8d5c2c',
      text: '#5f3d1d',
    };
  }
  return {
    light: '#eaf2f0',
    base: '#b7c9c6',
    dark: '#7d938f',
    edge: '#66807c',
    text: '#3f5350',
  };
}

function banknotePalette(denomination: number) {
  switch (denomination) {
    case 50:
      return {
        light: '#f6e2d2',
        base: '#e0b48c',
        dark: '#b98a63',
        frame: '#8d6242',
        line: '#c99a72',
        ink: '#4c3220',
        accent: '#7fae8b',
      };
    case 100:
      return {
        light: '#e8f0e9',
        base: '#a8c6b4',
        dark: '#75998a',
        frame: '#527a6b',
        line: '#93b8a6',
        ink: '#2c463c',
        accent: '#d8c17a',
      };
    case 500:
      return {
        light: '#e6edf6',
        base: '#93aecf',
        dark: '#5f7fa6',
        frame: '#456285',
        line: '#8ba6c6',
        ink: '#24374f',
        accent: '#c98fa8',
      };
    case 1000:
      return {
        light: '#efe6f4',
        base: '#b79cc6',
        dark: '#856a99',
        frame: '#65497a',
        line: '#a98dba',
        ink: '#3a2748',
        accent: '#7fae8b',
      };
    default:
      return {
        light: '#dfeef0',
        base: '#8ec2c8',
        dark: '#568e97',
        frame: '#3d6f78',
        line: '#84bcc3',
        ink: '#1f4147',
        accent: '#d9a25f',
      };
  }
}

export type MoneyPieceProps = {
  kind: MoneyKind;
  denomination: number;
  size: number;
};

export function MoneyPiece({ kind, denomination, size }: MoneyPieceProps) {
  return kind === 'coin' ? (
    <Coin denomination={denomination} size={size} />
  ) : (
    <Banknote denomination={denomination} size={size} />
  );
}
