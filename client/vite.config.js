import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',   // preview needs to bind outside localhost
    port: 5173,
    strictPort: true,
    // The platform preview proxy uses a generated hostname, so allow it.
    allowedHosts: true,
    proxy: {
      // one origin for the browser: /api -> Express (no CORS trouble, no hardcoded localhost)
      '/api': {
        target: process.env.API_URL ?? 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
    },
  },
});
