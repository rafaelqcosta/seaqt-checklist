import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base relativa: funciona no GitHub Pages (/seaqt-checklist/) e em qualquer outro host estático
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
