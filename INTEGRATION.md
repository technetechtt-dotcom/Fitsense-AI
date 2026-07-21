# FitSense AI · Partner Integration Guide

Drop FitSense's AR foot-sizing fit finder into **any** online shoe store in under
five minutes. The integration is iframe-isolated, white-labellable, and never
modifies the host's CSS, JS or checkout flow. Works on Shopify, WooCommerce,
Magento, BigCommerce, headless React storefronts, and plain HTML pages —
including **Temu**, **Shein**, **Bash**, **Superbalist**, and any other
shoe-selling platform.

---

## 1. The 30-second version

```html
<!-- Anywhere on your page (head or body, before </body>) -->
<script src="https://cdn.fitsense.ai/embed.js" defer></script>

<!-- Any element you already have — we attach the click handler -->
<button
  data-fitsense
  data-product-id="NK-AIR-MAX-90-BLK-9"
  data-brand="Nike"
  data-store-name="Your Store"
  data-size-system="uk"
  data-on-size="applyFitSenseSize"
  class="your-existing-button-class"
>
  Find my size
</button>

<script>
  // Receive the recommendation and apply it to your own size selector
  function applyFitSenseSize(size /*, scan */) {
    const select = document.querySelector("#size-select");
    if (!select) return;
    select.value = size.uk;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }
</script>
```

That's the whole thing. Clicking the button opens a modal iframe, the user
scans their foot, and `applyFitSenseSize` fires with a typed size object the
moment they tap **Use this size**.

---

## 2. Two integration styles

### A · Declarative (zero JavaScript on your side)

Add `data-fitsense` plus any of the `data-*` attributes below to **any element**
(`<button>`, `<a>`, `<div>`, your existing "Size guide" link, etc). The SDK
auto-binds the click handler. New elements added after page load are picked up
automatically by a `MutationObserver`.

| Attribute            | Purpose                                                    | Example             |
| -------------------- | ---------------------------------------------------------- | ------------------- |
| `data-fitsense`      | Marks the element as a trigger (required, no value needed) | `data-fitsense`     |
| `data-product-id`    | Your SKU. Echoed back on events for analytics              | `NK-AM90-BLK-9`     |
| `data-brand`         | Brand label shown in the embed header                      | `Nike`              |
| `data-store-name`    | Host store name shown in the embed header                  | `Bash`              |
| `data-size-system`   | `uk` &#124; `us` &#124; `eu` &#124; `mondopoint`           | `uk`                |
| `data-on-size`       | Global function name called with the recommendation        | `applyFitSenseSize` |
| `data-on-close`      | Global function name called when the modal closes          | `onFitSenseClose`   |
| `data-theme-primary` | Primary / accent colour (any CSS colour)                   | `#FF3D00`           |
| `data-theme-bg`      | Background colour                                          | `#ffffff`           |
| `data-theme-text`    | Text colour                                                | `#111111`           |
| `data-theme-radius`  | Corner radius                                              | `8px`               |
| `data-theme-font`    | Font family                                                | `'Inter'`           |
| `data-theme-mode`    | `light` &#124; `dark` base neutrals                        | `light`             |

### B · Imperative (JavaScript API)

```html
<script src="https://cdn.fitsense.ai/embed.js" defer></script>
<script>
  // Optional: page-wide defaults applied to every open() call
  window.FitSense.init({
    storeName: "Superbalist",
    sizeSystem: "uk",
    theme: {
      primary: "#FF3D00",
      bg: "#0d0d0d",
      text: "#f5f5f5",
      radius: "4px",
      mode: "dark",
    },
  });

  document.querySelector("#find-size").addEventListener("click", () => {
    const handle = FitSense.open({
      productId: "SB-ADI-SBA",
      brand: "Adidas",
      onSize: (size, scan) => {
        console.log("Recommended:", size);
        // size = { uk: '9', us: '10', eu: '43', mondopointMm: 270, fitScore: 0.92, preferred: 'uk' }
        // scan = { scanId, lengthMm, widthMm, widthToLengthRatio, capturedAtEpochMs }
      },
      onScan: (scan) => {
        // Fires after the scan completes, before the user confirms
      },
      onClose: () => {
        // Fires when the user dismisses the modal
      },
    });

    // Programmatic close (e.g. on route change)
    // handle.close();
  });
</script>
```

The script queues calls made before the SDK has finished loading, so the
common pattern `window.FitSense = window.FitSense || []; FitSense.push(['init', {...}])`
works the same way it does with Stripe, Klarna or Google Analytics.

---

## 3. Theming

The embed exposes six CSS custom properties internally:

