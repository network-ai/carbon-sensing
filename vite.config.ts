import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    tsConfigPaths() as never,
    tailwindcss() as never,
    tanstackStart({
      target: "bun",
      tsr: {
        generatedRouteTree: "./src/route-tree.gen.ts",
      },
    }) as never,
  ],
  test: {
    reporters: ["verbose", "junit"],
    outputFile: "./coverage/junit.xml",
    coverage: {
      provider: "istanbul",
      extension: [".ts", ".tsx"],
      reporter: ["text", "html", "cobertura"],
    },
  },
});
