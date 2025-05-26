import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
    esbuildOptions: {
      target: 'esnext',
      supported: { 
        'top-level-await': true 
      },
      logLimit: 0,
      tsconfigRaw: {
        compilerOptions: {
          experimentalDecorators: true,
        },
      },
    }
  },
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    hmr: {
      timeout: 30000,
      protocol: 'ws',
      host: 'localhost',
      clientPort: 3000
    }
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'PLUGIN_WARNING') return;
        warn(warning);
      }
    },
    sourcemap: true,
    commonjsOptions: {
      transformMixedEsModules: true
    }
  }
});