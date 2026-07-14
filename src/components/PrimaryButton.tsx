import { motion } from "framer-motion";
import { type ButtonHTMLAttributes, type ReactNode } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  leadingIcon?: ReactNode;
  variant?: "gradient" | "ghost" | "solid";
}

/**
 * Primary call-to-action button — gradient pill with subtle press animation.
 * Mirrors PrimaryButton.kt in the Android project.
 */
export function PrimaryButton({
  children,
  leadingIcon,
  variant = "gradient",
  disabled,
  className = "",
  ...rest
}: Props) {
  const base =
    "min-h-[3.25rem] h-14 px-5 sm:px-7 rounded-full font-semibold inline-flex items-center justify-center gap-2 transition-all text-sm sm:text-base w-full sm:w-auto";
  const styles =
    variant === "gradient"
      ? "bg-scan-grad text-surface-0 shadow-neon hover:shadow-glow"
      : variant === "solid"
      ? "bg-ink text-surface-0"
      : "bg-surface-2 text-ink border border-white/5 hover:bg-surface-3";

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      whileHover={{ y: disabled ? 0 : -1 }}
      disabled={disabled}
      className={`${base} ${styles} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...(rest as any)}
    >
      {leadingIcon ? <span className="h-5 w-5 grid place-items-center">{leadingIcon}</span> : null}
      <span className="tracking-wide">{children}</span>
    </motion.button>
  );
}
