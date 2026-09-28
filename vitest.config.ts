import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["app/test/**/*.test.ts"],
    testTimeout: 5000,
  },
});
