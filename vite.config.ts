import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
    esbuildOptions: {
      target: 'es2020',
      supported: { 
        'top-level-await': true 
      },
      maxWorkers: 1, // Limit concurrent operations
    }
  },
  server: {
    port: 3000,
    strictPort: false,
    host: true,
    hmr: {
      timeout: 10000
    }
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'PLUGIN_WARNING') return;
        warn(warning);
      }
    },
    target: 'es2020',
    sourcemap: true,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000, // Increase chunk size limit
  },
  esbuild: {
    logLevel: 'info',
    target: 'es2020',
    treeShaking: true,
    legalComments: 'none',
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
  }
});