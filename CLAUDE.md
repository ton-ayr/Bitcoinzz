# CLAUDE.md: Bitcoinzz

Plataforma simulada de investimento em bitcoin (desafios backend + frontend da Eduzz), em manutenção.
- API Express + TypeScript em `backend/`; admin Next.js em `frontend/`.
- Referências: [README](README.md) (visão geral e como rodar), [CONTRIBUTING](CONTRIBUTING.md) (convenções e fluxo) e [docs/architecture.md](docs/architecture.md) (como, por quê e integrações).

## Comandos

```bash
# Em backend/ (porta 3333) e frontend/ (porta 3000)
npm run dev
npm run lint
npm run typecheck
npm test
npm run build

# Tudo junto (raiz, exige Docker; antes: copiar .env.example para .env e preencher o JWT_SECRET)
docker compose up --build   # front :3000, API :3333, Mongo :27017 (só 127.0.0.1)
docker compose down         # para (os dados ficam no volume; `down -v` apaga)
```

## Convenções

Detalhes em [CONTRIBUTING.md](CONTRIBUTING.md). O essencial:
- Código, rotas e campos do banco em **inglês**; textos para o usuário em **pt-BR**.
- TypeScript strict, fixado em **6.0.x**.
- API: `routes → controller → service → repository`; só o repository importa Mongoose; dependências pelo construtor (`src/container.ts`); erros com `AppError` → `{ statusCode, message, details? }`; Zod em toda entrada; operações financeiras no `TransactionRunner`; imports relativos com `.js`.
- Dinheiro em inteiros (**centavos** e **satoshis**), nunca `toFixed` para calcular; datas de negócio em `America/Sao_Paulo`.
- Front: só tokens de `frontend/src/theme/tokens.ts`; todo grupo de cards ou botões usa `FocusGroup` + `className={FOCUS_ITEM}`; nada de brilho seguindo o mouse.
- Commits em Conventional Commits.

## Regras de trabalho (definidas pelo autor)
1. Antes de qualquer código novo, fazer uma rodada objetiva de perguntas para tirar dúvidas.
2. Trabalhar em mudanças pequenas. Em cada mudança:
   - escrever e rodar os testes da lógica central;
   - **não fazer commits**: o autor commita manualmente; ao fim, sugerir a mensagem de commit (ou várias, se houver partes independentes);
   - atualizar a documentação afetada (README, CONTRIBUTING ou `docs/`);
   - **parar para revisão** antes de seguir.
3. APIs, custos e versões mudam: antes de mexer numa integração, consultar a **doc oficial atual** e atualizar a tabela "Integrações externas" de `docs/architecture.md` (o que foi verificado, a fonte e a data).
4. Decisões que afetam **custo ou segurança**, ou que são **difíceis de desfazer**: apresentar opções com prós e contras e deixar o autor decidir.
5. **Custo zero**, com a melhor usabilidade possível: só planos gratuitos sem prazo (Render free, Vercel Hobby, Atlas M0, Brevo free).
6. O autor é dev júnior → pleno: preferir soluções simples e explicáveis e, ao fim de cada entrega, explicar os conceitos usados.
7. Trabalho direto na `main`. Nunca rodar `git commit` nem `git push`, e nunca ler `.env` ou outros arquivos com segredos.
