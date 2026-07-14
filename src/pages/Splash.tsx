import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Footprints } from "lucide-react";
import { hasCompletedOnboarding } from "../lib/storage";

/**
 * Animated splash screen. Holds for ~1.2s then routes to onboarding or home
 * depending on persisted state.
 */
export function Splash() {
  const nav = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => {
      nav(hasCompletedOnboarding() ? "/home" : "/onboarding", { replace: true });
    }, 1200);
    return () => clearTimeout(t);
  }, [nav]);

  return (
    <div className="min-h-[100dvh] min-h-screen w-full grid place-items-center bg-surface-0 overflow-hidden relative px-6">
      {/* Ambient glow */}
      <motion.div
        className="absolute w-[min(420px,90vw)] h-[min(420px,90vw)] rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(0,229,199,0.25), transparent 70%)",
          filter: "blur(20px)",
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative flex flex-col items-center gap-5"
      >
        <div className="w-28 h-28 rounded-3xl bg-card-grad border border-white/10 grid place-items-center shadow-neon">
          <Footprints className="w-14 h-14 text-neon" />
        </div>
        <h1 className="text-fluid-title font-extrabold tracking-widest font-display text-center">
          FITSENSE&nbsp;AI
        </h1>
        <p className="text-sm text-ink-muted">Calibrating vision…</p>
      </motion.div>
    </div>
  );
}
