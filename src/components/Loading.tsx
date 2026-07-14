import { Loader2 } from "lucide-react";

interface Props {
  label?: string;
}

export function Loading({ label = "Loading…" }: Props) {
  return (
    <div className="min-h-[50dvh] grid place-items-center py-24 gap-4 px-4 text-center">
      <Loader2 className="w-10 h-10 text-neon animate-spin" />
      <p className="text-sm text-ink-muted">{label}</p>
    </div>
  );
}
