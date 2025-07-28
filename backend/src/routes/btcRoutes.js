import express from "express";
import { body } from "express-validator";
import BtcController from "../controllers/btcController.js";
import verificarToken from "../middlewares/authMiddleware.js";
import validar from "../middlewares/validacaoMiddleware.js";

const routes = express.Router();

routes.get("/preco", BtcController.obterPreco);

routes.post("/comprar", verificarToken, [body("valor").isFloat({ gt: 0 })
  .withMessage("O valor da compra deve ser maior que zero")], validar,
  BtcController.comprar);

routes.post("/vender", verificarToken, [body("quantidade").isFloat({ gt: 0 })
  .withMessage("A quantidade de BTC deve ser maior que zero")], validar,
  BtcController.vender);

export default routes;

