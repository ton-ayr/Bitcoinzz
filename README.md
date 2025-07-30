# Bitcoinzz :moneybag: (Desafio Tech Eduzz) 

Projeto full‑stack em Node.js criado com base nos desafios de [Backend](https://gist.github.com/caferrari/a25734c6e941f6386e7156aa723f28a8) e [Frontend](https://gist.github.com/danieloprado/d65ef5eca695550f953986ea6966a485) da Eduzz.

Acesse a aplicação:

[Bitcoinzz](https://bitcoinzz.onrender.com)

[Documentação](https://bitcoinzz.onrender.com/api)

---

## Tecnologias utilizadas
| Tecnologia       | Versão / Uso            |
|------------------|-------------------------|
| Node.js          | ≥ 16.x                  |
| Express          | Framework do servidor   |
| MongoDB          | Atlas ou local          |
| JWT              | Autenticação de usuários|
| Mongoose         | ODM para MongoDB        |

---

## Pré-requisitos

- **IDE** com suporte a [Node.js](https://nodejs.org/en/download)
- [**Node.js**](https://nodejs.org/en/download) instalado.
- Conta e conexão válida com o [MongoDB](https://www.mongodb.com/)

---

## Execução (Linux)

### 1. Clone e abra o repositório:
```bash
git clone git@github.com:ton-ayr/Bitcoinzz.git
cd Bitcoinzz
```
### 2. Instale as dependências:
```bash
npm install
```
### 3. Configure variáveis de ambiente:
```bash
cp .env.example .env
edite .env conforme necessário
```
### 4. Inicie a aplicação:
```bash
npm run dev
```

---

## Configuração do `.env`:

### Conexão com o MongoDB (OBRIGATÓRIO):
```bash
DB_CONNECTION_STRING=URI MongoDB
```
### Chave secreta para JWT (OBRIGATÓRIO)
- Pode ser gerada pelo terminal com o comando:
```bash
openssl rand -hex 32
```
### Porta da aplicação (OPCIONAL)
- Se não definida, será usada a porta 3000 por padrão

## Estrutura de pastas:

```bash
Bitcoinzz/
├── backend/
│   ├── server.js         # Ponto de entrada do backend
│   └── src/
│       ├── app.js        # Configuração da aplicação Express
│       ├── config/       # Conexão com o MongoDB
│       ├── controllers/  # Lógica dos endpoints
│       ├── middlewares/  # Autenticação e validação de requisições
│       ├── models/       # Schemas do Mongoose
│       ├── routes/       # Definição de rotas com o Express
│       └── services/     # Integrações com API de cotação de BTC e serviço de e‑mail incompleto (dispara somente no console)
├── frontend/
│   ├── app.js            # Script principal do cliente
│   ├── estilo.css        # Estilos globais
│   ├── index.html        # Página inicial
│   ├── login.html        # Página de login
│   ├── cadastro.html     # Página de cadastro
│   └── dashboard.html    # Página principal de controle do usuário
├── .env
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```
