import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' so the build works on GitHub Pages under /my-jasoseo/ as well as at a root domain.
export default defineConfig({
  base: './',
  plugins: [react()],
});
