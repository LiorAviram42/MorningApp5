import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    base: "/",
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    optimizeDeps: {
      exclude: [
        "firebase",
        "firebase/app",
        "firebase/auth",
        "firebase/firestore",
      ],
    },
    server: {
      host: "0.0.0.0",
      port: 3000,
      allowedHosts: true,
      hmr: {
        protocol: "wss",
        clientPort: 443,
      },
    },
  };
});
