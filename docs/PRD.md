# PRD: Bitcoinzz v2

> Documento de requisitos do produto: **o quê** será construído e **para quem**.
> Base: desafios técnicos da Eduzz ([backend](https://gist.github.com/caferrari/a25734c6e941f6386e7156aa723f28a8) e [frontend](https://gist.github.com/danieloprado/d65ef5eca695550f953986ea6966a485)).
> Última atualização: 06/10/2026.

## 1. Visão geral

O Bitcoinzz é uma plataforma **simulada** de investimento em bitcoin. O cliente deposita reais (sem dinheiro de verdade), compra e vende BTC pela cotação real do Mercado Bitcoin e acompanha o resultado num painel administrativo.

A v2 reescreve o projeto para cumprir todos os itens dos dois desafios. O código segue padrões de mercado de nível pleno e deve ser simples o bastante para o autor explicar em uma entrevista.

## 2. Para quem

| Público | O que precisa |
|---|---|
| **Cliente investidor** (usuário do admin) | Depositar, comprar e vender com segurança, entender a posição e o extrato sem esforço, e ter uma interface bonita e fluida |
| **Avaliador técnico da Eduzz** | Rodar o projeto no Linux seguindo o README, testar a API com a coleção Postman oficial e ler um código organizado, tipado e testado |
| **Autor do projeto** (dev júnior → pleno) | Um código que ele entenda e consiga defender: camadas claras, decisões documentadas e testes legíveis |

## 3. Objetivos e métricas de sucesso

- **100% dos itens obrigatórios** dos dois desafios atendidos (checklist na seção 9).
- A **coleção Postman oficial** roda contra a API só trocando o `apiUrl`.
- Lógica central coberta por **testes automatizados**: compra, venda FIFO, posição, extrato, volume e histórico.
- **Custo zero:** apenas planos gratuitos sem prazo de expiração.
- Experiência sem "telas quebradas": loading, erro, estado vazio e o estado "servidor acordando" tratados em todas as telas.

## 4. Requisitos funcionais

### API (backend)

| ID | Requisito | Origem |
|---|---|---|
| RF01 | Cadastro com nome, e-mail e senha | Back #2 |
| RF02 | Login que devolve um token JWT; todas as demais rotas exigem autenticação | Back #2 |
| RF03 | Depósito em R$ a qualquer momento (sem transferência real) + e-mail com o valor depositado | Back #3 |
| RF04 | Consulta do saldo disponível em R$ | Back #4 |
| RF05 | Cotação atual do BTC (compra e venda) | Back #5 |
| RF06 | Compra de BTC com o saldo, convertendo pela cotação de **venda** + e-mail com o R$ investido e o BTC comprado | Back #6 |
| RF07 | Posição dos investimentos: data da compra, valor investido, cotação na compra, variação % e valor bruto atual | Back #7 |
| RF08 | Venda por valor em R$, consumindo os investimentos em ordem de compra (FIFO) pela cotação atual; venda parcial com reinvestimento; e-mail com o BTC vendido e o R$ resgatado | Back #8 |
| RF09 | Extrato de depósitos, compras e resgates, com datas e cotações: últimos 90 dias ou intervalo customizado | Back #9 |
| RF10 | Volume: total de BTC comprado e vendido no dia corrente | Back #10 |
| RF11 | Histórico de compra/venda do BTC a cada 10 min (8:00, 8:10…) nas últimas 24 h; dados com mais de 90 dias são apagados automaticamente | Back #11 |
| RF12 | Perfil do usuário logado (nome e e-mail), para a saudação no front | Extra |
| RF13 | Documentação interativa da API (Swagger em `/docs`) | Diferencial |

### Admin (frontend)

| ID | Requisito | Origem |
|---|---|---|
| RF20 | Telas de cadastro e login, com sessão de 8 h | Front #1 |
| RF21 | Dashboard com saldo, cotação (compra e venda), volume do dia, gráfico do histórico de 24 h e posição dos investimentos | Front #2 |
| RF22 | Depósito em R$ | Front #3 |
| RF23 | Compra com **preview da estimativa** antes da confirmação | Front #4 |
| RF24 | Venda informando o valor em R$, com preview e confirmação | Front #5 |
| RF25 | Extrato com filtro padrão de 90 dias ou intervalo customizado | Front #6 |
| RF26 | Feedback visual em todas as ações: toasts, loading, erros e estados vazios | Usabilidade |

## 5. Regras de negócio

Interpretações dos pontos ambíguos do desafio, aprovadas pelo autor:

1. **Cotações:** a compra usa a cotação de **venda** do mercado (`ticker.sell`), como o desafio pede. A venda usa a cotação de **compra** (`ticker.buy`).
2. **Venda por valor em R$** (igual ao `POST /btc/sell { amount }` da coleção Postman). O sistema vende os investimentos do mais antigo para o mais novo (FIFO) até atingir o valor pedido. Se o pedido for maior que o valor atual da posição, a venda é recusada.
3. **Venda parcial:** o investimento atingido é encerrado por completo. O BTC que sobra vira um novo investimento (*reinvestimento*), com a **mesma cotação e a mesma data** do original. O extrato registra os dois lançamentos: o saque parcial e o reinvestimento. Assim nenhum BTC é criado nem perdido.

   Exemplo: o investimento A tem 0,002 BTC comprados a R$ 400.000 (R$ 800 investidos). Com a cotação de compra atual em R$ 500.000, A vale R$ 1.000. O cliente vende R$ 600:
   - são vendidos 0,0012 BTC;
   - A é encerrado;
   - nasce o reinvestimento B, com 0,0008 BTC a R$ 400.000 (R$ 320) e a mesma data de A;
   - o saldo do cliente aumenta R$ 600.
4. **Valor bruto atual e variação %** usam a cotação de compra atual, ou seja, quanto o cliente receberia se vendesse agora.
5. **Volume** é o total da plataforma (todos os clientes) no dia corrente, no fuso de São Paulo. Reinvestimentos não entram, porque não são compras de mercado.
6. **Limites:**
   - valores em R$ têm no máximo 2 casas decimais;
   - depósito de no mínimo R$ 0,01 e no máximo R$ 1.000.000,00 por operação;
   - compras que resultariam em 0 satoshi são recusadas.
7. **Extrato:** por padrão, de hoje − 90 dias até hoje. O intervalo customizado exige início ≤ fim e no máximo 366 dias.
8. **Senha:** no mínimo 8 caracteres, com pelo menos uma letra e um número.

## 6. Requisitos não funcionais

- **Execução no Linux** documentada no README, com Docker Compose ou manualmente.
- **TypeScript strict** no back e no front; código em inglês e textos para o usuário em pt-BR.
- **Segurança:**
  - senhas com hash bcrypt e login com mensagem genérica;
  - JWT guardado em cookie httpOnly pelo front (o JavaScript do navegador nunca vê o token);
  - helmet, rate limit e validação de toda entrada com Zod.
- **Integridade:**
  - valores em inteiros (centavos e satoshis);
  - operações financeiras em transações do MongoDB.
- **Observabilidade:** logs estruturados (pino) com id de requisição.
- **Desempenho:** cotação em cache de 10 s para não sobrecarregar a API pública do Mercado Bitcoin.
- **Usabilidade no plano gratuito:** a API pode estar "dormindo" (cerca de 1 min para acordar).
  - O front mostra "Acordando o servidor…" e acorda a API já na tela de login.
  - O histórico preenche as lacunas automaticamente.
- **Acessibilidade:** contraste adequado no tema escuro, foco visível, navegação por teclado e respeito a `prefers-reduced-motion`.

## 7. Restrições

- **Custo zero:** Render free (API), Vercel Hobby (front, uso não comercial), MongoDB Atlas M0 (0,5 GB) e Brevo free (300 e-mails/dia).
- **Integrações obrigatórias:**
  - cotação pelo Mercado Bitcoin: o desafio cita a URL v3 (`/api/BTC/ticker/`); a implementação usa o endpoint v4 documentado ([`/api/v4/tickers`](https://api.mercadobitcoin.net/api/v4/docs)), que traz os mesmos dados;
  - e-mail por um provedor com plano gratuito.
- **Contrato da API** compatível com a coleção Postman oficial do desafio.

## 8. Fora de escopo

- Movimentação de dinheiro real, KYC, taxas e impostos.
- Recuperação de senha, 2FA e refresh token.
- Migração dos dados da v1: o database atual é mantido, mas as coleções antigas (`usuarios`, `transacoes`) ficam sem uso, porque os nomes novos (`users`, `transactions`…) não colidem com elas.
- Redis e filas: a API fica sem estado e preparada para isso, mas não é necessário agora.
- Múltiplos idiomas.

## 9. Checklist dos desafios

| Desafio | Item | Onde será atendido (fase do ROADMAP) |
|---|---|---|
| Back (obrigatório) | Instruções de execução no Linux | 16, 17 |
| Back (obrigatório) | Validações de dados | 1 em diante (Zod) |
| Back (obrigatório) | Legibilidade e funcionamento | todas |
| Back (recomendado) | Clean Code, SOLID, SoC, arquitetura em camadas | 1 em diante |
| Back (recomendado) | Status HTTP corretos, ODM, testes, padronização, inglês | 1 em diante |
| Back (diferencial) | Logs, segurança, cache, escalabilidade, Docker | 1, 2, 4, 8, 16 |
| Front (obrigatório) | Linux, validações, legibilidade, funcionamento | 10 a 17 |
| Front (tecnologias) | React, TypeScript, Material UI | 10 em diante |
| Front (diferencial) | Testes, segurança, Docker | 10 a 16 |

## 10. Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| API dormindo no Render free | Primeiro acesso demora cerca de 1 min | Pré-aquecimento na tela de login, estado "Acordando…" e timeout longo no BFF |
| Lacunas no histórico enquanto a API dorme | Gráfico com buracos | Backfill no boot usando os candles públicos do Mercado Bitcoin (pontos aproximados e marcados) |
| Atlas M0 pausa após 30 dias sem uso | API fica sem banco | README explica como retomar o cluster no painel do Atlas |
| E-mails do Brevo no spam (sem domínio próprio) | Avaliador não vê o e-mail | README orienta a olhar o spam; o envio também aparece nos logs |
| API do Mercado Bitcoin fora do ar | Compra, venda e cotação indisponíveis | Resposta 503 com mensagem clara; o front mostra o aviso e permite tentar de novo |
