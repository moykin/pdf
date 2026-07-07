import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// @see https://tauri.app/start/frontend/vite/
const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [react(), tailwindcss()],

  // Tauri expects a fixed port and should not clear the terminal.
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: 'ws', host, port: 1421 } : undefined,
    watch: {
      // Rust rebuilds are driven by Tauri, not Vite.
      ignored: ['**/src-tauri/**'],
    },
  },

  // Expose Tauri env vars to the client.
  envPrefix: ['VITE_', 'TAURI_ENV_'],

  build: {
    // Tauri ships a modern webview (WKWebView / WebView2 / WebKitGTK).
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
  },
});
