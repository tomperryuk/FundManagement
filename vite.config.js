import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const gloss = (f) => fileURLToPath(new URL(`./src/gloss/${f}`, import.meta.url))

// A custom JSX runtime adds hover explanations for glossary and technology terms in page text.
export default defineConfig({
  plugins: [react({ jsxImportSource: 'gloss' })],
  resolve: { alias: [
    { find: 'gloss/jsx-runtime', replacement: gloss('jsx-runtime.js') },
    { find: 'gloss/jsx-dev-runtime', replacement: gloss('jsx-dev-runtime.js') },
  ] },
})
