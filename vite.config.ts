import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { components } from "./scripts/components.mjs";

export default defineConfig({
  plugins: [react(), tailwindcss(), dts({ include: ["src"], outDir: "dist" })],
  build: {
    lib: {
      entry: {
        index: resolve(import.meta.dirname, "src/index.ts"),
        ...Object.fromEntries(
          components.map(({ name }) => [
            name,
            resolve(import.meta.dirname, `src/components/${name}/index.ts`),
          ]),
        ),
      },
      formats: ["es"],
      fileName: (_format, entryName) => `${entryName}.js`,
      cssFileName: "styles",
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
    },
  },
});
