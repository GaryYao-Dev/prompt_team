import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { resolve } from 'path'
import svgr from 'vite-plugin-svgr'
import { codeInspectorPlugin } from 'code-inspector-plugin'
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    svgr(),
    codeInspectorPlugin({
      bundler: 'vite',
      editor: 'code',
    }),
  ],
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@shared/utils': resolve(__dirname, '../../packages/utils/src'),
      '@shared/types': resolve(__dirname, '../../packages/types/src'),
    },
  },
})
