# CLAUDE.md: Bitcoinzz

Plataforma simulada de investimento em bitcoin (desafios backend + frontend da Eduzz).
- API Express + TypeScript em `backend/`; admin Next.js em `frontend/`.
- Referências: [docs/PRD.md](docs/PRD.md) (o quê e para quem), [docs/ARQUITETURA.md](docs/ARQUITETURA.md) (como) e [docs/ROADMAP.md](docs/ROADMAP.md) (fases e status).

## Comandos

Valem a partir da fase em que cada pasta é criada:

```bash
# API (backend/) — porta 3333
npm run dev          # tsx watch
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm test             # Vitest (unit + integração com Mongo em memória)
npm run build && npm start

# Front (frontend/) — porta 3000
npm run dev
npm run lint
npm run typecheck
npm test

# Tudo junto (raiz, exige Docker)
docker compose up --build
```

## Convenções
- Código, rotas e campos do banco em **inglês**; textos para o usuário (UI, e-mails e mensagens de erro) em **pt-BR**.
- TypeScript strict. TS fixado em **6.0.x**, porque o typescript-eslint ainda não suporta o 7.
- API em camadas: `routes → controller → service → repository`.
  - Controller não tem regra de negócio.
  - Só o repository importa Mongoose.
  - Dependências entram pelo construtor, montadas em `src/container.ts`.
- Erros: services lançam `AppError`; a resposta é sempre `{ statusCode, message, details? }`.
- Dinheiro sempre em inteiros: **centavos** (R$) e **satoshis** (BTC), convertidos em `shared/money.ts`. Nunca usar `toFixed` para calcular.
- Datas de negócio no fuso `America/Sao_Paulo` (`shared/dates.ts`).
- Toda entrada é validada com Zod; operações financeiras rodam em transação (`TransactionRunner`).
- Imports relativos com extensão `.js` na API (ESM `nodenext`).
- Mensagens de commit no padrão Conventional Commits (`feat(api): ...`, `test: ...`, `docs: ...`).

## Regras de trabalho (definidas pelo autor)
1. Antes de qualquer código novo, fazer uma rodada objetiva de perguntas para tirar dúvidas.
2. Trabalhar em fases pequenas do ROADMAP. Em cada fase:
   - escrever e rodar os testes da lógica central;
   - **não fazer commits**: o autor commita manualmente; ao fim da fase, sugerir a mensagem de commit (ou várias, se a fase tiver partes independentes);
   - atualizar o `docs/ROADMAP.md`;
   - **parar para revisão** antes de seguir.
3. APIs, custos e versões mudam: antes de cada integração, consultar a **doc oficial atual** e registrar o que foi verificado, a fonte e a data em `docs/ARQUITETURA.md` (seção 12).
4. Decisões que afetam **custo ou segurança**, ou que são **difíceis de desfazer**: apresentar opções com prós e contras e deixar o autor decidir.
5. **Custo zero**, com a melhor usabilidade possível: só planos gratuitos sem prazo (Render free, Vercel Hobby, Atlas M0, Brevo free).
6. O autor é dev júnior → pleno: preferir soluções simples e explicáveis e, ao fim de cada fase, explicar os conceitos usados.
7. Trabalho direto na `main`. Nunca rodar `git commit` nem `git push`, e nunca ler `.env` ou outros arquivos com segredos.
