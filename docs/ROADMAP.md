# ROADMAP: Bitcoinzz v2

> Fases pequenas, cada uma com critérios de aceite.
> Toda fase termina com testes da lógica central passando, sugestão de mensagem de commit (o autor commita manualmente), este arquivo atualizado e uma **pausa para revisão do autor**.
> Requisitos em [PRD.md](PRD.md) · desenho em [ARQUITETURA.md](ARQUITETURA.md).

**Legenda:** ⬜ não iniciada · 🟦 em andamento · 🟨 aguardando revisão · ✅ aprovada

## Visão geral

| # | Fase | Status |
|---|---|---|
| 0 | Documentação | ✅ |
| 1 | Fundação da API em TypeScript | ✅ |
| 2 | Cadastro e login | ✅ |
| 3 | Depósito, saldo, perfil e e-mails | ✅ |
| 4 | Cotação do Mercado Bitcoin | 🟨 |
| 5 | Compra e posição | ✅ |
| 6 | Venda FIFO com reinvestimento | ✅ |
| 7 | Extrato e volume | ✅ |
| 8 | Histórico (job, TTL e backfill) | ✅ |
| 9 | Swagger e acabamento da API | ✅ |
| 10 | Fundação do front (Next.js + tema) | ✅ |
| 11 | BFF, sessão e proteção de rotas | ✅ |
| 12 | Login e cadastro | ✅ |
| 13 | Shell e dashboard | ✅ |
| 14 | Depósito e compra com preview | ✅ |
| 15 | Venda e extrato | ✅ |
| 16 | Docker Compose | 🟨 |
| 17 | README e deploy | ⬜ |

**Total:** a Fase 0 (documentação) e mais **17 fases de implementação**.

## Pendências do autor

| # | Pendência | Bloqueia |
|---|---|---|
| ~~A1~~ | ✅ `MONGODB_URI` corrigida; API testada contra o Atlas (MongoDB 8.0.34, database `carteira`) | – |
| A2 | ✅ Decidido: o Render fica **fora do ar até a Fase 17**. Opcional: desligar o auto-deploy no painel, para cada push não gerar um build com falha | – |
| A3 | (Opcional, quando quiser) Conta grátis no Brevo + remetente verificado + SMTP key no `.env` | E-mail real (até lá, sai no console) |
| ~~A4~~ | ✅ Commits consolidados até a Fase 11 (`de8bb7e`). Daqui em diante, o autor commita quando quiser (prefere commits maiores) | – |
| ~~A5~~ | ✅ `PORT=3333` no `backend/.env` | – |
| A6 | (Opcional) Apagar o `package-lock.json` solto em `C:/Users/ayrto` (o build do Next avisa que o ignora) e, se quiser, desligar a telemetria anônima do Next: `npx next telemetry disable` | – |
| A7 | Para usar o Docker: copiar `.env.example` para `.env` **na raiz** e preencher o `JWT_SECRET` (gerar com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) | `docker compose up` (sem ele, o compose recusa subir) |

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
- [x] **Autor:** corrigir a `MONGODB_URI` no `backend/.env` (resolvido na revisão geral).

## Fase 2: Cadastro e login
- [x] Módulo `users` (model + repository) e módulo `auth` (schemas, service, controller, routes, `PasswordHasher`, `TokenService`).
- [x] `POST /account`: senha com hash bcrypt, e-mail normalizado, 409 para e-mail duplicado (garantido pelo índice único).
- [x] `POST /login`: JWT de 8 h (HS256 fixo) e mensagem genérica; e-mail inexistente também compara um hash, para o tempo de resposta não denunciar quem tem conta.
- [x] Middleware `authenticate` (Bearer → `req.userId`).
- [x] Rate limit: **10 senhas erradas por e-mail a cada 15 min** (decisão do autor) e 30 cadastros por hora por IP.
- [x] **Testes:** unitários do `AuthService` e do `JwtTokenService`; integração com MongoDB em memória para 201, normalização do e-mail, 409, 400 por campo, login 200/401 com a mesma resposta, 429 após 10 erros sem afetar outro e-mail, acertos que não contam e `authenticate` 200/401. 74 testes no total.
- [x] **Aceite:** testes passam; a resposta nunca contém `passwordHash`; smoke test no servidor real (cadastro → login → erro com header `RateLimit`).

