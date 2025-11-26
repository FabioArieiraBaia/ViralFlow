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
      proxy: {
        // Proxy para contornar CORS do Pollinations em localhost
        '/pollinations_proxy': {
          target: 'https://image.pollinations.ai',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/pollinations_proxy/, ''),
          secure: false,
          headers: {
            'Referer': 'https://pollinations.ai/',
            'Origin': 'https://pollinations.ai',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
          }
        }
      }
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