import {
    defineConfig
} from 'vite'

import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        // Enable network access for dev containers
        host: '0.0.0.0'
    },
    build: {
        outDir: 'dist'
    },
    css: {
        preprocessorOptions: {
            scss: {
                // Suppress Sass deprecation warnings from Bootstrap and dependencies
                quietDeps: true,
                // Suppress specific deprecation warnings
                silenceDeprecations: [
                    'import',
                    'global-builtin', 
                    'color-functions'
                ]
            }
        }
    }
})