## Fase 3: Depósito, saldo, perfil e e-mails
- [x] Verificado e registrado: SMTP do Brevo com Nodemailer e transações no Atlas M0 (não listadas como "não suportadas"; o M0 é um replica set de 3 nós).
- [x] Confirmação prática da transação no Atlas M0: depósito com transação executado com sucesso (dados do teste removidos depois).
- [x] Módulo `account`: `GET /account`, `POST /account/deposit` (transação: `$inc` + lançamento DEPOSIT) e `GET /account/balance`.
- [x] Módulo `notifications`: interface `Mailer`, `SmtpMailer` (timeouts curtos), `ConsoleMailer`, `createMailer` e `NotificationService` (envia sem `await` e loga falhas). Template HTML com o tema blurple e nome escapado contra injeção de HTML.
- [x] Módulo `transactions` (model + `create`) e limite de 300 req / 15 min por usuário nas rotas logadas.
- [x] **Testes:** limites do valor (0, negativo, 3 casas, acima de R$ 1 milhão, texto), saldo acumulado sem erro de ponto flutuante (87,5 + 0,1 = 87,6), lançamentos DEPOSIT, e-mail com o valor, envio que não bloqueia, falha de e-mail que não quebra, **rollback** (se o extrato falhar, o saldo não muda e nenhum e-mail sai), 401 sem token. 100 testes no total.
- [x] **Aceite:** depósito real no Atlas (201, saldo e lançamento DEPOSIT corretos). E-mail validado no console; o envio real pelo Brevo fica para quando o autor criar a conta (pendência A3, opcional).

## Fase 4: Cotação do Mercado Bitcoin
- [x] Verificado e registrado: spec OpenAPI oficial da API v4 (`/tickers`, `/candles`, limite de 1 req/s por endpoint e 500/min no total). A URL v3 do desafio não consta mais na doc.
- [x] Decisão do autor: usar o endpoint **v4 documentado** (`/api/v4/tickers?symbols=BTC-BRL`).
- [x] `MercadoBitcoinClient` (fetch com timeout de 5 s; resposta validada com Zod; preços em texto convertidos para centavos sem ponto flutuante) e `QuoteService` (cache de 10 s; chamadas simultâneas compartilham uma requisição; erro não fica em cache).
- [x] `GET /btc/price` → `{ buy, sell, updatedAt }` (exige login).
- [x] Erros 5xx "esperados" (ex.: 503 da cotação) agora também são logados, com a causa original.
- [x] **Testes:** conversão do formato real da resposta; 503 para HTTP 500/429, HTML, lista vazia, outro par, preço inválido ou zero e falha de rede; cache dentro e fora dos 10 s; chamadas simultâneas; erro não cacheado; rota 401/200/503. 119 testes no total.
- [x] **Aceite:** cotação real obtida pela rota (198 ms na primeira chamada; 10 ms na segunda, vinda do cache).

## Fase 5: Compra e posição
- [x] Módulo `investments`: model (índice `userId + status + purchasedAt`), repository, `PurchaseService`, `PositionService`, controller e routes.
- [x] `POST /btc/purchase`: converte pela cotação de **venda**, com sats arredondados para baixo. Numa transação: débito atômico condicionado ao saldo (`findOneAndUpdate` com `balanceCents >= valor`), investimento e lançamento PURCHASE. Depois, e-mail com o R$ investido e o BTC comprado.
- [x] `GET /btc`: investimentos OPEN com data, valor investido, cotação na compra, variação % e valor bruto atual (pela cotação de **compra**), mais um resumo. Sem investimentos, não consulta a cotação.
- [x] Schema de valor em R$ compartilhado (`shared/validation.ts`), com teto técnico de R$ 100 bilhões.
- [x] **Testes unitários:** cotação de venda, arredondamento (R$ 100 a R$ 300.000 = 33.333 sats), saldo inteiro, 422 com o saldo disponível, valor que não compra 1 sat, 503 sem mexer no saldo, e-mail; posição com o exemplo do PRD (+25%), variação negativa, resumo de vários investimentos, só OPEN do próprio usuário, posição vazia sem chamar a cotação.
- [x] **Testes de integração:** fluxo depósito → compra (exemplo Postman `amount: 25`) → posição → saldo → extrato; 400/401/422; **5 compras simultâneas com saldo para 1 → exatamente 1 aprovada e saldo nunca negativo** (repetido 5×, estável); rollback se gravar o investimento falhar. 143 testes no total.
- [x] **Aceite:** fluxo completo com o Atlas e a cotação reais (dados de teste removidos).

