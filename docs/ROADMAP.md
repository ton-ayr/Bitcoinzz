# ROADMAP: Bitcoinzz v2

> Fases pequenas, cada uma com critérios de aceite.
> Toda fase termina com testes da lógica central passando, sugestão de mensagem de commit (o autor commita manualmente), este arquivo atualizado e uma **pausa para revisão do autor**.
> Requisitos em [PRD.md](PRD.md) · desenho em [ARQUITETURA.md](ARQUITETURA.md).

**Legenda:** ⬜ não iniciada · 🟦 em andamento · 🟨 aguardando revisão · ✅ aprovada

## Visão geral

| # | Fase | Status |
|---|---|---|
| 0 | Documentação | ✅ |
| 1 | Fundação da API em TypeScript | 🟨 |
| 2 | Cadastro e login | 🟨 |
| 3 | Depósito, saldo, perfil e e-mails | ⬜ |
| 4 | Cotação do Mercado Bitcoin | ⬜ |
| 5 | Compra e posição | ⬜ |
| 6 | Venda FIFO com reinvestimento | ⬜ |
| 7 | Extrato e volume | ⬜ |
| 8 | Histórico (job, TTL e backfill) | ⬜ |
| 9 | Swagger e acabamento da API | ⬜ |
| 10 | Fundação do front (Next.js + tema) | ⬜ |
| 11 | BFF, sessão e proteção de rotas | ⬜ |
| 12 | Login e cadastro | ⬜ |
| 13 | Shell e dashboard | ⬜ |
| 14 | Depósito e compra com preview | ⬜ |
| 15 | Venda e extrato | ⬜ |
| 16 | Docker Compose | ⬜ |
| 17 | README e deploy | ⬜ |

**Total:** a Fase 0 (documentação) e mais **17 fases de implementação**.

---

## Fase 0: Documentação
- [x] Decidido trabalhar direto na `main`, com commits feitos manualmente pelo autor.
- [x] `docs/PRD.md`, `docs/ARQUITETURA.md`, `docs/ROADMAP.md` e `CLAUDE.md` escritos.
- [x] Documentos aprovados pelo autor, incluindo as decisões D09–D12 da ARQUITETURA e as regras 6 a 8 do PRD.
- [ ] Commit (autor): `docs: add PRD, architecture, roadmap and CLAUDE.md`.
- [x] **Autor:** mover o `.env` para `backend/.env` e renomear `DB_CONNECTION_STRING` → `MONGODB_URI` (o database atual é mantido).

## Fase 1: Fundação da API em TypeScript
- [x] `package.json` movido para `backend/`, com scripts `dev`, `build`, `start`, `typecheck`, `lint`, `format` e `test`.
- [x] `tsconfig.json` (strict, `nodenext`), ESLint flat + typescript-eslint, Prettier e `vitest.config.ts`.
- [x] `config/env.ts` valida o ambiente com Zod e encerra com mensagem clara se faltar variável.
- [x] `config/logger.ts` (pino, pretty em dev) e `config/database.ts` (conexão + `transactionAsyncLocalStorage`).
- [x] `shared/`: `AppError` e subclasses, `error-handler`, `not-found`, `validate`, `money.ts`, `dates.ts` e `TransactionRunner`.
- [x] `app.ts`, `server.ts`, `container.ts` e `routes.ts`; `GET /health` responde `{ status, database }`.
- [x] Arquivos `.js` da v1 removidos de `backend/`; `.env.example` atualizado.
- [x] **Testes:** `money` (conversões, arredondamento, limites do BigInt) e `dates` (início do dia em SP, slots de 10 min). Também `env` e o app (health, 404, JSON inválido, validação, erros): 47 testes.
- [x] **Aceite:** `lint`, `typecheck`, `test` e `build` passam. A API sobe contra um MongoDB em memória: `/health` 200, rota inexistente 404 no formato padrão, transação executada.
- [ ] **Autor:** corrigir usuário e senha da `MONGODB_URI` no `backend/.env`. O Atlas respondeu `bad auth : Authentication failed`.

## Fase 2: Cadastro e login
- [x] Módulo `users` (model + repository) e módulo `auth` (schemas, service, controller, routes, `PasswordHasher`, `TokenService`).
- [x] `POST /account`: senha com hash bcrypt, e-mail normalizado, 409 para e-mail duplicado (garantido pelo índice único).
- [x] `POST /login`: JWT de 8 h (HS256 fixo) e mensagem genérica; e-mail inexistente também compara um hash, para o tempo de resposta não denunciar quem tem conta.
- [x] Middleware `authenticate` (Bearer → `req.userId`).
- [x] Rate limit: **10 senhas erradas por e-mail a cada 15 min** (decisão do autor) e 30 cadastros por hora por IP.
- [x] **Testes:** unitários do `AuthService` e do `JwtTokenService`; integração com MongoDB em memória para 201, normalização do e-mail, 409, 400 por campo, login 200/401 com a mesma resposta, 429 após 10 erros sem afetar outro e-mail, acertos que não contam e `authenticate` 200/401. 74 testes no total.
- [x] **Aceite:** testes passam; a resposta nunca contém `passwordHash`; smoke test no servidor real (cadastro → login → erro com header `RateLimit`).

