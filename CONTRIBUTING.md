# Contribuindo

Guia para desenvolver e manter o Bitcoinzz. Para rodar o projeto, veja o [README](README.md); para entender como ele é montado, a [arquitetura](docs/architecture.md).

## Ambiente

- Node.js 24 (versão em [`.nvmrc`](.nvmrc)) e npm.
- MongoDB com replica set (o Atlas M0 serve) ou Docker, para subir tudo com `docker compose up --build`.
- Variáveis: copie `backend/.env.example` para `backend/.env` e `frontend/.env.example` para `frontend/.env.local`. Nunca versione arquivos `.env`.

## Scripts

Os mesmos nas duas pastas (`backend/` e `frontend/`):

| Comando | O que faz |
|---|---|
| `npm run dev` | API em http://localhost:3333 · admin em http://localhost:3000 |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript sem gerar arquivos |
| `npm test` | Vitest (a API sobe um MongoDB em memória; o primeiro uso baixa o binário) |
| `npm run build` | Build de produção |
| `npm run format` | Prettier |

## Convenções

**Gerais**
- Código, rotas e campos do banco em **inglês**; textos para o usuário (telas, e-mails e mensagens de erro) em **pt-BR**.
- TypeScript strict, fixado em **6.0.x** enquanto o typescript-eslint não suportar o 7.
- Dinheiro sempre em inteiros: **centavos** (R$) e **satoshis** (BTC). Conversões em `backend/src/shared/money.ts` e `frontend/src/lib/money.ts`; nunca usar `toFixed` para calcular.
- Datas de negócio no fuso `America/Sao_Paulo`.

**API (`backend/`)**
- Camadas `routes → controller → service → repository`: controller sem regra de negócio; só o repository importa o Mongoose; dependências pelo construtor, montadas em `src/container.ts`.
- Services lançam `AppError`; a resposta de erro é sempre `{ statusCode, message, details? }`.
- Toda entrada é validada com Zod; operações financeiras rodam no `TransactionRunner`.
- Imports relativos com extensão `.js` (ESM `nodenext`).
- Mudou uma rota? Atualize `docs/openapi.yaml`: o teste de contrato falha se a doc e as rotas divergirem.

**Admin (`frontend/`)**
- Visual dark + vidro + blurple, só com os tokens de `src/theme/tokens.ts`.
- Todo grupo de cards ou botões usa `FocusGroup` + `className={FOCUS_ITEM}`; nada de brilho seguindo o mouse.
- O navegador só fala com o BFF (`/api/*`). Uma rota nova da API só fica acessível depois de entrar na allowlist de `src/server/bff.ts`.
- Prévias (compra, venda) seguem as mesmas regras e mensagens da API e têm testes com os mesmos casos.

## Testes

- Toda regra de negócio nova ou alterada vem com teste: unitário no service (com fakes) e, quando envolve banco ou HTTP, de integração (`backend/tests/integration`).
- No front, lógica pura em `*.test.ts` e telas com Testing Library (`// @vitest-environment jsdom`).
- O CI roda em UTC: não dependa do fuso da máquina (use os utilitários de data com `America/Sao_Paulo`).

## Commits e pull requests

- Mensagens no padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/): `feat(api): ...`, `fix(web): ...`, `docs: ...`, `test: ...`, `chore: ...`.
- Antes de abrir o PR, nas duas pastas: `npm run lint && npm run typecheck && npm test && npm run build`. O CI repete isso, e o Render só publica a API com ele verde.
- Mexeu numa integração externa (Mercado Bitcoin, Atlas, Render, Vercel, Brevo)? Confira a documentação oficial atual e atualize a tabela [Integrações externas](docs/architecture.md#integrações-externas).
- Mudanças de custo ou de segurança, ou difíceis de desfazer, precisam de alinhamento antes da implementação. O projeto só usa planos gratuitos sem prazo.

## Dependências

- Atualize com `npm outdated` e rode a suíte completa depois.
- Confira `npm audit --omit=dev` (dependências de produção).
- TypeScript continua em 6.0.x até o typescript-eslint suportar a versão 7.
