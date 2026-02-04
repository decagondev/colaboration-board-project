import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Vite configuration for CollabBoard.
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
