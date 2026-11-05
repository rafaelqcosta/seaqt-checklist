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

// `gap` em flex só existe no Chrome 84+ (e `gap` em grid no 66+): na TV (Chrome 63) os itens ficam
// colados. Grid ganha `grid-gap`; flex ganha margem entre irmãos, ativada pela classe `sem-flex-gap`
// que o index.html põe no <html> quando o navegador não suporta. Filhos com margem própria
// (ml-auto, mt-auto...) mantêm a sua.
const PREFIXOS_MARGEM = { left: ['m-', 'mx-', 'ml-'], top: ['m-', 'my-', 'mt-'] }
function semMargemPropria(lado: 'left' | 'top') {
  return PREFIXOS_MARGEM[lado].map((prefixo) => `:not([class^="${prefixo}"]):not([class*=" ${prefixo}"])`).join('')
}
const fallbackFlexGap = {
  postcssPlugin: 'fallback-flex-gap',
  Rule(regra: import('postcss').Rule) {
    if (regra.selector.includes('sem-flex-gap') || !/^\.[\w\\.:-]+$/.test(regra.selector)) return
    const valores: { gap?: string; 'column-gap'?: string; 'row-gap'?: string } = {}
    regra.walkDecls(/^(gap|column-gap|row-gap)$/, (declaracao) => {
      valores[declaracao.prop as keyof typeof valores] = declaracao.value
      declaracao.cloneBefore({ prop: `grid-${declaracao.prop}` })
    })
    const horizontal = valores['column-gap'] ?? valores.gap
    const vertical = valores['row-gap'] ?? valores.gap
    const irmaos = (direcao: string, lado: 'left' | 'top') => `.sem-flex-gap ${direcao}${regra.selector} > * + *${semMargemPropria(lado)}`
    const novaRegra = (seletor: string, propriedade: string, valor: string) =>
      regra.clone({ selector: seletor, nodes: [] }).append({ prop: propriedade, value: valor })
    // ordem importa: em .flex-col (que também tem .flex) a margem de cima substitui a da esquerda
    const extras = []
    if (horizontal) extras.push(novaRegra(`${irmaos('.flex', 'left')}, ${irmaos('.inline-flex', 'left')}`, 'margin-left', horizontal))
    if (vertical) extras.push(novaRegra(irmaos('.flex-col', 'left'), 'margin-left', '0'), novaRegra(irmaos('.flex-col', 'top'), 'margin-top', vertical))
    regra.after(extras)
  },
}

const navegadoresAntigos =['chrome >= 47', 'safari >= 10', 'firefox >= 60']

// base relativa: funciona no GitHub Pages (/seaqt-checklist/) e em qualquer outro host estático
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), legacy({ targets: navegadoresAntigos })],
  // @layer (Tailwind v4) só existe no Chrome 99+; antes disso o navegador descarta todo o CSS
  css: { postcss: { plugins: [fallbackPropertySempre, fallbackFlexGap, cascadeLayers()] } },
  build: { cssTarget: ['chrome47', 'safari10', 'firefox60'] },
})
