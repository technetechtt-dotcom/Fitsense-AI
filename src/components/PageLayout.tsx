import type { ReactNode } from "react";

/** Horizontal page gutter with safe-area insets; caps content width on large screens. */
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

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
  withTopBar?: boolean;
  gap?: string;
}

export function PageLayout({
  children,
  className,
  withTopBar,
  gap,
}: PageLayoutProps) {
  return (
    <div className={pageLayoutClass({ withTopBar, gap, className })}>
      {children}
    </div>
  );
}

interface StickyPageHeaderProps {
  children: ReactNode;
  className?: string;
}

/** Sticky top bar for scrollable pages (Fit profile, Privacy). */
export function StickyPageHeader({ children, className = "" }: StickyPageHeaderProps) {
  return (
    <header
      className={`sticky top-0 z-10 -mx-[max(1rem,env(safe-area-inset-left))] sm:-mx-5 md:-mx-6 lg:-mx-8 px-[max(1rem,env(safe-area-inset-left))] sm:px-5 md:px-6 lg:px-8 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 bg-surface-0/90 backdrop-blur border-b border-ink-dim/20 flex items-center gap-3 ${className}`}
    >
      {children}
    </header>
  );
}
