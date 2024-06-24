import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from "vite-plugin-singlefile"
import removeConsole from "vite-plugin-remove-console";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => ['video-js'].includes(tag)    // video-js is custom component
        }
      }
    }),
    viteSingleFile({inlinePattern: ["*.css"]}),
  ],
  build: {
    assetsDir: '.',   // create only one layer of directory structure
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        entryFileNames: "index_entry.js"
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  define: {
    // declare it in env.d.ts, otherwise won't build
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),   // https://vitejs.dev/config/shared-options.html
  },
})
