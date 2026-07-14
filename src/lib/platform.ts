/**
 * Lightweight user-agent classification. Only used for showing
 * platform-specific UX copy (permission re-enable instructions, etc.) —
 * never branch real measurement logic on this.
 */
export function detectPlatform(): "ios" | "android" | "desktop" | "unknown" {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ reports as MacIntel but exposes touch.
    (navigator.platform === "MacIntel" && (navigator.maxTouchPoints ?? 0) > 1)
  ) {
    return "ios";
  }
  if (/Android/i.test(ua)) return "android";
  if (/Macintosh|Windows|Linux/.test(ua)) return "desktop";
  return "unknown";
}

/** True if the current browser is a mobile Safari variant. */
export function isMobileSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  return isIOS && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
}
