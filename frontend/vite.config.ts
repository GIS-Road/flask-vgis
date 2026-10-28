import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import createSvgIconsPlugin from './vite/plugins/svg-icon.js'
import path from 'node:path'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
    createSvgIconsPlugin(),
  ],
  server: {
    host: true,
    port: 8998,
    open: true,
    proxy: {
      '/dev-api': {
        target: 'http://localhost:8000',
        // target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/dev-api/, ''),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
    tsconfigPaths: true,
    extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.json', '.vue'],
  },
})
