import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  // @ts-expect-error - Vite version mismatch between vitest (5.x) and project (6.x)
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["app/**/*.{ts,tsx}"],
      exclude: [
        "app/**/*.d.ts",
        "app/client.tsx",
        "app/ssr.tsx",
        "app/router.tsx",
      ],
    },
    alias: {
      "~/lib": "./app/lib",
      "~/components": "./app/components",
      "~/routes": "./app/routes",
    },
  },
});
