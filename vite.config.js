import {
    defineConfig
} from 'vite'

import react from '@vitejs/plugin-react'

export default defineConfig({

    plugins: [react()],

    server: {

        host: true,  // <-- listen on 0.0.0.0 so host can reach dev server, allow access from external hosts (0.0.0.0), applies for both "start and "dev"
        
        port: 3000,

        watch: {
            // Polling can be expensive. Keep the current behavior as the default
            // (true) to avoid changing any developer workflows. Make it configurable
            // via the FORCE_POLLING env var so container/host setups can opt-in/out.
            // Accepted values for FORCE_POLLING: "1", "true", "0", "false".
            usePolling: (function(){
                const env = process.env.FORCE_POLLING;
                if (env === undefined) return true; // preserve current default
                return env === '1' || env === 'true';
            })(),
            // Poll interval (ms) when polling is enabled. Adjust if noisy.
            interval: 800
        },

        hmr: {
            clientPort: 3000 // Often more reliable than setting host
            // host: 'localhost' // This works if accessing via localhost, ensures HMR websocket connects back to host
            // BUT if accessing via container IP, this should match how you access the app
        }
    },

    css: {
        preprocessorOptions: {
            scss: {
                // Suppress Sass deprecation warnings from Bootstrap and other dependencies
                quietDeps: true,
                // Suppress specific deprecation warnings
                silenceDeprecations: [
                    'import',
                    'global-builtin',
                    'color-functions'
                ]
            }
        }
    },

    build: {
        outDir: 'dist'
    }

})