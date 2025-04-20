import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config to proxy API calls in development
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forward `/api/*` to backend at port 5000 (use IPv4 to avoid IPv6 lookup issues)
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
}); 