import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react()],
    base: './', 
    server: {
      port: 3000,
    },
    build: {
      outDir: 'build',
      emptyOutDir: true,
    },
    resolve: {
      alias: {
        '@': path.resolve('.'), 
      },
    },
    define: {
      // Critical: Expose API_KEY to the client-side code
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY),
    }
  };
});