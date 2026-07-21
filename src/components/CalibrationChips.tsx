import type { CalibrationReference } from "../types";

interface Props {
  value: CalibrationReference;
  onChange: (next: CalibrationReference) => void;
  options?: CalibrationReference[];
}

/** Segmented control for picking the calibration mode (AR / A4 / card). */
export function CalibrationChips({
  value,
  onChange,
  options = ["arcore_plane", "a4_paper", "credit_card"],
}: Props) {
  return (
    <div className="flex gap-1.5 p-1.5 rounded-2xl bg-black/55 backdrop-blur-md">
      {options.map((ref) => {
        const active = ref === value;
        return (
          <button
            key={ref}
            onClick={() => onChange(ref)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              active ? "bg-neon text-surface-0" : "text-ink hover:bg-white/5"
            }`}
          >
            {labelFor(ref)}
          </button>
        );
      })}
    </div>
  );
}

function labelFor(ref: CalibrationReference): string {
  if (ref === "arcore_plane") return "AR plane";
  if (ref === "a4_paper") return "A4 paper";
  return "Bank card";
}
