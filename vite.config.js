import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/lucky11/', // <-- AGREGA ESTO CON EL NOMBRE EXACTO DE TU REPOSITORIO
})
