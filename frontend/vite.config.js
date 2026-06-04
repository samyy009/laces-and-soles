import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      }
    }
  },
  build: {
    sourcemap: false,          // Smaller production bundle
    cssCodeSplit: true,        // CSS only loads for the page being viewed
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React — cached across all pages
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // UI libraries — only download once, reused everywhere
          'vendor-ui': ['lucide-react', 'react-toastify', 'framer-motion'],
          // Auth & OAuth — only loaded on login/register
          'vendor-auth': ['@react-oauth/google', 'js-cookie'],
          // Socket & Axios — loaded once, shared
          'vendor-net': ['axios', 'socket.io-client'],
        }
      }
    }
  }
});
