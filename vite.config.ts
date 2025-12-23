import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync } from 'fs';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        {
          name: 'copy-cloudflare-files',
          closeBundle() {
            // Copy _headers and _redirects to dist folder for Cloudflare Pages
            try {
              copyFileSync(path.resolve(__dirname, '_headers'), path.resolve(__dirname, 'dist', '_headers'));
              copyFileSync(path.resolve(__dirname, '_redirects'), path.resolve(__dirname, 'dist', '_redirects'));
            } catch (error) {
              console.warn('Failed to copy Cloudflare files:', error);
            }
          }
        }
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
      }
    };
});
