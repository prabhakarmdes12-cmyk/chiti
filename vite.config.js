import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Set base to your GitHub repo name, e.g. "/chiti/" for github.com/yourname/chiti
// For a custom domain (chiti.ai), set base to "/"
const base = process.env.GITHUB_PAGES ? "/chiti/" : "/";

export default defineConfig({
  plugins: [react()],
  base,
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        // Split vendor chunks for better caching
        manualChunks: {
          react: ["react", "react-dom"],
        },
      },
    },
  },
});