## Fase 6: Venda FIFO com reinvestimento
- [x] `SaleService` e `POST /btc/sell` (valor em R$, cotação de **compra**).
  - Separação "planejar e depois gravar": `planSale()` só calcula; a gravação acontece numa transação.
  - Investimentos lidos **dentro** da transação: vendas simultâneas são refeitas pelo MongoDB com os dados novos.
  - Parcial: vende `ceil(restante / preço)` sats, encerra o investimento e cria o REINVESTMENT com a sobra, mantendo a cotação **e a data** originais (o lugar na fila FIFO). Se o arredondamento consumir tudo, não há reinvestimento.
  - Resposta com `reinvestment: null` quando não houve reinvestimento (formato estável para o front).
- [x] **Testes unitários:**
  - exemplo do PRD com os mesmos números (R$ 600 → 0,0012 BTC vendido, 0,0008 reinvestido a R$ 400.000, R$ 320);
  - venda exata sem reinvestimento;
  - FIFO pela data de compra (não pela ordem de cadastro);
  - 6 valores de borda provando **crédito = valor pedido** e **BTC conservado**;
  - arredondamento que consome tudo;
  - 422 acima da posição (com o máximo disponível) e sem investimentos;
  - outros usuários intocados; 503; e-mail.
- [x] **Testes de integração:** venda parcial refletida na posição (cotação e data originais), no saldo e no extrato (DEPOSIT → PURCHASE → SALE → REINVESTMENT); venda total; 400/401/422; **2 vendas simultâneas que somadas excedem a posição → uma 201 e uma 422** (repetido 5×, estável); rollback se o extrato falhar. 165 testes no total.
- [x] **Aceite:** exemplo do PRD reproduzido em teste; fluxo real no Atlas com a cotação real (BTC conservado: 0,00070225 vendido + 0,00117040 reinvestido = 0,00187265 comprado).

## Fase 7: Extrato e volume
- [x] `GET /extract?from&to`: padrão dos últimos 90 dias; só `from` → até hoje; só `to` → os 90 dias anteriores; datas em AAAA-MM-DD no horário de São Paulo, incluindo o dia inteiro das duas pontas; máximo de 366 dias. Resposta `{ from, to, transactions }`, do mais recente para o mais antigo, com tipo, valor, BTC e cotação (`null` em depósitos).
- [x] `GET /volume`: BTC comprado e vendido **na plataforma** no dia corrente (SP), via aggregate; reinvestimentos não entram.
- [x] **Testes unitários:** período padrão e customizado, só `from`, só `to`, `from > to`, limite de 366 dias; volume com bordas de meia-noite em SP, ignorando REINVESTMENT e o dia anterior.
- [x] **Testes de integração:** extrato após depósito → compra → venda (4 lançamentos na ordem certa); lançamento de 100 dias atrás fora do padrão e dentro do intervalo customizado; isolamento entre clientes; 4 casos de 400; volume somando dois clientes e ignorando reinvestimento e compra de ontem. 183 testes no total.
- [x] **Aceite:** extrato e volume reais no Atlas; data inválida responde 400 com mensagem por campo.

## Fase 8: Histórico (job, TTL e backfill)
- [x] Verificado e registrado: API do node-cron 4; teste prático do `/candles` (só há candle nos minutos com negociação; `from`/`to` de 27 h funciona); índice único + TTL no mesmo campo aceito pelo MongoDB.
- [x] Model `PriceSnapshot` com **um índice** `{ bucket }` único **e** TTL de 90 dias: sem duplicar slots e expurgo automático contado a partir do horário da cotação.
- [x] `HistoryService`:
  - `collectCurrent`: grava o slot atual com a cotação de compra/venda; idempotente com `$setOnInsert` + upsert;
  - `backfillMissing`: preenche só os slots vazios das últimas 24 h com o último candle fechado antes de cada horário (`source: BACKFILL`, compra = venda), numa única chamada à API de candles;
  - `getLast24h`.
