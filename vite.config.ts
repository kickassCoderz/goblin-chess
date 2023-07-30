import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import rune from 'vite-plugin-rune'

// https://vitejs.dev/config/
export default defineConfig({
    base: '',
    plugins: [react(), rune({ logicPath: './src/logic.ts' })]
})
