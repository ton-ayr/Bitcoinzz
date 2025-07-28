import express from "express";
import { body } from "express-validator";
import AuthController from "../controllers/authController.js";
import validar from "../middlewares/validacaoMiddleware.js";

const routes = express.Router();

routes.get("/", (req, res) => {
  res.json({
    rotas: [
      { metodo: "POST", caminho: "/cadastrar", detalhes: "Cadastro de novo usuário passando nome, email e senha no body" },
      { metodo: "POST", caminho: "/login",     detalhes: "Autentica usuário" }
    ]
  });
});

routes.post("/cadastrar",
  [
    body("nome").notEmpty().withMessage("O nome é obrigatório"),

    body("email").isEmail().withMessage("Informe um e-mail válido"),

    body("senha").isLength({ min: 6 }).withMessage("A senha deve ter pelo menos 6 caracteres")], validar,
  AuthController.registrar
);

routes.post("/login",
  [body("email").isEmail(), body("senha").notEmpty()], validar,
  AuthController.login
);

export default routes;
