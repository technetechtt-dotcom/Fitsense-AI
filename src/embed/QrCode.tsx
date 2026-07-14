import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface Props {
  /** URL or text to encode. */
  value: string;
  /** Pixel size of the rendered canvas. Default 224. */
  size?: number;
  /** Foreground colour (the dark modules). Default `currentColor`-ish. */
  foreground?: string;
  /** Background colour. Default `transparent`. */
  background?: string;
  /** Module-resistance margin (in QR modules). Default 1. */
  margin?: number;
}

/**
 * Themable QR code renderer used by the cross-device handoff flow.
 *
 * Re-renders only when `value` or visual props change. Falls back to a
 * plain text rendering of the URL if QR generation throws for any reason
 * (so the flow degrades gracefully rather than crashing the iframe).
 */
export function QrCode({
  value,
  size = 224,
  foreground = "#0a0f1c",
  background = "#ffffff",
  margin = 1,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fallbackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const fallback = fallbackRef.current;
    if (!canvas) return;
    let cancelled = false;
    QRCode.toCanvas(canvas, value, {
      width: size,
      margin,
      errorCorrectionLevel: "M",
      color: { dark: foreground, light: background },
    })
      .then(() => {
        if (cancelled) return;
        if (fallback) fallback.style.display = "none";
        canvas.style.display = "block";
      })
      .catch(() => {
        if (cancelled) return;
        canvas.style.display = "none";
        if (fallback) fallback.style.display = "block";
      });
    return () => {
      cancelled = true;
    };
  }, [value, size, foreground, background, margin]);

  return (
    <div
      className="fs-qr"
      style={{
        width: size,
        height: size,
        background,
        borderRadius: "var(--fs-radius)",
      }}
    >
      <canvas ref={canvasRef} width={size} height={size} />
      <div
        ref={fallbackRef}
        className="fs-qr-fallback"
        style={{ display: "none" }}
      >
        {value}
      </div>
    </div>
  );
}
