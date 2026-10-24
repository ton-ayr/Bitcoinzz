# CLAUDE.md

Bitcoinzz: investimento simulado em bitcoin (desafios backend + frontend da Eduzz). API Express + TypeScript em `backend/` e admin Next.js em `frontend/`.
Docs: [README](README.md) (visão geral e como rodar) · [CONTRIBUTING](CONTRIBUTING.md) (convenções e mapa da documentação) · [docs/architecture.md](docs/architecture.md) (decisões e integrações).

## Comandos

```bash
# em backend/ e em frontend/
npm run dev                                                      # API :3333 · admin :3000
npm run lint && npm run typecheck && npm test && npm run build   # o mesmo que o CI roda

# na raiz (exige Docker e um .env com JWT_SECRET)
docker compose up --build   # admin :3000, API :3333, Mongo :27017 (só 127.0.0.1)
docker compose down         # para (com -v, apaga os dados)
```

## Código (detalhes no CONTRIBUTING)

- Código em inglês; textos para o usuário em pt-BR. TypeScript strict 6.0.x.
- API: `routes → controller → service → repository`; Zod em toda entrada; erros com `AppError`; operações financeiras no `TransactionRunner`.
- Dinheiro em centavos e satoshis (inteiros); datas de negócio em `America/Sao_Paulo`.
- Admin: cores só de `theme/tokens.ts`; grupos de cards e botões com `FocusGroup`.

## Regras de trabalho

1. Rodada objetiva de perguntas antes de código novo.
2. Mudanças pequenas: testes da lógica central, docs afetadas atualizadas e parada para revisão.
3. Nunca `git commit` nem `git push`: o autor commita; sugerir a mensagem (Conventional Commits). Trabalho direto na `main`.
4. Nunca ler `.env` ou outros arquivos com segredos.
5. Integração externa: conferir a doc oficial atual e atualizar "Integrações externas" em `docs/architecture.md`.
6. Custo, segurança ou algo difícil de desfazer: apresentar opções com prós e contras; o autor decide.
7. Custo zero: só planos gratuitos sem prazo (Render free, Vercel Hobby, Atlas M0, Mailjet free).
8. Autor júnior → pleno: soluções simples e, ao fim de cada entrega, explicar os conceitos usados.
