import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
      include: '**/*.{js,jsx,ts,tsx}',
    }),
    svgr({
      svgrOptions: {
        // svgr options
      },
    }),
  ],
  server: {
    port: 3000,
    host: true, // Allow external connections (needed for Docker)
    watch: {
      usePolling: true, // Enable polling for file watching in Docker
    },
    proxy: {
      // Proxy API requests to the backend server
      // Example:
      // '/api': {
      //   target: 'http://localhost:5000', // Your backend server URL
      //   changeOrigin: true,
      //   secure: false,
      // },
    },
  },
});
