import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import legacy from '@vitejs/plugin-legacy'
import cascadeLayers from '@csstools/postcss-cascade-layers'

// Navegadores de TV (Samsung Tizen, LG webOS) rodam Chromium antigo: sem o build legado o JS
// moderno nem executa e a página fica em branco.
// O Tailwind só aplica os valores iniciais das variáveis --tw-* (sombras, anéis) no Safari/Firefox
// sem @property; no Chromium antigo da TV elas ficam indefinidas. Aplicar sempre é inofensivo.
const fallbackPropertySempre = {
  postcssPlugin: 'fallback-property-sempre',
  AtRule: {
    supports(regra: import('postcss').AtRule) {
      if (regra.params.includes('margin-trim')) regra.replaceWith(regra.nodes ?? [])
    },
  },
}

const navegadoresAntigos = ['chrome >= 63', 'safari >= 12', 'firefox >= 68']

// base relativa: funciona no GitHub Pages (/seaqt-checklist/) e em qualquer outro host estático
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), legacy({ targets: navegadoresAntigos })],
  // @layer (Tailwind v4) só existe no Chrome 99+; antes disso o navegador descarta todo o CSS
  css: { postcss: { plugins: [fallbackPropertySempre, cascadeLayers()] } },
  build: { cssTarget: ['chrome63', 'safari12', 'firefox68'] },
})
