import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Die Web-Shell spricht nur mit dem Gateway – nie direkt mit Agenten.
    proxy: {'/api': 'http://localhost:8787'},
  },
  build: {
    rolldownOptions: {
      output: {
        // Abhängigkeiten in eigene Chunks: Sie ändern sich selten und bleiben so im Browser-Cache,
        // wenn sich nur der App-Code ändert. Katalog und Renderer werden beim Start gebraucht,
        // deshalb hier kein Lazy-Loading.
        codeSplitting: {
          groups: [
            {name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 30},
            {name: 'a2ui', test: /node_modules[\\/](@a2ui|lit|lit-html|lit-element|@lit|@preact)[\\/]/, priority: 20},
            {name: 'vendor', test: /node_modules[\\/]/, priority: 10},
          ],
        },
      },
    },
  },
});
