import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/sticky-playground/',
  plugins: [react()],
  server: { port: 5175, open: true },
});
