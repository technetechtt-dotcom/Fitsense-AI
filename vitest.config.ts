import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    exclude: ["backend/**", "node_modules/**", "dist/**", "dist-sdk/**"],
  },
});
