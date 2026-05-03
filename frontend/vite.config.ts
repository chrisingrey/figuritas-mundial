import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  envDir: "./src/env",
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components/index.tsx"),
      "@business-components": path.resolve(__dirname, "./src/business-components/index.tsx"),
      "@backend": path.resolve(__dirname, "./src/backend/index.ts"),
    },
  },
});
