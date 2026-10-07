import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Cache Components (estável no Next 16; será o padrão na próxima versão principal):
  // a página tem uma "casca" estática servida na hora e o conteúdo dinâmico chega em streaming.
  cacheComponents: true,
  partialPrefetching: true,
  // Gera um servidor enxuto em .next/standalone (usado na imagem Docker da Fase 16).
  output: 'standalone',
};

export default nextConfig;
