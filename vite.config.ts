import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// Separated frontend configuration for Vercel deployment
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@assets": fileURLToPath(new URL("./src/assets", import.meta.url)),
      "@shared": fileURLToPath(new URL("./shared", import.meta.url)),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          "ui-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-tooltip",
          ],
          "chart-vendor": ["lightweight-charts", "recharts"],
          "motion-vendor": ["framer-motion"],
        },
      },
    },
  },
  server: {
    port: 2000,
    host: "0.0.0.0",
    // Allow Replit domains to connect to the Vite dev server
    allowedHosts: [
      "localhost",
      ".replit.dev", // Allow any Replit subdomain
      ".sisko.replit.dev", // Allow Replit internal domains
    ],
    hmr: {
      clientPort: 2000,
    },
  },
  define: {
    // Environment variables for API connection
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
});