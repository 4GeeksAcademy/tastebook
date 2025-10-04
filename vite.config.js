import {
    defineConfig
} from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        // host: true,  // <-- ALWAYS allow access from external hosts (0.0.0.0), applies for both "start and "dev"
        port: 3000
    },
    build: {
        outDir: 'dist'
    }
})

// If you want to only expose to host in only one command, change "package.json":
//
// "scripts": {
//      "start": "vite",
//      "dev":   "vite --host",
//
//      ... (other scripts)