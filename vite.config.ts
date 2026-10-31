import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [react(), tailwindcss(), dts({ include: ["src"], outDir: "dist" })],
  build: {
    lib: {
      entry: {
        index: resolve(import.meta.dirname, "src/index.ts"),
        button: resolve(import.meta.dirname, "src/components/button/index.ts"),
        badge: resolve(import.meta.dirname, "src/components/badge/index.ts"),
        avatar: resolve(import.meta.dirname, "src/components/avatar/index.ts"),
        spinner: resolve(
          import.meta.dirname,
          "src/components/spinner/index.ts",
        ),
        input: resolve(import.meta.dirname, "src/components/input/index.ts"),
        card: resolve(import.meta.dirname, "src/components/card/index.ts"),
        separator: resolve(
          import.meta.dirname,
          "src/components/separator/index.ts",
        ),
        skeleton: resolve(
          import.meta.dirname,
          "src/components/skeleton/index.ts",
        ),
        progress: resolve(
          import.meta.dirname,
          "src/components/progress/index.ts",
        ),
        textarea: resolve(
          import.meta.dirname,
          "src/components/textarea/index.ts",
        ),
        label: resolve(import.meta.dirname, "src/components/label/index.ts"),
        "form-field": resolve(
          import.meta.dirname,
          "src/components/form-field/index.ts",
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
