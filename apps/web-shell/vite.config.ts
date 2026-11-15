import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Die Web-Shell spricht nur mit dem Gateway – nie direkt mit Agenten.
    proxy: {'/api': 'http://localhost:8787'},
  },
});
