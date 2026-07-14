interface Props {
  label: string;
  value: string;
  unit?: string;
  accent?: boolean;
}

/** Numeric stat tile: small label, big value, optional unit. */
export function StatTile({ label, value, unit, accent = false }: Props) {
  return (
    <div
      className={`rounded-2xl p-4 flex flex-col gap-1.5 border border-white/5 bg-card-grad ${
        accent ? "ring-1 ring-neon/40" : ""
      }`}
    >
      <span className="text-[10px] uppercase tracking-widest text-ink-muted">
        {label}
      </span>
      <span className="flex items-end gap-1.5">
        <span className="text-2xl sm:text-3xl font-extrabold font-display leading-none truncate">
          {value}
        </span>
        {unit ? (
          <span className="text-sm text-ink-muted mb-1">{unit}</span>
        ) : null}
      </span>
    </div>
  );
}
