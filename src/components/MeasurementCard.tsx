import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import type { MeasurementUnit, ScanResult } from "../types";
import { averageLengthMm, averageWidthMm } from "../types";
import { splitLength } from "../lib/format";

interface Props {
  scan: ScanResult;
  onClick?: () => void;
  index?: number;
  units?: MeasurementUnit;
}

/** Compact row showing one persisted scan with its sizing recommendation. */
export function MeasurementCard({
  scan,
  onClick,
  index = 0,
  units = "mm",
}: Props) {
  const length = averageLengthMm(scan);
  const width = averageWidthMm(scan);
  const lengthFmt = length != null ? splitLength(length, units) : null;
  const widthFmt = width != null ? splitLength(width, units) : null;
  const rec = scan.recommendation;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.99 }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="w-full text-left rounded-2xl bg-card-grad border border-white/5 p-5 flex items-center gap-4"
    >
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-widest text-ink-muted">
          {new Date(scan.createdAtEpochMs).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-2xl font-bold font-display">
            {lengthFmt?.value ?? "—"}
          </span>
          <span className="text-ink-muted text-sm">{lengthFmt?.unit ?? units}</span>
          <span className="text-ink-muted text-sm">
            • {widthFmt?.value ?? "—"} {widthFmt?.unit ?? units} wide
          </span>
        </div>
        {rec ? (
          <div className="text-xs text-neon mt-1 tracking-wide">
            UK {rec.uk} · US {rec.us} · EU {rec.eu}
          </div>
        ) : null}
      </div>
      <ChevronRight className="w-5 h-5 text-ink-muted shrink-0" />
    </motion.button>
  );
}
