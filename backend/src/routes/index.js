import express from "express";
import authRotas from "./authRoutes.js";
import carteiraRotas from "./carteiraRoutes.js";
import btcRotas from "./btcRoutes.js";
import apiRoutes from "./apiRoutes.js";

const rotas = (app) => {
  app.route("/").get((_, res) => res.status(200).send("Rotas utilizadas no Bitcoinzz: '/usuarios', '/carteira', '/btc'"));
  app.use(express.json());
  app.use("/usuarios", authRotas);
  app.use("/carteira", carteiraRotas);
  app.use("/btc", btcRotas);
  app.use("/api", apiRoutes)
};

export default rotas;

