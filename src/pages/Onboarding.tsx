import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ScanLine, Sparkles, Footprints } from "lucide-react";
import { PAGE_X, PAGE_PB } from "../components/PageLayout";
import { PrimaryButton } from "../components/PrimaryButton";
import { markOnboardingComplete } from "../lib/storage";

interface Slide {
  title: string;
  body: string;
  icon: typeof ScanLine;
  /** Opaque CSS color used as the inner stop of the radial halo. */
  haloColor: string;
}

const SLIDES: Slide[] = [
  {
    title: "Scan once. Fit perfectly.",
    body:
      "FitSense uses AR + computer vision to measure your foot from a single scan — no tape measure, no guesswork.",
    icon: Footprints,
    haloColor: "rgba(0, 229, 199, 0.40)",
  },
  {
    title: "Precision powered by ARCore",
    body:
      "We map a horizontal plane under your foot and convert pixels to millimetres in real time.",
    icon: ScanLine,
    haloColor: "rgba(124, 77, 255, 0.45)",
  },
  {
    title: "Shoes that actually fit",
    body:
      "Get personalised recommendations across Nike, Adidas, Puma and local brands — with fit and comfort scores.",
    icon: Sparkles,
    haloColor: "rgba(210, 255, 0, 0.40)",
  },
];

export function Onboarding() {
  const nav = useNavigate();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  const finish = () => {
    markOnboardingComplete();
    nav("/home", { replace: true });
  };

  return (
    <div className="min-h-[100dvh] min-h-screen flex flex-col bg-surface-0 w-full max-w-3xl mx-auto">
      <header
        className={`flex justify-end pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 ${PAGE_X}`}
      >
        <button
          onClick={finish}
          className="text-sm text-ink-muted hover:text-ink"
        >
          Skip
        </button>
      </header>

      <main className={`flex-1 flex flex-col ${PAGE_X}`}>
        <div className="flex-1 grid place-items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-[min(16rem,70vw)] h-[min(16rem,70vw)] rounded-full grid place-items-center"
              style={{
                background: `radial-gradient(closest-side, ${slide.haloColor} 0%, transparent 75%)`,
              }}
            >
              <slide.icon
                className="w-[min(6rem,22vw)] h-[min(6rem,22vw)] text-ink"
                strokeWidth={1.2}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`text-${index}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.32 }}
            className="flex flex-col gap-3"
          >
            <h1 className="text-fluid-display font-extrabold leading-tight font-display">
              {slide.title}
            </h1>
            <p className="text-base text-ink-muted leading-relaxed">
              {slide.body}
            </p>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer
        className={`flex items-center py-6 gap-3 ${PAGE_X} ${PAGE_PB}`}
      >
        <div className="flex gap-1.5 flex-1">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-7 bg-neon" : "w-1.5 bg-surface-3 hover:bg-ink-dim"
              }`}
            />
          ))}
        </div>
        <PrimaryButton onClick={isLast ? finish : () => setIndex(index + 1)}>
          {isLast ? "Get started" : "Next"}
        </PrimaryButton>
      </footer>
    </div>
  );
}
