import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 3001, // Changed from 3000 to avoid potential conflicts
    strictPort: true, // Force the specified port
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