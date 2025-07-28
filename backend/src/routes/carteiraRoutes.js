import express from "express";
import { body } from "express-validator";
import CarteiraController from "../controllers/carteiraController.js";
import verificarToken from "../middlewares/authMiddleware.js";
import validar from "../middlewares/validacaoMiddleware.js";

const routes = express.Router();

routes.use(verificarToken);

routes.post("/deposito", [body("valor").isFloat({ gt: 0 })], validar,
  CarteiraController.depositar);

routes.get("/saldo", CarteiraController.consultarSaldo);

export default routes;