## Fase 3: Depósito, saldo, perfil e e-mails
- [ ] Verificar e registrar: transações no Atlas M0 e SMTP do Brevo com Nodemailer.
- [ ] Módulo `account`: `GET /account`, `POST /account/deposit` (transação: `$inc` + lançamento DEPOSIT) e `GET /account/balance`.
- [ ] Módulo `notifications`: interface `Mailer`, `SmtpMailer`, `ConsoleMailer` e `NotificationService`, que envia sem `await` e loga as falhas.
- [ ] **Testes:** limites do valor do depósito, saldo acumulado, lançamento criado, e-mail chamado sem bloquear a resposta (fake), e falha de e-mail que não quebra o depósito.
- [ ] **Aceite:** depósito real no Atlas com o e-mail recebido via Brevo, ou o log no console em dev.

## Fase 4: Cotação do Mercado Bitcoin
- [ ] Verificar e registrar: doc oficial do ticker e os limites de requisição.
- [ ] `MercadoBitcoinClient` (fetch com timeout de 5 s e Zod na resposta) e `QuoteService` (cache de 10 s).
- [ ] `GET /btc/price` → `{ buy, sell, updatedAt }`.
- [ ] **Testes:** parse de strings decimais para centavos, resposta inválida, cache reaproveitado dentro de 10 s e renovado depois, timeout ou erro → 503.
- [ ] **Aceite:** testes passam; a rota responde com a cotação real.

## Fase 5: Compra e posição
- [ ] Módulo `investments`: model, repository, `PurchaseService`, `PositionService`, controller e routes.
- [ ] `POST /btc/purchase`: débito atômico com condição de saldo, Investment, lançamento PURCHASE e e-mail.
- [ ] `GET /btc`: lista dos investimentos OPEN com variação % e valor atual, e um resumo com os totais.
- [ ] **Testes unitários:** saldo insuficiente (422), valor que daria 0 sats (422), arredondamento para baixo dos sats, cálculo da variação e do valor atual.
- [ ] **Teste de integração:** compra → posição → saldo, com a cotação fake.
- [ ] **Aceite:** testes passam; duas compras simultâneas não deixam o saldo negativo.

## Fase 6: Venda FIFO com reinvestimento
- [ ] `SaleService` e `POST /btc/sell` (valor em R$).
- [ ] **Testes unitários:**
  - venda total de 1 investimento;
  - venda que passa por vários investimentos na ordem FIFO;
  - venda parcial que gera REINVESTMENT com a cotação e a data originais, sem perder nem criar BTC;
  - parcial que zera (vira venda total);
  - pedido maior que a posição (422);
  - soma creditada igual ao valor pedido.
- [ ] **Teste de integração:** o extrato contém SALE + REINVESTMENT e o e-mail informa o BTC vendido e o R$ resgatado.
- [ ] **Aceite:** o exemplo da seção 5 do PRD reproduzido num teste com os mesmos números.

## Fase 7: Extrato e volume
- [ ] Módulo `transactions`: `GET /extract` (padrão de 90 dias, `from`/`to`, máximo de 366 dias) e `GET /volume`.
- [ ] **Testes:** intervalo padrão, `from > to` (400), intervalo grande demais (400), filtro só do usuário logado, volume do dia no fuso de SP que ignora REINVESTMENT e outros dias.
- [ ] **Aceite:** testes passam.

## Fase 8: Histórico (job, TTL e backfill)
- [ ] Verificar e registrar: doc do node-cron 4 e dos candles do Mercado Bitcoin.
- [ ] Model `PriceSnapshot` (índice único em `bucket` e TTL de 90 dias em `createdAt`).
- [ ] `HistoryJob` (a cada 10 min e no boot), `BackfillService` (só os slots que faltam nas últimas 24 h) e `GET /history`.
- [ ] **Testes:** cálculo do `bucket`, upsert repetido sem duplicar, backfill que preenche apenas as lacunas, resposta limitada a 24 h e em ordem.
- [ ] **Aceite:** testes passam; com a API rodando, um ponto novo aparece a cada 10 min.

## Fase 9: Swagger e acabamento da API
- [ ] Verificar e registrar: doc do swagger-ui-express.
- [ ] `docs/openapi.yaml` com todas as rotas, schemas, exemplos e bearer auth; `GET /docs` e `GET /`.
- [ ] Graceful shutdown (server, cron e Mongo); revisão de status codes e mensagens.
- [ ] **Aceite:** a coleção Postman oficial roda contra `localhost:3333`; o Swagger permite testar com "Authorize".

