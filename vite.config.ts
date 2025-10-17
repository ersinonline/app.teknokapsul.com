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
    chunkSizeWarningLimit: 1000,
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
            // React ecosystem
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            
            // Firebase services
            'firebase-vendor': [
              'firebase/app',
              'firebase/auth',
              'firebase/firestore',
              'firebase/storage',
              'firebase/analytics'
            ],
            
            // Authentication
            'auth-vendor': ['@clerk/clerk-react'],
            
            // UI libraries
            'ui-vendor': [
              'lucide-react'
            ],
            
            // Charts and visualization
            'charts-vendor': ['recharts', 'chart.js', 'react-chartjs-2'],
            
            // Utilities
            'utils-vendor': [
              'date-fns',
              'clsx',
              'tailwind-merge'
            ],
            
            // Large individual packages
            'lodash': ['lodash'],
            'axios': ['axios']
          },
          chunkFileNames: () => {
            return `js/[name]-[hash].js`;
          },
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const name = assetInfo.name || 'asset';
            const info = name.split('.');
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `images/[name]-[hash][extname]`;
            }
            if (/css/i.test(ext)) {
              return `css/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
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
    allowedHosts: [
      'guzel-hal.preview.emergentagent.com',
      '.preview.emergentagent.com',
      'localhost',
      '.localhost'
    ],
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