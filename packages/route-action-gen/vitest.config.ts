import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
    },
    environment: "node",
    exclude: ["node_modules", "dist"],
    testTimeout: 10000,
  },
});
