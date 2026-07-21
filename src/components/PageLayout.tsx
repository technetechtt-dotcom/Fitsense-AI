import type { ReactNode } from "react";
import { pageLayoutClass } from "./pageLayoutClasses";

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
  withTopBar?: boolean;
  gap?: string;
}

export function PageLayout({ children, className, withTopBar, gap }: PageLayoutProps) {
  return (
    <div className={pageLayoutClass({ withTopBar, gap, className })}>{children}</div>
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
