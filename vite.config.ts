import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 3000,
    strictPort: false, // Allow Vite to try other ports if 3000 is in use
    host: true, // Listen on all network interfaces
    hmr: {
      timeout: 5000 // Increase HMR timeout for better stability
    }
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress certain warnings if needed
        if (warning.code === 'PLUGIN_WARNING') return;
        warn(warning);
      }
    }
  }
});