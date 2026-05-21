import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@\//,
        replacement: fileURLToPath(new URL("./src/", import.meta.url)),
      },
      {
        find: /^@shared\//,
        replacement: fileURLToPath(new URL("./shared/src/", import.meta.url)),
      },
    ],
  },
  test: {
    environment: "node",
    include: [
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "shared/src/**/*.test.ts",
    ],
  },
});
