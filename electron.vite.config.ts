import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  main: {
    build: {
      outDir: 'out/main',
      rollupOptions: {
        external: ['electron', 'electron-store']
      }
    }
  },
  preload: {
    build: {
      outDir: 'out/preload',
      rollupOptions: {
        external: ['electron']
      }
    }
  },
  renderer: {
    root: 'src/renderer',
    build: {
      outDir: 'out/renderer'
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/renderer')
      }
    }
  }
})
