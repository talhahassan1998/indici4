import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative base so the build works from a subpath or a static host.
  base: './',
  build: {
    outDir: 'dist',
    // three is pulled in by a dynamic import in BrandScene, so Rollup already
    // splits it into its own chunk — an explicit manualChunks entry just
    // produced an empty one.
    rollupOptions: {
      input: {
        main: 'index.html',
        login: 'login.html',
      },
      // Stable, unhashed filenames: the build is republished to a static host
      // in place, and hashed names leave an orphan behind on every deploy.
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
