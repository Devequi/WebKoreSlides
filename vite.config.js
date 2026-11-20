import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/WebKoreSlides/",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"],
          charts: ["recharts"],
        },
      },
    },
  },
});