- [x] `HistoryJob`: `node-cron` `*/10 * * * *` (fuso de SP, `noOverlap`); na subida, coleta e preenche lacunas; erros só vão para o log. O `server.ts` inicia o job e o encerra no shutdown.
- [x] `GET /history` → `[{ timestamp, buy, sell, source }]`.
- [x] **Testes:** coleta e idempotência; backfill só das lacunas, com a regra "candle que fechou antes do horário" (o candle que começa no próprio horário não vale); sem lacunas → sem chamada externa; slot atual fora do backfill; slots sem negociação anterior ficam vazios; falhas; janela de 24 h; job (agenda, subida, disparos, erros no log, stop); candles no client; integração com índice único + TTL e **5 gravações simultâneas do mesmo slot → 1 registro**. 202 testes no total.
- [x] **Aceite:** com as APIs reais do Mercado Bitcoin, a subida gerou **144 pontos** (143 do backfill + 1 do ticker), todos em múltiplos de 10 minutos.

## Fase 9: Swagger e acabamento da API
- [x] Verificado e registrado: README do swagger-ui-express 5 (YAML via pacote `yaml`), validador `@apidevtools/swagger-parser` e Newman 6.
- [x] Decisão do autor: **Swagger público em produção**.
- [x] `backend/docs/openapi.yaml` (OpenAPI 3.0.3, design-first): 14 operações em 4 grupos, schemas, exemplos reais, erros padronizados e `bearerAuth`. Servidor padrão = "este servidor", então funciona igual no local e no Render.
- [x] `GET /docs` (Swagger UI, com o token preservado ao recarregar), `GET /docs/openapi.json` e `GET /`.
- [x] Graceful shutdown completo (job do histórico, servidor e Mongo).
- [x] Revisão de status codes: 200 leituras; 201 criação (cadastro, depósito, compra, venda); 400 validação; 401 autenticação; 409 e-mail duplicado; 413 corpo grande; 422 regra de negócio; 429 rate limit; 503 cotação indisponível.
- [x] **Testes:** spec válida; lista das 14 operações; **teste de contrato**: cada rota documentada existe e a exigência de login bate com a doc; `GET /`; Swagger UI e spec servidos. 220 testes no total.
- [x] **Aceite:** coleção Postman oficial executada com o Newman contra a API local: 11 requisições, 0 falhas, todas as rotas reconhecidas. As únicas respostas não-2xx vêm dos dados da própria coleção (venda de R$ 30 após compra de R$ 25 → 422; login com `"..."` → 400). Swagger conferido no navegador (headless), sem bloqueio do CSP do helmet.

## Fase 10: Fundação do front
- [x] Verificado e registrado: integração MUI 9 + Next 16 (`v16-appRouter`), opções do create-next-app 16.4, Cache Components e `npm audit`.
- [x] Rodada de perguntas visuais (autor): Plus Jakarta Sans, glassmorphism, só dark, animações intensas (D21–D24).
- [x] `frontend/` da v1 removido; app Next 16.4 criado (TS, App Router, `src/`, ESLint, sem Tailwind), TS 6.0 e tipos do Node 24 alinhados com a API, `output: 'standalone'`, Cache Components mantido (D25).
- [x] `theme/`: tokens (cores, vidro, gradientes, glow) e tema MUI com overrides (Card/Paper/Dialog de vidro, botão com gradiente + glow + brilho, inputs, chips, tabela, menu, tooltip, scrollbar, foco e reduzir movimento).
- [x] Providers: AppRouterCacheProvider, ThemeProvider, CssBaseline, QueryClientProvider, MotionConfig e Toaster (sonner). O LocalizationProvider de datas entra na Fase 15, com os Date Pickers.
- [x] Componentes: `AnimatedBackground` e `FocusGroup` (item em foco se destaca e os demais ficam foscos; o spotlight que seguia o mouse foi removido a pedido do autor); favicon `app/icon.svg`.
- [x] `lib/format.ts` (R$, ₿, %, data/hora em SP; datas puras sem o erro de "voltar um dia") e `lib/http.ts` (`ApiError` com mensagens por campo).
- [x] **Testes:** formatação (incluindo fuso e data pura) e leitura de erros da API: 8 testes.
- [x] **Aceite:** página **provisória** de prévia do design system, conferida em prints (desktop, celular e hover) com o build de produção; lint, typecheck, testes e Prettier ok.

