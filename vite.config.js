import { defineConfig } from 'vite'

export default defineConfig({
    //define: { global: {} },
    base: process.env.NODE_ENV === 'production' ? '/hydra/' : '',
    define: {
        'process.env': {},
        // 'global.window': 'window'
        // global: {}
    },
    optimizeDeps: {
        esbuildOptions: {
            define: {
                global: 'globalThis'
            }
        }
    }
})