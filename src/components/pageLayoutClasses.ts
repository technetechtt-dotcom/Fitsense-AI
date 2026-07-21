export const PAGE_X =
  "px-[max(1rem,env(safe-area-inset-left))] sm:px-5 md:px-6 lg:px-8 max-w-3xl mx-auto w-full";

export const PAGE_PB = "pb-[max(2.5rem,env(safe-area-inset-bottom))]";

export const PAGE_PT = "pt-[max(0.75rem,env(safe-area-inset-top))]";

export const PAGE_PT_TOPBAR = "pt-[max(0.5rem,env(safe-area-inset-top))]";

export function pageLayoutClass(options?: {
  withTopBar?: boolean;
  gap?: string;
  className?: string;
}): string {
  const { withTopBar, gap = "gap-5", className = "" } = options ?? {};
  return [
    "min-h-[100dvh] min-h-screen w-full bg-surface-0 flex flex-col",
    PAGE_X,
    PAGE_PB,
    withTopBar ? PAGE_PT_TOPBAR : PAGE_PT,
    gap,
    className,
  ]
    .filter(Boolean)
    .join(" ");
}
