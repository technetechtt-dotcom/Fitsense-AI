import { useState } from "react";
import { Check, MessageSquareDashed, Ruler, Star, ThumbsDown, X } from "lucide-react";
import {
  appendFitEvent,
  getOrCreateFitProfile,
  listFitEvents,
  newEventId,
  persistInsights,
} from "../lib/fitProfile";
import { deriveInsights } from "../lib/fitLearning";
import type { FitDimension, FitDimensionScore, FitEventReturn } from "../types";

interface Props {
  productId: string;
  brand: string;
  size?: string;
  sizeSystem?: "uk" | "us" | "eu" | "mondopoint";
  /**
   * Compact card style; uses smaller text & padding. Use on cards.
   */
  compact?: boolean;
}

type Stage = "idle" | "kept" | "return-reason" | "fit-rate" | "wear-tag" | "done";

/**
 * Per-shoe feedback widget — wires Kept / Returned / Rate (per-dimension) /
 * Wear-feedback actions into the persistent fit-event log so the AI learns
 * from real outcomes. Drop on any recommendation or product detail view;
 * everything else is automatic.
 *
 * The "Rate the fit" path captures granular per-dimension feedback
 * (length, width, toe-box, heel, arch, instep) which feeds the per-brand
 * fit signature in `fitLearning.ts`.
 */
