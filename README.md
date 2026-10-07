# Bitcoinzz :moneybag: (Desafio Tech Eduzz)

Plataforma full-stack **simulada** de investimento em bitcoin, construída a partir dos desafios de [Backend](https://gist.github.com/caferrari/a25734c6e941f6386e7156aa723f28a8) e [Frontend](https://gist.github.com/danieloprado/d65ef5eca695550f953986ea6966a485) da Eduzz.

> 🚧 **Em reestruturação (v2).** A API está sendo reescrita em TypeScript com arquitetura em camadas, e o front será refeito em Next.js + Material UI. O front atual (`frontend/`, HTML da v1) **não é compatível** com a nova API e será substituído. O progresso fase a fase está no [ROADMAP](docs/ROADMAP.md).

## O que já funciona na API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Status da API e do banco |
| POST | `/account` | Cadastro (nome, e-mail, senha) |
| POST | `/login` | Login; devolve um token JWT (8 h) |
| GET | `/account` | Perfil do usuário logado |
| POST | `/account/deposit` | Depósito em R$ + e-mail de confirmação |
| GET | `/account/balance` | Saldo em R$ |
| GET | `/btc/price` | Cotação atual do BTC (compra e venda), com cache de 10 s |
| POST | `/btc/purchase` | Compra BTC com o saldo (cotação de venda) + e-mail |
| GET | `/btc` | Posição: data, valor investido, cotação na compra, variação % e valor atual |
| POST | `/btc/sell` | Venda por valor em R$, consumindo as compras mais antigas primeiro (FIFO), com reinvestimento da sobra + e-mail |
| GET | `/extract` | Extrato dos últimos 90 dias ou de um intervalo (`?from=AAAA-MM-DD&to=AAAA-MM-DD`) |
| GET | `/volume` | Total de BTC comprado e vendido na plataforma no dia |
| GET | `/history` | Cotação de compra/venda de 10 em 10 minutos nas últimas 24 h (expurgo automático após 90 dias) |

As rotas seguem o contrato da coleção Postman oficial do desafio. A cotação vem da [API v4 do Mercado Bitcoin](https://api.mercadobitcoin.net/api/v4/docs), a versão documentada hoje; a URL v3 citada no enunciado virou legado. Com isso, a API cobre os 11 itens do desafio de backend. Os próximos passos (front em Next.js, Docker e deploy) estão no [ROADMAP](docs/ROADMAP.md).

## Como rodar o admin (front, Next.js)

Com a API rodando:

```bash
cd frontend
npm install
cp .env.example .env.local   # API_URL=http://localhost:3333
npm run dev                  # http://localhost:3000
```

## Documentação interativa e Postman

- **Swagger:** com a API rodando, abra `http://localhost:3333/docs`. Faça login em `POST /login`, copie o `token`, clique em **Authorize** e teste todas as rotas pelo navegador.
- **Coleção Postman oficial do desafio:** importe [desafio-postman.json](https://cdn.eduzzcdn.com/files/desafio-postman.json), troque a variável `apiUrl` para `http://localhost:3333` e preencha e-mail e senha no request **Login** (a coleção vem com `"..."`).

## Tecnologias da API

Node.js 24 · Express 5 · TypeScript · MongoDB (Mongoose) · Zod · JWT · bcrypt · pino · node-cron · Nodemailer (Brevo) · Swagger (OpenAPI 3) · Vitest + Supertest

## Como rodar a API (Linux)

Pré-requisitos: [Node.js 24+](https://nodejs.org/en/download) e um banco MongoDB, como o [Atlas](https://www.mongodb.com/atlas) gratuito.

```bash
git clone https://github.com/ton-ayr/Bitcoinzz.git
cd Bitcoinzz/backend
npm install
cp .env.example .env   # preencha MONGODB_URI e JWT_SECRET (gere com: openssl rand -hex 32)
npm run dev            # API em http://localhost:3333
```

Testes (não precisam de banco: sobem um MongoDB em memória automaticamente; o primeiro uso baixa o binário do MongoDB):

```bash
npm test
```

## Documentação

- [PRD](docs/PRD.md): o que está sendo construído e para quem.
- [Arquitetura](docs/ARQUITETURA.md): componentes, modelo de dados, decisões e verificações.
- [Roadmap](docs/ROADMAP.md): fases e status.