## Fase 11: BFF, sessão e proteção de rotas
- [x] Verificado e registrado: `proxy.ts`, `cookies()` e Route Handlers no Next 16.
- [x] `server/bff.ts` (lógica pura e testada): allowlist exata, repasse com timeout de 90 s (504/503 com mensagem), validade do cookie lida do JWT e checagem de `Origin` (D26). `server/session.ts` (`server-only`): cookie `bitcoinzz_session` httpOnly.
- [x] Route Handlers: `api/auth/login`, `api/auth/register` (com login automático), `api/auth/logout`, `api/health` (acordar a API) e `api/[...path]` (exige sessão; 401 da API apaga o cookie).
- [x] `proxy.ts` + `lib/access.ts` (`resolveAccess`, `safeNextPath` contra open redirect).
- [x] Cliente: `lib/api-client.ts` (401 → login com recarga completa, D27) e `serverWake` + `ServerWakeBanner` ("Acordando o servidor…" após 2,5 s).
- [x] Prévia do design movida para `/design` (só em desenvolvimento; 404 em produção). Login, cadastro e dashboard provisórios, substituídos nas Fases 12 e 13.
- [x] **Testes:** allowlist (permitidas e bloqueadas), repasse (Bearer, query, JSON, erros da API, 504, 503), validade do cookie, Origin, regras de acesso e o aviso de lentidão com timers simulados. 52 testes no front.
- [x] **Aceite:** teste ponta a ponta com a API e o front em produção, **19 cenários**:
  - redirecionamentos;
  - cookie com flags corretas e token fora do corpo;
  - perfil, depósito, cotação e extrato pelo BFF;
  - allowlist (404), CSRF (403), token adulterado (401 + cookie apagado), logout e login com e sem erro.

  O aviso de "acordando" foi conferido em print com uma API lenta simulada.

## Fase 12: Login e cadastro
- [x] Rodada de perguntas (autor): layout dividido (hero + formulário) e checklist da senha ao vivo (D28).
- [x] Verificado e registrado: React Hook Form + Zod 4 (`@hookform/resolvers` 5.9) e o setup de testes de componente.
- [x] Layout `(auth)`: hero com a marca, título em gradiente, mini gráfico que se desenha (Motion) e 3 destaques em `FocusGroup`. No celular, só a marca e o formulário.
- [x] `LoginForm` e `RegisterForm` (RHF + Zod, com as mesmas regras e mensagens da API):
  - validação instantânea; erros de campo vindos da API no input certo (409 → e-mail);
  - mostrar/ocultar senha; checklist da senha ao vivo; confirmação de senha;
  - botão com loading; "sessão expirou" (`?reason=expired`); volta para `?next=` só se for interno;
  - toast de boas-vindas; login automático após o cadastro.
- [x] API "acordada" assim que as telas abrem (`usePrewarmApi`).
- [x] Componentes `Logo`, `PasswordField`, `PasswordChecklist`; utilitários `muiField` e `applyApiFieldErrors`; classe `.sr-only` (acessibilidade).
- [x] **Testes:** schemas (normalização, regras, confirmação, checklist) e componentes com Testing Library (login: acordar a API, validação sem chamar a API, sucesso com e-mail normalizado, `next` interno e malicioso, erro 401, sessão expirada, mostrar/ocultar senha; cadastro: checklist ao vivo, confirmação diferente, 409 no campo, sucesso com toast). 71 testes no front.
- [x] **Aceite:** no navegador real, com a API e o front em produção: senha errada → mensagem genérica; cadastro → dashboard logado ("Olá, Fulano da Silva!"); logado em `/login` → dashboard. Prints de desktop e celular conferidos.