export function FitFeedback({
  productId,
  brand,
  size,
  sizeSystem = "eu",
  compact,
}: Props) {
  const [stage, setStage] = useState<Stage>("idle");
  const [stars, setStars] = useState(0);
  const [dims, setDims] = useState<Partial<Record<FitDimension, FitDimensionScore>>>(
    {},
  );

  const log = (event: Parameters<typeof appendFitEvent>[0]) => {
    appendFitEvent(event);
    // Re-derive insights immediately so other views see the updated state.
    const profile = getOrCreateFitProfile();
    persistInsights(deriveInsights(profile, listFitEvents()));
  };

  const onKept = () => {
    const profile = getOrCreateFitProfile();
    log({
      eventId: newEventId(),
      fitId: profile.fitId,
      epochMs: Date.now(),
      kind: "purchase",
      productId,
      brand,
      size: size ?? "",
      sizeSystem,
    });
    setStage("kept");
  };

  const onExchanged = () => {
    const profile = getOrCreateFitProfile();
    log({
      eventId: newEventId(),
      fitId: profile.fitId,
      epochMs: Date.now(),
      kind: "exchange",
      productId,
      brand,
      fromSize: size ?? "",
      toSize: "adjusted",
      sizeSystem,
      reason: "other",
    });
    setStage("done");
  };

  const onReturned = (reason: FitEventReturn["reason"]) => {
    const profile = getOrCreateFitProfile();
    log({
      eventId: newEventId(),
      fitId: profile.fitId,
      epochMs: Date.now(),
      kind: "return",
      productId,
      brand,
      reason,
    });
    // Seed the per-dimension stage from the return reason so submitting
    // is one tap. User can edit before saving.
    const seed: Partial<Record<FitDimension, FitDimensionScore>> = {};
    if (reason === "too_small") seed.length = -2;
    else if (reason === "too_large") seed.length = 2;
    else if (reason === "too_narrow") seed.width = -2;
    else if (reason === "too_wide") seed.width = 2;
    else if (reason === "uncomfortable_arch") seed.arch = -2;
    setDims(seed);
    setStage("fit-rate");
  };

  const onRate = (next: number) => {
    setStars(next);
    const profile = getOrCreateFitProfile();
    log({
      eventId: newEventId(),
      fitId: profile.fitId,
      epochMs: Date.now(),
      kind: "rating",
      productId,
      brand,
      stars: next,
    });
  };

  const onWear = (tightnessDelta: number, tag: string) => {
    const profile = getOrCreateFitProfile();
    log({
      eventId: newEventId(),
      fitId: profile.fitId,
      epochMs: Date.now(),
      kind: "wear",
      productId,
      brand,
      tightnessDelta,
      tags: tag ? [tag] : [],
    });
    setStage("done");
  };

  const setDim = (key: FitDimension, value: FitDimensionScore | undefined) => {
    setDims((prev) => {
      const next = { ...prev };
      if (value === undefined) delete next[key];
      else next[key] = value;
      return next;
    });
  };

  const submitFitRating = () => {
    if (Object.keys(dims).length === 0) {
      setStage("done");
      return;
    }
    const profile = getOrCreateFitProfile();
    log({
      eventId: newEventId(),
      fitId: profile.fitId,
      epochMs: Date.now(),
      kind: "fit_rating",
      productId,
      brand,
      dimensions: dims,
      stars: stars > 0 ? stars : undefined,
    });
    setStage("done");
  };

  const padding = compact ? "p-3" : "p-4";
  const titleSize = compact ? "text-xs" : "text-sm";

  if (stage === "done") {
    return (
      <div
        className={`rounded-2xl bg-lime/10 border border-lime/30 ${padding} text-xs text-lime flex items-center gap-2`}
      >
        <Check className="w-4 h-4" />
        Thanks — the AI just learned something new.
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl bg-surface-2 border border-white/8 ${padding} space-y-2`}
    >
      {stage === "idle" ? (
        <>
          <div className={`${titleSize} font-semibold flex items-center gap-2`}>
            <MessageSquareDashed className="w-3.5 h-3.5 text-neon" />
            How did this fit?
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onKept}
              className="rounded-xl px-2 py-2 text-[11px] font-semibold bg-lime/15 text-lime border border-lime/30 hover:bg-lime/20"
            >
              Kept
            </button>
            <button
              onClick={onExchanged}
              className="rounded-xl px-2 py-2 text-[11px] font-semibold bg-neon/15 text-neon border border-neon/30 hover:bg-neon/20"
            >
              Exchanged
            </button>
            <button
              onClick={() => setStage("return-reason")}
              className="rounded-xl px-2 py-2 text-[11px] font-semibold bg-coral/10 text-coral border border-coral/30 hover:bg-coral/20"
            >
              Returned
            </button>
          </div>
          <button
            onClick={() => setStage("fit-rate")}
            className="w-full rounded-xl px-3 py-2 text-xs font-semibold bg-surface-3 hover:bg-ink-dim/30 text-ink flex items-center justify-center gap-2 border border-white/8"
          >
            <Ruler className="w-3.5 h-3.5 text-neon" />
            Rate fit (size · length · width…)
          </button>
        </>
      ) : null}

      {stage === "kept" ? (
        <>
          <div className={`${titleSize} font-semibold flex items-center gap-2`}>
            <Star className="w-3.5 h-3.5 text-lime" />
            Rate the fit (1–5)
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => onRate(n)}
                className="w-7 h-7 rounded-md hover:bg-ink-dim/30 flex items-center justify-center"
                aria-label={`${n} star`}
              >
                <Star
                  className={`w-4 h-4 ${
                    n <= stars ? "text-lime fill-lime" : "text-ink-muted"
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              onClick={() => setStage("fit-rate")}
              className="text-[11px] rounded-lg px-2 py-1.5 bg-surface-3 hover:bg-ink-dim/30 inline-flex items-center justify-center gap-1.5"
            >
              <Ruler className="w-3 h-3 text-neon" />
              Rate fit details
            </button>
            <button
              onClick={() => setStage("wear-tag")}
              className="text-[11px] rounded-lg px-2 py-1.5 bg-surface-3 hover:bg-ink-dim/30"
            >
              Wear-test feedback
            </button>
          </div>
        </>
      ) : null}

      {stage === "return-reason" ? (
        <>
          <div className={`${titleSize} font-semibold flex items-center gap-2`}>
            <ThumbsDown className="w-3.5 h-3.5 text-coral" />
            Why did you return them?
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {(
              [
                ["too_small", "Too small"],
                ["too_large", "Too large"],
                ["too_narrow", "Too narrow"],
                ["too_wide", "Too wide"],
                ["uncomfortable_arch", "Bad arch"],
                ["wrong_style", "Wrong style"],
              ] as Array<[FitEventReturn["reason"], string]>
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => onReturned(id)}
                className="text-[11px] rounded-lg px-2 py-1.5 bg-surface-3 hover:bg-ink-dim/30 text-left"
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setStage("idle")}
            className="text-[10px] text-ink-muted hover:text-ink inline-flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Cancel
          </button>
        </>
      ) : null}

      {stage === "fit-rate" ? (
        <FitRateStage
          dims={dims}
          setDim={setDim}
          onCancel={() => setStage("idle")}
          onSubmit={submitFitRating}
          titleClass={titleSize}
        />
      ) : null}

      {stage === "wear-tag" ? (
        <>
          <div className={`${titleSize} font-semibold`}>How are they wearing in?</div>
          <div className="grid grid-cols-1 gap-1.5">
            <button
              onClick={() => onWear(-1, "tight")}
              className="text-[11px] rounded-lg px-2 py-1.5 bg-surface-3 hover:bg-ink-dim/30 text-left"
            >
              Feeling tight (size up next time)
            </button>
            <button
              onClick={() => onWear(0, "great")}
              className="text-[11px] rounded-lg px-2 py-1.5 bg-surface-3 hover:bg-ink-dim/30 text-left"
            >
              Just right
            </button>
            <button
              onClick={() => onWear(1, "loose")}
              className="text-[11px] rounded-lg px-2 py-1.5 bg-surface-3 hover:bg-ink-dim/30 text-left"
            >
              A little loose (size down next time)
            </button>
            <button
              onClick={() => onWear(-1, "blister")}
              className="text-[11px] rounded-lg px-2 py-1.5 bg-surface-3 hover:bg-ink-dim/30 text-left"
            >
              Got a blister
            </button>
            <button
              onClick={() => onWear(0, "great cushion")}
              className="text-[11px] rounded-lg px-2 py-1.5 bg-surface-3 hover:bg-ink-dim/30 text-left"
            >
              Great cushioning
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

// ─── Per-dimension rating stage ──────────────────────────────────────

interface FitRateRow {
  key: FitDimension;
  label: string;
  /** Five labels for −2, −1, 0, +1, +2. */
  scale: [string, string, string, string, string];
}

/**
 * The −2..+2 vocabulary for each axis. Order matches `FitDimensionScore`.
 * Convention: negative = "smaller / tighter / lower", positive = "bigger
 * / looser / higher". See `FitDimension` JSDoc for the contract.
 */
const FIT_RATE_ROWS: FitRateRow[] = [
  {
    key: "size",
    label: "Overall size",
    scale: ["Way too small", "Bit small", "Spot on", "Bit big", "Way too big"],
  },
  {
    key: "length",
    label: "Length",
    scale: ["Way too short", "Bit short", "Perfect", "Bit long", "Way too long"],
  },
  {
    key: "width",
    label: "Width",
    scale: ["Way too narrow", "Bit narrow", "Perfect", "Bit wide", "Way too wide"],
  },
  {
    key: "toeBox",
    label: "Toe-box",
    scale: ["Crushed toes", "Bit tight", "Perfect", "Roomy", "Sloppy"],
  },
  {
    key: "heel",
    label: "Heel",
    scale: ["Heel slips", "Loose", "Locked in", "Snug", "Digs in"],
  },
  {
    key: "arch",
    label: "Arch support",
    scale: ["Too flat", "Bit flat", "Perfect", "Bit high", "Too peaky"],
  },
  {
    key: "instep",
    label: "Instep / top",
    scale: ["Crushed", "Bit tight", "Perfect", "Loose", "Floppy"],
  },
];

interface FitRateStageProps {
  dims: Partial<Record<FitDimension, FitDimensionScore>>;
  setDim: (key: FitDimension, value: FitDimensionScore | undefined) => void;
  onCancel: () => void;
  onSubmit: () => void;
  titleClass: string;
}

function FitRateStage({
  dims,
  setDim,
  onCancel,
  onSubmit,
  titleClass,
}: FitRateStageProps) {
  const filledCount = Object.keys(dims).length;
  return (
    <>
      <div className={`${titleClass} font-semibold flex items-center gap-2`}>
        <Ruler className="w-3.5 h-3.5 text-neon" />
        Rate the fit
      </div>
      <p className="text-[10px] text-ink-muted leading-snug">
        Tap any axis. Skip the ones you don't care about — even one signal helps the AI
        learn this brand.
      </p>
      <div className="space-y-2.5 pt-1">
        {FIT_RATE_ROWS.map((row) => (
          <DimensionRow
            key={row.key}
            row={row}
            value={dims[row.key]}
            onChange={(v) => setDim(row.key, v === dims[row.key] ? undefined : v)}
          />
        ))}
      </div>
      <div className="pt-2 flex items-center gap-2">
        <button
          onClick={onSubmit}
          disabled={filledCount === 0}
          className="flex-1 rounded-xl px-3 py-2 text-xs font-semibold bg-neon text-onyx hover:bg-neon-dim disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Save fit rating
          {filledCount > 0 ? ` (${filledCount})` : ""}
        </button>
        <button
          onClick={onCancel}
          className="rounded-xl px-3 py-2 text-[11px] text-ink-muted hover:text-ink inline-flex items-center gap-1"
        >
          <X className="w-3 h-3" />
          Cancel
        </button>
      </div>
    </>
  );
}

interface DimensionRowProps {
  row: FitRateRow;
  value: FitDimensionScore | undefined;
  onChange: (next: FitDimensionScore) => void;
}

function DimensionRow({ row, value, onChange }: DimensionRowProps) {
  const scores: FitDimensionScore[] = [-2, -1, 0, 1, 2];
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="text-[11px] font-semibold text-ink">{row.label}</div>
        {value !== undefined ? (
          <div className="text-[10px] text-neon">{row.scale[value + 2]}</div>
        ) : (
          <div className="text-[10px] text-ink-muted">Tap to rate</div>
        )}
      </div>
      <div role="radiogroup" aria-label={row.label} className="grid grid-cols-5 gap-1">
        {scores.map((score, i) => {
          const active = value === score;
          return (
            <button
              key={score}
              type="button"
              role="radio"
              aria-checked={active}
              title={row.scale[i]}
              onClick={() => onChange(score)}
              className={`h-7 rounded-md text-[10px] font-semibold border transition-colors ${
                active
                  ? "bg-neon text-onyx border-neon"
                  : "bg-surface-3 text-ink-muted border-white/8 hover:bg-ink-dim/30 hover:text-ink"
              }`}
            >
              {labelGlyph(score)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function labelGlyph(score: FitDimensionScore): string {
  switch (score) {
    case -2:
      return "−−";
    case -1:
      return "−";
    case 0:
      return "OK";
    case 1:
      return "+";
    case 2:
      return "++";
  }
}
