import { defineConfig } from "vite";
import { assertProductionFlags } from "./vite.productionGuard";

/**
 * Build configuration for the partner-facing SDK bundle (`embed.js`).
 *
 * The host app's primary build (vite.config.ts) still produces the
 * React SPA that renders inside the iframe. This config produces a
 * tiny, framework-free IIFE that hosts include with a single <script>
 * tag. Run with:  `npm run build:sdk`
 *
 * Output:
 *   dist-sdk/
 *     embed.js     — minified IIFE (partners include this)
 */
export default defineConfig(({ mode }) => {
  assertProductionFlags(mode);
  return {
    build: {
      target: "es2019",
      outDir: "dist-sdk",
      emptyOutDir: true,
      lib: {
        entry: "src/embed/sdk.ts",
        name: "FitSenseEmbed",
        formats: ["iife"],
        fileName: () => "embed.js",
      },
      rollupOptions: {
        output: {
          extend: true,
        },
      },
      sourcemap: true,
      minify: "oxc",
    },
  };
});
