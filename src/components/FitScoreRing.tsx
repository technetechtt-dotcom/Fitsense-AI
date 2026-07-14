import { motion } from "framer-motion";

interface Props {
  label: string;
  percent: number;
  size?: number;
}

/**
 * Circular score ring with a percentage label.
 * Mirrors FitScoreIndicator.kt on the Android side.
 */
export function FitScoreRing({ label, percent, size = 88 }: Props) {
  const clamped = Math.max(0, Math.min(100, percent));
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped / 100);

  return (
    <div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00E5C7" />
            <stop offset="100%" stopColor="#7C4DFF" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#1F2740"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <div className="text-lg font-bold leading-none">{clamped}%</div>
        <div className="text-[10px] uppercase tracking-wider text-ink-muted mt-1">
          {label}
        </div>
      </div>
    </div>
  );
}