## Fase 13: Shell e dashboard
- [x] `AppShell`: menu lateral fixo no desktop e gaveta no celular (D29), indicador animado do item ativo (`layoutId` do Motion), itens em `FocusGroup` e logout com recarga completa (D27).
- [x] `UserBadge`: Server Component que lê o cookie e busca o perfil na API, dentro de `<Suspense>` (Partial Prerender: casca estática + nome do usuário em streaming).
- [x] Cards de Saldo (número animado), Cotação ("ao vivo" pulsando + "atualizado há 12 s"), Volume do dia (comprados e vendidos) e Investimentos (valor atual, investido, BTC e variação).
- [x] Gráfico de área das últimas 24 h (D30): gradiente blurple, eixo Y com folga, variação do período, tooltip com horário, venda e compra, e aviso nos pontos de backfill.
- [x] Posição dos investimentos: tabela no desktop e cards no celular, com chip de variação e marca de reinvestimento.
- [x] Skeletons, erro com "Tentar de novo" por card, estado vazio com atalho para comprar e `error.tsx` da área logada.
- [x] Páginas provisórias de Depositar, Comprar, Vender e Extrato (`ComingSoon`), substituídas nas Fases 14 e 15.
- [x] Correções encontradas no navegador: data instável no pré-render (Cache Components), área do gráfico indo até R$ 0, chip vazando do card e tooltip fora do lugar dentro do card de vidro (detalhes na ARQUITETURA, seção 12).
- [x] **Testes:** `toChartSeries` (ordem, séries, folga do eixo Y, preço constante, backfill), `periodChangePercent`, `relativeTime`, `isActivePath` e o `DashboardView` com Testing Library (saudação, cotação e volume formatados, estado vazio, tabela com variação e reinvestimento). 91 testes no front.
- [x] **Aceite:** no navegador real, com a API (cotação e histórico reais do Mercado Bitcoin) e o front em produção: depósito, duas compras e venda parcial aparecem no dashboard; cotação e "há N s" se atualizam sozinhos; tooltip conferido com a página rolada; prints de desktop, celular e menu aberto conferidos.

## Fase 14: Depósito e compra com preview
- [x] `MoneyField` "estilo app de banco" (D31): os dígitos entram pelos centavos, sem vírgula para errar, com teclado numérico no celular; vazio quando o valor é zero.
- [x] `ConfirmDialog` e componentes da feature `trade` (reaproveitados na venda): `SummaryList`, `SuccessPanel` e `TradeLayout` (formulário + prévia lado a lado; empilhados no celular).
- [x] Depósito: atalhos que somam (+R$ 100, +R$ 500, +R$ 1.000), resumo com saldo depois e limite de R$ 1.000.000,00 (igual à API); sem diálogo (D33).
- [x] Compra: atalhos de 25%, 50% e Tudo do saldo; prévia ao vivo (cotação de venda, BTC estimado com o mesmo arredondamento da API, saldo depois); diálogo "Revise a compra" (D33); aviso e atalho para depositar quando não há saldo.
- [x] Depois do sucesso, o formulário vira um resumo com o resultado real da API e atalhos (D32), além do toast. O cache é atualizado na hora: o saldo vem na resposta, e posição, volume e extrato são buscados de novo.
- [x] Lógica de dinheiro do front em inteiros (`lib/money.ts`: centavos, satoshis e BigInt), espelhando a API; `useNow` virou hook compartilhado; `errorMessage` em `lib/http.ts`.
- [x] Correções encontradas no navegador: dígito digitado antes de "R$ 0,00" (foco automático com o cursor no início) e chip de variação sobre o rótulo dos KPIs (cards de 4 colunas só a partir de 1360 px; rótulo quebra em 2 linhas).
- [x] **Testes:** `lib/money` (conversões, BTC estimado, leitura do campo), `preview` (saldo depois, limites e mensagens iguais às da API, 0 satoshi, %), telas com Testing Library (digitação pelos centavos, cursor no início, apagar, atalhos, validação sem chamar a API, corpo enviado em R$, resultado real, erro da API, cancelar, sem saldo). 131 testes no front.
- [x] **Aceite:** no navegador real, com a API e a cotação reais: depósito de R$ 5.000 → compra de R$ 1.500 com confirmação → "Ver no dashboard" mostra o saldo e o investimento novos sem recarregar a página. Prints de desktop e celular conferidos, sem erros no console.