| Token             | Default           | Notes                            |
| ----------------- | ----------------- | -------------------------------- |
| `--fs-primary`    | `#0a84ff`         | CTAs, focus ring, highlight chip |
| `--fs-bg`         | `#ffffff`         | Surface background               |
| `--fs-text`       | `#111827`         | Primary text                     |
| `--fs-text-muted` | `#6b7280`         | Labels, captions                 |
| `--fs-surface`    | `#f3f4f6`         | Cards, dividers                  |
| `--fs-border`     | `rgba(0,0,0,.08)` | Hairlines                        |
| `--fs-radius`     | `14px`            | Cards, buttons, chips            |
| `--fs-font`       | `Inter, …`        | Font stack                       |

Pass these via the `theme` field (camelCase: `primary`, `bg`, `text`,
`textMuted`, `surface`, `border`, `radius`, `font`, `mode`). The SDK
heuristically picks the best contrast colour for the primary CTA label
based on luminance, so a magenta primary still reads.

---

## 4. Event protocol

The iframe and host communicate over `window.postMessage`. All messages are
namespaced `fitsense:*`.

### Host → iframe

| Type                 | Payload                   |
| -------------------- | ------------------------- |
| `fitsense:configure` | `{ config: EmbedConfig }` |

### Iframe → host

| Type              | Payload                                | Meaning                                           |
| ----------------- | -------------------------------------- | ------------------------------------------------- |
| `fitsense:ready`  | `{ version: string }`                  | Iframe has mounted; safe to send config           |
| `fitsense:resize` | `{ height: number }`                   | Content height changed (inline mode only)         |
| `fitsense:scan`   | `{ scan: EmbedScanSummary }`           | A scan finished — recommendation may follow       |
| `fitsense:size`   | `{ size: EmbedSizeResult, scan: ... }` | Recommendation ready (user has not confirmed yet) |
| `fitsense:apply`  | `{ size, scan }`                       | User tapped **Use this size**                     |
| `fitsense:close`  | `{}`                                   | User dismissed the modal                          |
| `fitsense:error`  | `{ message: string }`                  | Non-fatal error                                   |

`EmbedSizeResult`:

```ts
{
  uk: "9",
  us: "10",
  eu: "43",
  mondopointMm: 270,
  fitScore: 0.92,           // 0..1
  preferred: "uk"           // echo of EmbedConfig.sizeSystem
}
```

`EmbedScanSummary`:

```ts
{
  scanId: "01HX…",
  lengthMm: 264.3,
  widthMm: 99.1,
  widthToLengthRatio: 0.375,
  capturedAtEpochMs: 1736600000000
}
```

---

## 5. Cross-device handoff (desktop → phone)

Desktop browsers can't run a foot scan reliably, so the embed offers a
**Continue on phone** button that displays a QR code. The visitor scans it
with their phone, completes the AR scan there, and the size flows back to
the desktop modal automatically — same `onSize` callback, same UX, no
double data-entry.

```
DESKTOP                                      PHONE
────────────────                              ────────────────
1. user clicks "Continue on phone"
2. iframe generates sessionId
3. shows QR for {embedUrl}?session={id}
4. subscribes to handoff session              ─── user scans QR ───►
                                              5. iframe loads with ?session=id
                                              6. user completes AR scan
                                              7. iframe publishes payload
                                                 to handoff relay
8. receives payload, fires onSize ◄────────── 8. shows "✅ Sent back"
   to the host page
```

### Configuring the relay

```js
FitSense.init({
  handoff: {
    baseUrl: "https://api.fitsense.ai", // your relay endpoint
    transport: "http", // "http" | "broadcast" | "auto"
    pollMs: 1500,
  },
});
```

If `baseUrl` is omitted the SDK falls back to `BroadcastChannel`, which
**only** works for tabs in the same browser session — useful for local dev
demos, but not real cross-device flow. For production deployments you need
an HTTP relay.

### Relay HTTP contract

The relay needs three endpoints (CORS-enabled for the partner origin):

```
PUT    /v1/handoff/:sessionId          body: { payload }   → 204
GET    /v1/handoff/:sessionId          → 200 { payload?: HandoffPayload }
DELETE /v1/handoff/:sessionId          → 204
```

Behaviour:

- **PUT** stores the payload keyed by `sessionId`. Reject payloads larger
  than ~4 KB and unknown JSON shapes.
- **GET** returns `{ payload }` if one was published, otherwise `{ payload: null }`.
  Implement short-polling (default 1.5 s) or upgrade to long-polling /
  Server-Sent Events for lower latency.
- **DELETE** clears the slot after the desktop has consumed the payload.
- All sessions **must** expire automatically after ~5 minutes regardless
  of consumption to bound memory.

### Payload schema

