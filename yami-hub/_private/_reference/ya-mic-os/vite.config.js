import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        gallery: resolve(__dirname, 'gallery.html'),
        guide: resolve(__dirname, 'guide.html'),
        start: resolve(__dirname, 'start.html'),
        tutorial: resolve(__dirname, 'tutorial.html'),
      },
    },
  },
});
