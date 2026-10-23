import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative base: works when opening dist/index.html locally and on GitHub Pages
  base: process.env.BASE_PATH || './',
})
