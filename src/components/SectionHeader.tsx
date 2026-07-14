import type { ReactNode } from "react";

interface Props {
  title: string;
  trailing?: ReactNode;
}

export function SectionHeader({ title, trailing }: Props) {
  return (
    <div className="flex items-center justify-between px-1">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-ink-muted">
        {title}
      </h2>
      {trailing ?? null}
    </div>
  );
}