## Fase 10: Fundação do front
- [ ] Verificar e registrar: integração MUI 9 + Next 16 (App Router).
- [ ] Remover o `frontend/` da v1 e criar o app Next 16 (TS, App Router, `src/`, ESLint, Vitest).
- [ ] `theme/` com os tokens e overrides da ARQUITETURA 8.4; Providers (MUI, Query, Date Pickers, Toaster, MotionConfig).
- [ ] `lib/format.ts` (R$, ₿, %, datas em pt-BR) e `lib/http.ts` (`ApiError`).
- [ ] **Testes:** `format.ts`.
- [ ] **Aceite:** `npm run dev` mostra uma página com o tema dark/blurple; lint, typecheck e testes passam.

## Fase 11: BFF, sessão e proteção de rotas
- [ ] Verificar e registrar: cookies em Route Handlers e `proxy.ts` no Next 16.
- [ ] `api/auth/login`, `api/auth/register` (login automático), `api/auth/logout` e `api/[...path]` com allowlist.
- [ ] Cookie httpOnly de 8 h; 401 da API apaga o cookie; timeout longo para a API "acordando".
- [ ] `proxy.ts` redireciona conforme o cookie.
- [ ] **Testes:** allowlist (bloqueia rotas fora dela), montagem do header `Authorization`, tratamento de 401.
- [ ] **Aceite:** sem cookie, `/dashboard` vai para `/login`.

## Fase 12: Login e cadastro
- [ ] Layout `(auth)` com hero e brilho blurple animado.
- [ ] `LoginForm` e `RegisterForm` (RHF + Zod, mostrar/ocultar senha, botão com loading); pré-aquecimento da API ao abrir a tela.
- [ ] Estado "Acordando o servidor…" visível quando a API demora.
- [ ] **Testes:** mensagens de validação e regra de senha.
- [ ] **Aceite:** cadastro → já entra logado no dashboard; login com erro mostra a mensagem genérica.

## Fase 13: Shell e dashboard
- [ ] Sidebar (desktop) e drawer (mobile), indicador animado do menu ativo, saudação com o nome e logout.
- [ ] Cards de Saldo, Cotação ("ao vivo"), Volume do dia e Investido × Valor atual.
- [ ] Gráfico de 24 h (compra × venda; pontos de backfill sinalizados) e tabela de posições.
- [ ] Skeletons, estados de erro e de vazio.
- [ ] **Testes:** cálculos e formatações exibidos (variação, totais).
- [ ] **Aceite:** dados reais na tela, que se atualizam sozinhos.

## Fase 14: Depósito e compra com preview
- [ ] `MoneyField` (máscara R$), chips de valor rápido e `ConfirmDialog`.
- [ ] Compra: preview ao vivo (cotação de venda, BTC estimado, saldo depois da compra) → confirmação → toast.
- [ ] **Testes:** cálculo do preview e limite pelo saldo.
- [ ] **Aceite:** depósito e compra atualizam o dashboard sem recarregar a página.

## Fase 15: Venda e extrato
- [ ] Venda em R$ com preview (BTC estimado), limite pelo valor da posição e explicação de FIFO e reinvestimento.
- [ ] Extrato: DatePickers de/até (padrão de 90 dias), chips 7/30/90 d e tabela com chips por tipo.
- [ ] **Testes:** preview da venda e montagem do intervalo de datas.
- [ ] **Aceite:** a venda parcial aparece no extrato como Venda + Reinvestimento.

## Fase 16: Docker Compose
- [ ] Dockerfiles multi-stage (`node:24-alpine`, usuário não-root) e `.dockerignore`.
- [ ] `docker-compose.yml`: `mongo:8` com replica set e healthcheck, `api` e `web`.
- [ ] **Aceite:** `docker compose up --build` sobe tudo e o fluxo completo funciona em `localhost:3000`. Exige Docker Desktop; **decisão do autor** sobre instalar.

## Fase 17: README e deploy
- [ ] Verificar e registrar: configuração atual do Render e da Vercel.
- [ ] README: visão geral, como rodar no Linux (Docker e manual), variáveis, arquitetura, decisões de negócio, API e testes.
- [ ] Checklist de deploy (Render, Vercel, Atlas e Brevo), executado pelo **autor** nos painéis.
- [ ] **Aceite:** smoke test em produção (cadastro → depósito → compra → venda → extrato) e e-mail recebido.

---

## Log de progresso

| Data | Fase | Evento |
|---|---|---|
| 06/10/2026 | 0 | Duas rodadas de perguntas respondidas; documentos escritos e aguardando aprovação |
| 06/10/2026 | 0 | Decidido: database atual mantido; trabalho direto na `main`; commits manuais pelo autor |
| 06/10/2026 | 0 | Documentos aprovados pelo autor |
| 06/10/2026 | 1 | Fundação da API concluída (47 testes); aguardando revisão. Login no Atlas falhou por credencial |
| 06/10/2026 | 2 | Autor pediu para seguir; commits e acesso ao Atlas ficam para depois. Decidido rate limit por e-mail |
| 06/10/2026 | 2 | Cadastro e login concluídos (74 testes); aguardando revisão |
