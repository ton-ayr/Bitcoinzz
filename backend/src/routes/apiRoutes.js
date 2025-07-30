import express from "express";
const routes = express.Router();

routes.get("/", (req, res) => {
  res.json({
    baseUrl: "https://bitcoinzz.onrender.com",
    endpoints: [
      {
        title: "Cadastrar usuário",
        method: "POST",
        path: "/usuarios/cadastrar",
        description: "Cria um novo usuário.",
        authRequired: false,
        request: {
          body: {
            nome: "string",
            email: "string",
            senha: "string"
          }
        }
      },
      {
        title: "Realizar login",
        method: "POST",
        path: "/usuarios/login",
        description: "Autentica usuário e retorna token JWT.",
        authRequired: false,
        request: {
          body: {
            email: "string",
            senha: "string"
          }
        }
      },
      {
        title: "Cotação do Bitcoin",
        method: "GET",
        path: "/btc/preco",
        description: "Retorna cotação de compra e venda do Bitcoin.",
        authRequired: false,
      },
      {
        title: "Comprar Bitcoin",
        method: "POST",
        path: "/btc/comprar",
        description: "Compra BTC utilizando o saldo em BRL da carteira.",
        authRequired: true,
        headers: {
          Authorization: "Bearer <token>"
        },
        request: {
          body: {
            valor: "number"
          }
        }
      },
      {
        title: "Vender Bitcoin",
        method: "POST",
        path: "/btc/vender",
        description: "Vende BTC da carteira do usuário.",
        authRequired: true,
        headers: {
          Authorization: "Bearer <token>"
        },
        request: {
          body: {
            quantidade: "number"
          }
        }
      },
      {
        title: "Depositar valor na conta",
        method: "POST",
        path: "/carteira/deposito",
        description: "Deposita valor em BRL na carteira do usuário.",
        authRequired: true,
        headers: {
          Authorization: "Bearer <token>"
        },
        request: {
          body: {
            valor: "number"
          }
        }
      },
      {
        title: "Visualizar saldo na conta",
        method: "GET",
        path: "/carteira/saldo",
        description: "Retorna o saldo atual da carteira.",
        authRequired: true,
        headers: {
          Authorization: "Bearer <token>"
        },
        example: {
          curl: `curl /carteira/saldo -H "Authorization: Bearer <token>"`
        }
      }
    ]
  });
});

export default routes;
