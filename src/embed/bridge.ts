import type {
  EmbedToHostMessage,
  HostToEmbedMessage,
} from "./types";

/**
 * Thin postMessage bridges. Used in two contexts:
 *  - inside the iframe (the React EmbedApp) to talk to the host page;
 *  - inside the SDK script on the host page to talk to the iframe.
 *
 * Both sides validate the message origin against an allow-list and ignore
 * any messages whose `type` does not start with the `fitsense:` namespace.
 */

const NAMESPACE = "fitsense:";

/** No-op unsubscribe handle for server-side rendering paths. */
const noop = (): void => undefined;

function isFitSenseMessage(data: unknown): data is { type: string } {
  return (
    !!data &&
    typeof data === "object" &&
    typeof (data as { type?: unknown }).type === "string" &&
    (data as { type: string }).type.startsWith(NAMESPACE)
  );
}

// ─── In-iframe: send to parent, listen for parent ────────────────────────

export function postToHost(message: EmbedToHostMessage): void {
  if (typeof window === "undefined") return;
  if (window.parent === window) return;
  try {
    window.parent.postMessage(message, "*");
  } catch {
    // ignore — host frame may have navigated away
  }
}

export function listenFromHost(
  handler: (msg: HostToEmbedMessage) => void,
): () => void {
  if (typeof window === "undefined") return noop;
  const onMessage = (event: MessageEvent) => {
    if (!isFitSenseMessage(event.data)) return;
    handler(event.data as HostToEmbedMessage);
  };
  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}

// ─── In-host: send to iframe, listen for iframe ──────────────────────────

export function postToEmbed(
  iframe: HTMLIFrameElement,
  message: HostToEmbedMessage,
  targetOrigin: string,
): void {
  iframe.contentWindow?.postMessage(message, targetOrigin);
}

export function listenFromEmbed(
  expectedOrigin: string,
  handler: (msg: EmbedToHostMessage) => void,
): () => void {
  const onMessage = (event: MessageEvent) => {
    // Allow same-origin or wildcard explicit opt-in
    if (
      expectedOrigin !== "*" &&
      event.origin !== expectedOrigin &&
      event.origin !== window.location.origin
    ) {
      return;
    }
    if (!isFitSenseMessage(event.data)) return;
    handler(event.data as EmbedToHostMessage);
  };
  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}
