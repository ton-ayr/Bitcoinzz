# API do Bitcoinzz em 3 estágios (multi-stage): a imagem final leva só o JavaScript compilado
# e as dependências de produção, sem TypeScript, testes nem ferramentas de build.

# 1) Build: instala tudo e compila o TypeScript para dist/
FROM node:24-alpine AS build
WORKDIR /app
# O mongodb-memory-server (só dos testes) não precisa baixar o binário do MongoDB aqui.
ENV MONGOMS_DISABLE_POSTINSTALL=1
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

# 2) Dependências de produção (sem as de desenvolvimento)
FROM node:24-alpine AS deps
WORKDIR /app
ENV MONGOMS_DISABLE_POSTINSTALL=1
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# 3) Imagem final
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
# O Swagger (/docs) lê a spec em tempo de execução.
COPY docs ./docs
# Usuário sem privilégios de administrador (já existe na imagem oficial do Node).
USER node
EXPOSE 3333
# Forma "exec": o Node recebe o SIGTERM do `docker compose down` e encerra com calma.
CMD ["node", "dist/server.js"]
