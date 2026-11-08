import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ base: '/spectrum_club/', plugins:[react()], build:{ chunkSizeWarningLimit:1200 } })
