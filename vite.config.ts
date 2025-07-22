import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': 'process.env'
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    rollupOptions: {
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
    exclude: ['lucide-react']
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