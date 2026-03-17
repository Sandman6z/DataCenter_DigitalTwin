import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three')) {
              return 'three';
            }
            if (id.includes('echarts')) {
              return 'echarts';
            }
            if (id.includes('socket.io')) {
              return 'socket.io';
            }
            if (id.includes('vue')) {
              return 'vue-vendor';
            }
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1500
  },
  optimizeDeps: {
    include: ['three', 'echarts', 'socket.io-client']
  }
})
