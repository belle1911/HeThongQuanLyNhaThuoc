import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  define: {
    'process.env.NEXT_PUBLIC_SUPABASE_URL': 'undefined',
    'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': 'undefined',
  },
  build: { outDir: '../PharmaSoft.Web/wwwroot', emptyOutDir: true },
  server: { port: 5173, proxy: { '/api': 'http://localhost:5000' } },
})
