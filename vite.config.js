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
            // enable polling only for dev (e.g., in container/host mounts)
            // bind mount inotify issues between Windows/WSL and Linux containers
            usePolling: true, // <-- enable polling so FS changes on host are detected
            interval: 800     // check every 300ms (adjust if noisy)
        },

        hmr: {
            clientPort: 3000 // Often more reliable than setting host
            // host: 'localhost' // This works if accessing via localhost, ensures HMR websocket connects back to host
            // BUT if accessing via container IP, this should match how you access the app
        }
    },


    build: {
        outDir: 'dist'
    }

})