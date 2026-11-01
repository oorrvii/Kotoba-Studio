import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  define: { 'import.meta.env.VITE_BUILD_ID': JSON.stringify(String(Date.now())) },
})
