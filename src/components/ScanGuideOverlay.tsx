/**
 * Translucent foot-shaped scan guide drawn on top of the simulated camera
 * preview. The dashed outline pulses and a neon sweep line travels top-to-
 * bottom to convey "scanning". Pure SVG + CSS animations.
 *
 * Mirrors ScanGuideOverlay.kt on the Android side.
 */
export function ScanGuideOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center">
      <div className="relative w-[42%] h-[62%]">
        <svg
          viewBox="0 0 100 180"
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 w-full h-full animate-pulseGlow"
        >
          <defs>
            <linearGradient id="guide-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00E5C7" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#7C4DFF" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <path
            d="M50 4
               C 90 14, 96 70, 82 110
               C 76 132, 80 160, 50 174
               C 22 176, 14 156, 12 132
               C 4 100, -2 56, 8 32
               C 18 12, 32 2, 50 4 Z"
            fill="rgba(0,229,199,0.06)"
            stroke="url(#guide-grad)"
            strokeWidth="1.2"
            strokeDasharray="3 2"
          />
          {/* Inner ghost outline */}
          <path
            d="M50 12
               C 84 22, 88 70, 76 106
               C 70 126, 72 152, 50 164
               C 26 164, 20 148, 18 126
               C 10 98, 6 58, 16 38
               C 24 22, 36 12, 50 12 Z"
            fill="none"
            stroke="rgba(0,229,199,0.35)"
            strokeWidth="0.5"
          />
        </svg>

        {/* Sweep line */}
        <div className="absolute inset-x-[-8%] top-0 h-px overflow-visible">
          <div
            className="absolute inset-x-0 h-px animate-scanSweep"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, #B8FF5C 50%, transparent 100%)",
              boxShadow: "0 0 12px #B8FF5C",
            }}
          />
        </div>

        {/* Corner brackets */}
        {(["tl", "tr", "bl", "br"] as const).map((c) => (
          <span
            key={c}
            className={`absolute w-5 h-5 border-neon ${
              c === "tl"
                ? "top-[-12px] left-[-12px] border-t-2 border-l-2"
                : c === "tr"
                ? "top-[-12px] right-[-12px] border-t-2 border-r-2"
                : c === "bl"
                ? "bottom-[-12px] left-[-12px] border-b-2 border-l-2"
                : "bottom-[-12px] right-[-12px] border-b-2 border-r-2"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
