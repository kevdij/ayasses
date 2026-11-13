import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// « npm run build » produit le dossier www/ : c'est lui qu'on copie sur le serveur.
// En développement, les appels /api sont transmis au serveur PHP local (npm run php).
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'www',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8787',
    },
  },
});
