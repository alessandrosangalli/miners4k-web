import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Use relative paths for Github Pages deployment!
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
});
