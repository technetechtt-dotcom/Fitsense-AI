import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";

interface Props {
  title: string;
  onBack?: () => void;
  trailing?: ReactNode;
}

export function TopBar({ title, onBack, trailing }: Props) {
  const nav = useNavigate();
  const handleBack = onBack ?? (() => nav(-1));
  return (
    <header className="flex items-center gap-2 pt-2 min-w-0">
      <button
        onClick={handleBack}
        aria-label="Back"
        className="touch-target w-10 h-10 rounded-full bg-surface-2 grid place-items-center hover:bg-surface-3 shrink-0"
      >
        <ChevronLeft className="w-5 h-5 text-ink" />
      </button>
      <h1 className="text-lg sm:text-xl font-semibold flex-1 font-display truncate min-w-0">
        {title}
      </h1>
      {trailing ?? null}
    </header>
  );
}
