import { AlertTriangle } from "lucide-react";

interface Props {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: Props) {
  return (
    <div className="min-h-[50dvh] grid place-items-center py-24 gap-4 text-center px-[max(1.5rem,env(safe-area-inset-left))]">
      <AlertTriangle className="w-12 h-12 text-coral" />
      <p className="text-base">{message}</p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="px-5 py-2 rounded-full border border-white/10 hover:bg-surface-2 text-sm"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
