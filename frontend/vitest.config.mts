import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    // Padrão: Node. Testes de componente pedem o navegador simulado com
    // o comentário `// @vitest-environment jsdom` no topo do arquivo.
    environment: 'node',
  },
});
