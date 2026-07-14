import { motion } from "framer-motion";
import { ChevronRight, ShoppingBag, Zap } from "lucide-react";
import type { ShoeMatch } from "../types";

interface Props {
  match: ShoeMatch;
  index?: number;
  onClick?: () => void;
}

/** Single recommended shoe row with fit + comfort scores. */
export function ShoeCard({ match, index = 0, onClick }: Props) {
  const sharedClasses =
    "w-full rounded-2xl bg-card-grad border border-white/5 p-4 flex items-center gap-4 text-left";

  const body = (
    <>
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-surface-3 grid place-items-center shrink-0 overflow-hidden">
        {match.imageUrl ? (
          <img
            src={match.imageUrl}
            alt={match.model}
            className="w-full h-full object-cover"
          />
        ) : (
          <ShoppingBag className="w-6 h-6 text-neon" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-widest text-ink-muted">
          {match.brand}
        </div>
        <div className="text-base font-semibold truncate">{match.model}</div>
        <div className="text-xs text-ink-muted mt-0.5 flex items-center gap-2">
          <span>EU {match.recommendedEuSize}</span>
          <span className="w-1 h-1 rounded-full bg-ink-dim" />
          <span className="text-neon flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Fit {match.fitScore}%
          </span>
          <span className="w-1 h-1 rounded-full bg-ink-dim" />
          <span className="text-lime">Comfort {match.comfortScore}%</span>
        </div>
      </div>

      {onClick ? (
        <ChevronRight className="w-5 h-5 text-ink-muted shrink-0" />
      ) : null}
    </>
  );

  const animationProps = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: index * 0.04, duration: 0.3 },
  };

  if (onClick) {
    return (
      <motion.button
        {...animationProps}
        onClick={onClick}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.99 }}
        className={`${sharedClasses} hover:border-white/15 transition-colors`}
      >
        {body}
      </motion.button>
    );
  }

  return (
    <motion.div {...animationProps} className={sharedClasses}>
      {body}
    </motion.div>
  );
}
