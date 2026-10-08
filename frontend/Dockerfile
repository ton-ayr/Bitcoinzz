# Front (Next.js) em 3 estágios. Com `output: 'standalone'`, o build gera um servidor enxuto
# (server.js) que leva só os arquivos de node_modules que as páginas realmente usam.

# 1) Dependências (todas: o build precisa do TypeScript)
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2) Build
FROM node:24-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 3) Imagem final: servidor standalone + arquivos estáticos (o server.js não os copia sozinho)
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
