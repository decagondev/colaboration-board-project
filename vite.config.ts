import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Vite configuration for CollabBoard.
 *
 * Production build is optimized with:
 * - Manual chunk splitting for better caching
 * - Minification and tree-shaking
 * - Source maps for debugging
 *
 * @see https://vitejs.dev/config/
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          konva: ['konva', 'react-konva'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/database'],
          openai: ['openai'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@auth': path.resolve(__dirname, './src/auth'),
      '@board': path.resolve(__dirname, './src/board'),
      '@sync': path.resolve(__dirname, './src/sync'),
      '@presence': path.resolve(__dirname, './src/presence'),
      '@ai': path.resolve(__dirname, './src/ai'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
});
