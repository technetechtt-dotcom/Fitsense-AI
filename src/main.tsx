import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { installCapacitorBridge } from "./lib/native/capacitorBridge";
import "./index.css";

// Best-effort native bridge install — no-ops on plain web.
void installCapacitorBridge();

const isEmbed =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("embed") === "1";

if (isEmbed) {
  // Mark the document as an embed before React mounts so the host app's
  // phone-frame CSS in index.css is suppressed on the very first paint.
  document.documentElement.setAttribute("data-fs-embed", "true");
}

const container = document.getElementById("root");
if (!container) throw new Error("Missing #root element in index.html");

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
