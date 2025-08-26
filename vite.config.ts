import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react(), sentryVitePlugin({
    org: "teknokapsul",
    project: "teknokapsul"
  })],
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  define: {
    'process.env': '{}',
    'process.stdout': JSON.stringify({ isTTY: false }),
    'process.stderr': JSON.stringify({ isTTY: false }),
    global: 'globalThis'
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    rollupOptions: {
      external: [
        'node:events',
        'node:util',
        'node:stream',
        'node:buffer',
        'node:crypto',
        'node:fs',
        'node:path',
        'node:os',
        'node:http',
        'node:https',
        'node:url',
        'firebase-admin'
      ],
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'ui-vendor': ['@mui/material', '@emotion/react', '@emotion/styled']
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore'
    ],
    exclude: [
      'lucide-react',
      'firebase-admin',
      'node:events',
      'node:util',
      'node:stream',
      'node:buffer',
      'node:crypto',
      'node:fs',
      'node:path',
      'node:os',
      'node:http',
      'node:https',
      'node:url'
    ]
  },
  server: {
    port: 3000,
    strictPort: false,
    host: true,
    hmr: {
      timeout: 10000
    }
  },
  preview: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 8080,
    host: '0.0.0.0',
    strictPort: true
  }
});