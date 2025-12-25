import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Custom plugin to dynamic HMR port
const hmrPortFix = () => {
  return {
    name: 'hmr-port-fix',
    transform(code, id) {
      if (id.includes('vite/dist/client/client.mjs')) {
        // Replace hardcoded port with location.port to support both HTTP (5173) and HTTPS (443/Cloudflare)
        // Handle default ports (80/443) where location.port is empty
        return code.replace(/const socketPort = \d+/, "const socketPort = location.port || (location.protocol === 'https:' ? '443' : '80')");
      }
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), hmrPortFix()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: parseInt(process.env.PORT) || 5173, // Allow port configuration via env
    // Remove hardcoded clientPort to support both local (5173) and Cloudflare (443)
    // We will use a plugin to dynamically set the port
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: '../service/public',
    emptyOutDir: true,
  }
})
