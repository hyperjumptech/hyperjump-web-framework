import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    reporters: ["default", "json"],
    outputFile: "./coverage/test-output.json",
  },
});
