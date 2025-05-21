import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr({
      // svgr options: https://react-svgr.com/docs/options/
      svgrOptions: {
        // ...
      },
      // esbuild options, to transform jsx to js
      esbuildOptions: {
        // ...
      },
      // A minimatch pattern, or array of patterns, which specifies the files in the public directory to be compiled by svgr
      include: "**/*.svg?react",
      // A minimatch pattern, or array of patterns, which specifies the files in the public directory to be excluded by svgr
      exclude: "",
    }),
  ],
});