## Fase 15: Venda e extrato
- [x] Venda em R$ pela cotação de compra, com atalhos de 25%, 50% e Tudo da posição, limite pelo valor da posição e diálogo "Revise a venda".
- [x] Prévia detalhada do FIFO (D34): `salePreview` espelha o `planSale` da API (mesmo arredondamento e mensagens) e mostra, em ordem, o investimento vendido inteiro, o vendido em parte e a sobra que vira reinvestimento.
- [x] Resumo de sucesso com o resgate, o BTC vendido, a cotação e o reinvestimento reais, com atalho "Ver no extrato".
- [x] Extrato com lista agrupada por dia (D36): "Hoje", "Ontem" e datas, no horário de São Paulo; ícone por tipo, BTC, cotação, hora e valor com sinal (+ entrada, − saída, reinvestimento sem sinal).
- [x] Período: atalhos de 7, 30 e 90 dias (padrão 90, mesma conta da API) e MUI X Date Pickers em pt-BR (D35), com as mesmas validações da API (início ≤ fim, até 366 dias). O `LocalizationProvider` fica só no filtro do extrato, não nos Providers globais: o código dos pickers só é carregado nessa tela.
- [x] Extras (D37): totais do período (depositado, comprado e vendido), filtro por tipo com contagem e exportação em CSV para o Excel em português (gerado no navegador, com o que está na tela).
- [x] Componentes provisórios `ComingSoon` removidos: todas as telas do menu existem.
- [x] Ajustes vistos no navegador: linhas do extrato no celular (valor na linha do título), calendário mais opaco que o vidro e cantos dos blocos do FIFO.
- [x] **Testes:** `salePreview` (exemplo do PRD, FIFO com vários investimentos, venda total, arredondamento que consome tudo, mensagens), conversões novas de `lib/money`, `lib/dates` (fuso de São Paulo, meses, ano bissexto), período, agrupamento, totais e CSV; telas de venda e extrato com Testing Library (prévia FIFO, limite, "Tudo", confirmação com reinvestimento, sem bitcoins, 90 dias padrão, atalho de 7 dias, filtro + CSV, período vazio). 158 testes no front.
- [x] **Aceite:** no navegador real, com a API e a cotação reais: venda de R$ 1.800 consumiu a compra mais antiga inteira e parte da segunda; o extrato mostrou Venda + Reinvestimento (R$ 497,45, com a cotação original); o CSV baixou com o filtro aplicado. Prints de desktop, celular e calendário conferidos, sem erros no console.

