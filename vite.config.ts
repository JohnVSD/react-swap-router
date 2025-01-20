import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path, { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@/': `${resolve(__dirname, 'src')}/`,
      'jsbi': path.resolve(__dirname, '.', 'node_modules', 'jsbi', 'dist', 'jsbi-cjs.js')
    },
  },
})