```ts
interface HandoffPayload {
  v: 1;
  size: {
    uk: string;
    us: string;
    eu: string;
    mondopointMm: number;
    fitScore: number; // 0..1
    preferred: "uk" | "us" | "eu" | "mondopoint";
  };
  scan: {
    scanId: string;
    lengthMm: number;
    widthMm: number;
    widthToLengthRatio: number;
    capturedAtEpochMs: number;
  };
  completedAtEpochMs: number;
}
```

### Reference Node.js / Express relay

This is a complete, production-shaped reference. It uses an in-memory map;
swap in Redis / Cloudflare KV for a real deployment.

```js
// relay.mjs — `node relay.mjs` and configure baseUrl: "http://localhost:8787"
import express from "express";
import cors from "cors";

const app = express();
app.use(express.json({ limit: "8kb" }));
app.use(cors({ origin: true, methods: ["GET", "PUT", "DELETE"] }));

const SESSION_TTL_MS = 5 * 60 * 1000;
const sessions = new Map(); // sessionId → { payload, expiresAt }

function valid(id) {
  return /^[A-Za-z0-9_-]{16,64}$/.test(id);
}
function cleanup() {
  const now = Date.now();
  for (const [id, s] of sessions) if (s.expiresAt < now) sessions.delete(id);
}
setInterval(cleanup, 30_000).unref();

app.put("/v1/handoff/:id", (req, res) => {
  const { id } = req.params;
  if (!valid(id)) return res.status(400).end();
  const payload = req.body?.payload;
  if (!payload || payload.v !== 1) return res.status(400).end();
  sessions.set(id, { payload, expiresAt: Date.now() + SESSION_TTL_MS });
  res.status(204).end();
});

app.get("/v1/handoff/:id", (req, res) => {
  const { id } = req.params;
  if (!valid(id)) return res.status(400).end();
  const slot = sessions.get(id);
  if (!slot || slot.expiresAt < Date.now()) {
    return res.json({ payload: null });
  }
  res.json({ payload: slot.payload });
});

app.delete("/v1/handoff/:id", (req, res) => {
  const { id } = req.params;
  if (!valid(id)) return res.status(400).end();
  sessions.delete(id);
  res.status(204).end();
});

app.listen(8787, () => console.log("FitSense handoff relay on :8787"));
```

### Security

- The session id has ~132 bits of entropy (random 16-byte URL-safe token),
  so guessing one is computationally infeasible within the 5-min window.
- Payloads are **single-use** — the desktop deletes the slot after
  consumption, and the relay TTL guarantees expiry.
- Reject payloads above 4 KB to prevent abuse.
- Rate-limit publishes per session id (e.g. one published payload per
  session, max 30 GET polls per minute).
- All endpoints are HTTPS-only in production.
- The relay never sees raw camera frames — only the final size + scan
  metadata.

---

## 6. Inline embed (not modal)

Need the fit finder inside a product-page tab rather than a modal?

```html
<div id="fit-finder" style="min-height: 600px"></div>
<script>
  FitSense.open({
    productId: "SHEIN-WMN-4421",
    container: "#fit-finder", // string selector or HTMLElement
    onSize: (size) => {
      /* … */
    },
  });
</script>
```

The iframe fills the container instead of opening a backdrop, and posts
`fitsense:resize` messages so you can grow the container with content.

---

## 7. Per-platform notes

| Platform                          | Where to drop the snippet                                        |
| --------------------------------- | ---------------------------------------------------------------- |
| **Shopify**                       | `theme.liquid` (before `</body>`); call from a product section   |
| **WooCommerce**                   | Theme `functions.php` `wp_enqueue_script` or a snippet plugin    |
| **Magento 2**                     | `default.xml` head block; React PWA: import in your product page |
| **BigCommerce**                   | Storefront `<head>` script via Script Manager                    |
| **Temu / Shein affiliate stores** | Header injection slot or product description HTML                |
| **Bash / Superbalist**            | Product detail template, near the size selector                  |
| **Plain HTML**                    | Anywhere on the page                                             |

None of these require server-side changes.

---

## 8. Privacy & security

- The iframe runs from `https://app.fitsense.ai` under a strict CSP.
- The SDK validates the `origin` of every incoming `postMessage`; nothing from
  third-party origins is honoured.
- No host cookies are read; the FitSense session lives entirely in the iframe.
- Scans run client-side — raw camera frames are never transmitted unless
  the partner explicitly opts in to cloud measurement.
- The SDK exposes a single global (`window.FitSense`) and adds **zero**
  CSS to the host document.

---

## 9. Building the SDK locally

```bash
npm install
npm run build           # main host React app  →  dist/
npm run build:sdk       # partner embed.js     →  dist-sdk/embed.js
npm run build:all       # both
```

`dist-sdk/embed.js` is what partners include. Host the React build at the
same origin (or wherever the iframe `src` should resolve), and the SDK will
auto-derive the iframe URL from the `<script>` tag's `src`.