## Fase 16: Docker Compose
- [x] Docker Desktop instalado pelo autor (Docker 29.8, Compose v5.5; requisitos e licença na ARQUITETURA, seção 12).
- [x] Dockerfiles multi-stage (`node:24-alpine`): a imagem final leva só o necessário (API: `dist` + dependências de produção + `docs`; front: servidor standalone + `.next/static`), roda com o usuário `node` (sem privilégios) e não contém nenhum `.env` (`.dockerignore`).
- [x] `docker-compose.yml` só com o modo produção (D39): `mongo:8` com replica set de 1 nó (healthcheck que inicia o replica set e só fica "saudável" quando aceita escrita), `api` (healthcheck em `/health`) e `web` (sobe depois da API saudável). Portas presas ao `127.0.0.1`; dados num volume; banco começa vazio (D40).
- [x] `JWT_SECRET` obrigatório no `.env` da raiz (D38): sem ele, o compose recusa subir com uma mensagem clara. Novo `.env.example` na raiz (segredo + SMTP opcional).
- [x] Bug achado no Docker e corrigido: com `HOSTNAME=0.0.0.0`, a URL interna do Next vira `http://0.0.0.0:3000` e a checagem de origem do BFF recusava todo POST (403). Agora ela compara com o host que o navegador acessou (`X-Forwarded-Host` ou `Host`). Teste novo reproduz o caso.
- [x] Erro de console achado na verificação (existia desde a Fase 12): logo após o login, o prefetch do link "Criar conta" já ia com sessão, o proxy redirecionava e o prefetch acabava em 404. Os links entre login e cadastro ficaram sem prefetch.
- [x] **Testes:** `isSameOrigin` com Host/X-Forwarded-Host (159 testes no front; API sem mudança de código).
- [x] **Aceite:** `docker compose up --build` sobe tudo saudável (build em ~2 min; subida em ~45 s). Pelo front em `localhost:3000`: cadastro → depósito → 2 compras → venda parcial com reinvestimento → extrato, volume e 144 pontos de histórico. Login pelo navegador com cookie `Secure` em `http://localhost`, sem erros no console. Swagger em `localhost:3333/docs`. Dados mantidos após `down` → `up`; `down` em 2,8 s (desligamento com calma). Sem o segredo no `.env`, o compose recusa subir.

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
| 06/10/2026 | 2 | Cadastro e login concluídos (74 testes); aprovados e commitados pelo autor |
| 06/10/2026 | 3 | Depósito, saldo, perfil e e-mails concluídos (100 testes); aguardando revisão |
| 06/10/2026 | – | Revisão geral: troca do dotenv por `process.loadEnvFile`, `trust proxy` só em produção, `x-request-id` sanitizado, 413/4xx do body-parser, shutdown que espera as requisições, README provisório. 103 testes, cobertura de 89% das linhas |
| 06/10/2026 | 3 | Atlas confirmado: cadastro, login e depósito com transação no M0 funcionando. Render fora do ar até a Fase 17 (decisão do autor) |
| 06/10/2026 | 4 | Cotação concluída com o endpoint v4 (119 testes); aguardando revisão |
| 06/10/2026 | 5 | Compra e posição concluídas (143 testes; fluxo real no Atlas); aguardando revisão |
| 06/10/2026 | 5 | D16 e D17 aprovadas pelo autor |
| 06/10/2026 | 6 | Venda FIFO com reinvestimento concluída (165 testes; fluxo real no Atlas); aguardando revisão |
| 06/10/2026 | 7 | Extrato e volume concluídos (183 testes; validado no Atlas); aguardando revisão. A API cobre os itens 1 a 10 do desafio |
| 06/10/2026 | 7 | D18 aprovada (o autor seguiu para a Fase 8) |
| 06/10/2026 | 8 | Histórico concluído (202 testes; 144 pontos reais na subida); aguardando revisão. A API cobre os 11 itens do desafio |
| 07/10/2026 | 9 | Swagger, contrato e Postman oficial concluídos (220 testes); aguardando revisão. API completa |
| 07/10/2026 | 10 | Fundação do front com tema dark/glass/blurple, conferida em prints; aguardando revisão |
| 07/10/2026 | 10 | Ajuste pedido pelo autor: spotlight removido; efeito de foco (destaque + demais foscos) em cards e botões, conferido em prints |
| 07/10/2026 | 10 | Efeito de foco aprovado e registrado como padrão de todas as telas (CLAUDE.md) |
| 07/10/2026 | 11 | BFF e sessão concluídos (52 testes no front; 19 cenários ponta a ponta); aguardando revisão |
| 07/10/2026 | 12 | Login e cadastro concluídos (71 testes no front; fluxos conferidos no navegador); aguardando revisão |
| 07/10/2026 | 11–12 | Autor commitou até a Fase 11 (`de8bb7e`) e aprovou a Fase 12. Escolhas para a Fase 13: menu lateral fixo e gráfico de área com compra e venda no tooltip |
| 07/10/2026 | 13 | Shell e dashboard concluídos (91 testes no front; dados reais conferidos no navegador); aguardando revisão |
| 07/10/2026 | 13 | Aprovada pelo autor. Escolhas da Fase 14: campo "estilo app de banco", resumo de sucesso na tela, confirmação só na compra, atalhos fixos no depósito e % do saldo na compra |
| 07/10/2026 | 14 | Depósito e compra concluídos (131 testes no front; fluxo real conferido no navegador); aguardando revisão |
| 07/10/2026 | 14 | Aprovada pelo autor. Escolhas da Fase 15: prévia detalhada do FIFO, MUI X Date Pickers, extrato agrupado por dia, totais, filtro por tipo e CSV |
| 08/10/2026 | 15 | Venda e extrato concluídos (158 testes no front; venda parcial e extrato conferidos no navegador); aguardando revisão. O front cobre os 6 itens do desafio |
| 08/10/2026 | 16 | Autor instalou o Docker Desktop e aprovou a Fase 15. Escolhas: JWT_SECRET obrigatório no `.env`, só modo produção, banco vazio |
| 08/10/2026 | 16 | Docker Compose concluído (fluxo completo conferido nos containers; 159 testes no front); aguardando revisão |
